import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'
import express from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { syncPartnerCommissionForOrder } from '../utils/partnerCommission.js'
import { calculatePartnerBalance } from '../utils/partnerBalance.js'

test('checkout spends customer points before promo and partner profit after promo, atomically and once', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-checkout-discounts-'))
  const databasePath = join(directory, 'test.db')
  process.env.DATABASE_URL = `file:${databasePath}`
  process.env.JWT_SECRET = 'checkout-discounts-test-secret'
  const serverDirectory = join(dirname(fileURLToPath(import.meta.url)), '../..')
  const sql = execFileSync('npx', ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], {
    cwd: serverDirectory, env: process.env, encoding: 'utf8'
  })
  const schema = spawnSync('sqlite3', ['-batch', databasePath], { input: sql, encoding: 'utf8' })
  assert.equal(schema.status, 0, schema.stderr)
  const [{ default: orders }, { default: adminRoutes }] = await Promise.all([import('./orders.js'), import('./admin.js')])
  const db = new PrismaClient()
  const app = express()
  app.use(express.json())
  app.use('/api/orders', orders)
  app.use('/api/admin', adminRoutes)
  app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.message }))
  const server = await new Promise(resolve => { const instance = app.listen(0, '127.0.0.1', () => resolve(instance)) })
  const request = async (user, path, body, method = 'POST') => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
      method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({ userId: user.id, purpose: 'session' }, process.env.JWT_SECRET)}` },
      body: JSON.stringify(body)
    })
    return { status: response.status, body: await response.json() }
  }
  try {
    const createUser = (name, data = {}) => db.user.create({ data: { email: `${name}@discounts.test`, password: 'unused', name, ...data } })
    const admin = await createUser('admin', { role: 'ADMIN' })
    const owner = await createUser('referrer', { role: 'PARTNER' })
    const referral = await db.partner.create({ data: { userId: owner.id, referralCode: 'DISCOUNT-REF', percentage: 10 } })
    const promo = await db.promoCode.create({ data: { code: 'TWENTY', discountType: 'percentage', discountValue: 20, usageType: 'multi', maxActivations: 0, partnerId: referral.id } })
    const product = await db.product.create({ data: { title: 'Test product', slug: 'checkout-discounts', description: '', price: 10000, stock: 30 } })
    const buyer = await createUser('buyer', { pointsBalance: 4000 })
    const payload = (user, extra = {}) => ({
      customerName: user.name, customerEmail: user.email, customerPhone: '+79990000000',
      items: [{ productId: product.id, quantity: 1 }], delivery: { type: 'self_pickup', price: 0 },
      promoCode: promo.code, ...extra
    })
    const preview = await request(buyer, '/api/orders/promo/validate', { code: promo.code, amount: 10000, userPointsAmount: 4000 })
    assert.equal(preview.status, 200, JSON.stringify(preview.body))
    assert.equal(preview.body.discountAmount, 1200)
    assert.equal(preview.body.finalAmount, 4800)
    assert.equal((await db.user.findUnique({ where: { id: buyer.id } })).pointsBalance, 4000)
    assert.equal((await db.promoCode.findUnique({ where: { id: promo.id } })).activationCount, 0)

    const body = payload(buyer, { userPointsAmount: 4000, clientRequestId: 'discount-order-once' })
    const created = await request(buyer, '/api/orders', body)
    assert.equal(created.status, 201, JSON.stringify(created.body))
    assert.equal(created.body.order.total, 4800)
    assert.equal(created.body.order.discountAmount, 5200)
    assert.equal(created.body.order.userPointsUsed, 4000)
    assert.equal((await db.user.findUnique({ where: { id: buyer.id } })).pointsBalance, 0)
    const repeated = await request(buyer, '/api/orders', body)
    assert.equal(repeated.status, 200, JSON.stringify(repeated.body))
    assert.equal(repeated.body.order.id, created.body.order.id)
    assert.equal(await db.userPointTransaction.count({ where: { orderId: created.body.order.id, type: 'ORDER_SPEND' } }), 1)
    assert.equal((await db.promoCode.findUnique({ where: { id: promo.id } })).activationCount, 1)
    await db.order.update({ where: { id: created.body.order.id }, data: { paymentStatus: 'PAID' } })
    await syncPartnerCommissionForOrder(db, created.body.order.id)
    await syncPartnerCommissionForOrder(db, created.body.order.id)
    assert.equal((await db.partnerCommission.findUnique({ where: { orderId: created.body.order.id } })).amount, 480)
    assert.equal(await db.partnerCommission.count({ where: { orderId: created.body.order.id } }), 1)

    // Partner profit alone retains the existing promo-first calculation.
    const partnerUser = await createUser('partner-buyer', { role: 'PARTNER' })
    const partner = await db.partner.create({ data: { userId: partnerUser.id, referralCode: 'BUYER-PARTNER' } })
    await db.partnerPayment.create({ data: { partnerId: partner.id, amount: 10000, type: 'ADMIN_CREDIT', status: 'ADMIN_CREDITED' } })
    const profitOnly = await request(partnerUser, '/api/orders', payload(partnerUser, { partnerBonusAmount: 4000 }))
    assert.equal(profitOnly.status, 201, JSON.stringify(profitOnly.body))
    assert.equal(profitOnly.body.order.total, 4000)
    assert.equal(profitOnly.body.order.partnerBonusAmount, 4000)

    await db.user.update({ where: { id: partnerUser.id }, data: { pointsBalance: 4000 } })
    const combined = await request(partnerUser, '/api/orders', payload(partnerUser, { userPointsAmount: 4000, partnerBonusAmount: 1000, clientRequestId: 'combined-once' }))
    assert.equal(combined.status, 201, JSON.stringify(combined.body))
    assert.equal(combined.body.order.total, 3800)
    assert.equal(combined.body.order.discountAmount, 6200)
    await request(partnerUser, '/api/orders', payload(partnerUser, { userPointsAmount: 4000, partnerBonusAmount: 1000, clientRequestId: 'combined-once' }))
    assert.equal(await db.partnerPayment.count({ where: { partnerId: partner.id, type: 'ORDER_SPEND' } }), 2)

    // Editing a paid order adjusts commission, preserving the payment and deductions.
    let edited = await db.order.update({ where: { id: combined.body.order.id }, data: { paymentStatus: 'PAID' }, include: { items: true } })
    const editItems = [{ id: edited.items[0].id, productId: product.id, quantity: 2, price: 10000 }]
    const edit = await request(admin, `/api/admin/orders/${edited.id}`, { expectedEditVersion: edited.editVersion, expectedUpdatedAt: edited.updatedAt.toISOString(), items: editItems }, 'PUT')
    assert.equal(edit.status, 200, JSON.stringify(edit.body))
    edited = await db.order.findUnique({ where: { id: edited.id }, include: { items: true } })
    assert.equal(edited.discountAmount, 8200)
    assert.equal(edited.total, 11800)
    assert.equal(edited.paymentAmount, 3800)
    assert.equal((await db.partnerCommission.findUnique({ where: { orderId: edited.id } })).amount, 1180)
    assert.equal(await db.userPointTransaction.count({ where: { orderId: edited.id, type: 'ORDER_SPEND' } }), 1)

    const deliveryBuyer = await createUser('delivery', { pointsBalance: 4000 })
    const delivered = await request(deliveryBuyer, '/api/orders', payload(deliveryBuyer, {
      userPointsAmount: 4000,
      delivery: { type: 'pvz_cdek', tariff_code: 136, pickup_point: 'TEST-PVZ', base_price: 100, price: 175 }
    }))
    assert.equal(delivered.status, 201, JSON.stringify(delivered.body))
    assert.equal(delivered.body.order.total, 4800)
    assert.equal(delivered.body.order.deliveryPrice, 136)

    // Points stay whole even for a fractional payable amount. The percentage
    // coupon only discounts the remaining 50 kopecks.
    const smallProduct = await db.product.create({ data: { title: 'Fractional', slug: 'fractional-discounts', description: '', price: 100.5, stock: 2 } })
    const fractionalBuyer = await createUser('fractional', { pointsBalance: 1000 })
    const fractional = await request(fractionalBuyer, '/api/orders', payload(fractionalBuyer, {
      items: [{ productId: smallProduct.id, quantity: 1 }], userPointsAmount: 1000
    }))
    assert.equal(fractional.status, 201, JSON.stringify(fractional.body))
    assert.equal(fractional.body.order.userPointsUsed, 100)
    assert.equal(fractional.body.order.discountAmount, 100.1)
    assert.equal(fractional.body.order.total, 0.4)
    assert.equal((await db.user.findUnique({ where: { id: fractionalBuyer.id } })).pointsBalance, 900)

    const lowBalance = await createUser('low-balance', { pointsBalance: 100 })
    const oldStock = (await db.product.findUnique({ where: { id: product.id } })).stock
    const oldActivations = (await db.promoCode.findUnique({ where: { id: promo.id } })).activationCount
    const rejected = await request(lowBalance, '/api/orders', payload(lowBalance, { userPointsAmount: 4000 }))
    assert.equal(rejected.status, 400, JSON.stringify(rejected.body))
    assert.equal((await db.product.findUnique({ where: { id: product.id } })).stock, oldStock)
    assert.equal((await db.promoCode.findUnique({ where: { id: promo.id } })).activationCount, oldActivations)
    assert.equal(await db.order.count({ where: { userId: lowBalance.id } }), 0)

    // Applying a promo later through admin uses the points already spent.
    const laterBuyer = await createUser('later', { pointsBalance: 4000 })
    const later = await request(laterBuyer, '/api/orders', payload(laterBuyer, { promoCode: '', userPointsAmount: 4000 }))
    assert.equal(later.status, 201, JSON.stringify(later.body))
    const laterOrder = await db.order.findUnique({ where: { id: later.body.order.id } })
    const appliedLater = await request(admin, `/api/admin/orders/${laterOrder.id}/promo`, { promoCode: promo.code, expectedEditVersion: laterOrder.editVersion, expectedUpdatedAt: laterOrder.updatedAt.toISOString() })
    assert.equal(appliedLater.status, 200, JSON.stringify(appliedLater.body))
    assert.equal((await db.order.findUnique({ where: { id: laterOrder.id } })).total, 4800)

    const stockBeforeCancel = (await db.product.findUnique({ where: { id: product.id } })).stock
    const activationsBeforeCancel = (await db.promoCode.findUnique({ where: { id: promo.id } })).activationCount
    const balanceBeforeCancel = (await calculatePartnerBalance(db, partner.id)).availableBalance
    const cancel = () => request(admin, `/api/admin/orders/${edited.id}/status`, { status: 'CANCELLED' }, 'PUT')
    assert.equal((await cancel()).status, 200)
    assert.equal((await db.product.findUnique({ where: { id: product.id } })).stock, stockBeforeCancel + 2)
    assert.equal((await db.promoCode.findUnique({ where: { id: promo.id } })).activationCount, activationsBeforeCancel - 1)
    assert.equal((await calculatePartnerBalance(db, partner.id)).availableBalance, balanceBeforeCancel + 1000)
    assert.equal((await db.partnerPayment.findUnique({ where: { orderId: edited.id } })).status, 'ORDER_SPEND_REFUNDED')
    assert.equal((await db.user.findUnique({ where: { id: partnerUser.id } })).pointsBalance, 4000)
    assert.equal((await cancel()).status, 200)
    assert.equal((await db.product.findUnique({ where: { id: product.id } })).stock, stockBeforeCancel + 2)
    assert.equal((await calculatePartnerBalance(db, partner.id)).availableBalance, balanceBeforeCancel + 1000)

    await db.partnerPayment.update({ where: { orderId: profitOnly.body.order.id }, data: { orderId: null } })
    const legacySpendCancel = await request(admin, `/api/admin/orders/${profitOnly.body.order.id}/status`, { status: 'CANCELLED' }, 'PUT')
    assert.equal(legacySpendCancel.status, 200, JSON.stringify(legacySpendCancel.body))
    assert.equal((await db.partnerPayment.findUnique({ where: { orderId: profitOnly.body.order.id } })).status, 'ORDER_SPEND_REFUNDED')
    assert.equal((await calculatePartnerBalance(db, partner.id)).availableBalance, balanceBeforeCancel + 5000)

    const singlePromo = await db.promoCode.create({ data: {
      code: 'SINGLE-CANCEL', discountType: 'fixed', discountValue: 500,
      usageType: 'single', partnerId: referral.id
    } })
    const singleBuyer = await createUser('single-buyer')
    const singleOrder = await request(singleBuyer, '/api/orders', payload(singleBuyer, { promoCode: singlePromo.code }))
    assert.equal(singleOrder.status, 201, JSON.stringify(singleOrder.body))
    assert.equal((await db.promoCode.findUnique({ where: { id: singlePromo.id } })).activationCount, 1)
    assert.equal((await request(admin, `/api/admin/orders/${singleOrder.body.order.id}/status`, { status: 'CANCELLED' }, 'PUT')).status, 200)
    assert.equal((await db.promoCode.findUnique({ where: { id: singlePromo.id } })).activationCount, 0)
    const reusedSinglePromo = await request(singleBuyer, '/api/orders', payload(singleBuyer, { promoCode: singlePromo.code }))
    assert.equal(reusedSinglePromo.status, 201, JSON.stringify(reusedSinglePromo.body))
    assert.equal((await db.promoCode.findUnique({ where: { id: singlePromo.id } })).activationCount, 1)

    const dosageProduct = await db.product.create({ data: {
      title: 'Dosage', slug: 'cancel-dosage', description: '', price: 1000, stock: 3,
      specs: JSON.stringify({ dosages: [{ dosage: '20 мг', quantity: 3 }] })
    } })
    const dosageBuyer = await createUser('dosage-buyer')
    const dosageOrder = await request(dosageBuyer, '/api/orders', payload(dosageBuyer, {
      promoCode: '', items: [{ productId: dosageProduct.id, selectedDosage: '20 мг', quantity: 2 }]
    }))
    assert.equal(dosageOrder.status, 201, JSON.stringify(dosageOrder.body))
    assert.equal((await db.product.findUnique({ where: { id: dosageProduct.id } })).stock, 1)
    assert.equal((await request(admin, `/api/admin/orders/${dosageOrder.body.order.id}/status`, { status: 'CANCELLED' }, 'PUT')).status, 200)
    const restoredDosage = await db.product.findUnique({ where: { id: dosageProduct.id } })
    assert.equal(restoredDosage.stock, 3)
    assert.equal(JSON.parse(restoredDosage.specs).dosages[0].quantity, 3)
  } finally {
    await new Promise(resolve => server.close(resolve))
    await db.$disconnect()
    await rm(directory, { recursive: true, force: true })
  }
})
