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
import { calculatePartnerBalance } from '../utils/partnerBalance.js'

test('manual order promo discounts once and credits the partner, but never grants consultation points', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-manual-promo-'))
  const databasePath = join(directory, 'test.db')
  process.env.DATABASE_URL = `file:${databasePath}`
  process.env.JWT_SECRET = 'manual-promo-test-secret'
  delete process.env.CLOUDKASSIR_PUBLIC_ID
  delete process.env.CLOUDKASSIR_API_SECRET
  const serverDirectory = join(dirname(fileURLToPath(import.meta.url)), '../..')
  const schemaSql = execFileSync('npx', ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], {
    cwd: serverDirectory, env: process.env, encoding: 'utf8'
  })
  const schemaResult = spawnSync('sqlite3', ['-batch', databasePath], { input: schemaSql, encoding: 'utf8' })
  assert.equal(schemaResult.status, 0, schemaResult.stderr)

  const { default: adminRoutes } = await import('./admin.js')
  const { default: orderRoutes } = await import('./orders.js')
  const db = new PrismaClient()
  const app = express()
  app.use(express.json())
  app.use('/api/admin', adminRoutes)
  app.use('/api/orders', orderRoutes)
  app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.message }))
  const server = await new Promise(resolve => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening))
  })
  try {
    const admin = await db.user.create({ data: { email: 'admin@example.test', password: 'unused', name: 'Admin', role: 'ADMIN' } })
    const partnerUser = await db.user.create({ data: { email: 'partner@example.test', password: 'unused', name: 'Partner', role: 'PARTNER' } })
    const buyer = await db.user.create({ data: { email: 'buyer@example.test', password: 'unused', name: 'Buyer', role: 'USER' } })
    const otherBuyer = await db.user.create({ data: { email: 'other@example.test', password: 'unused', name: 'Other', role: 'USER' } })
    const partner = await db.partner.create({ data: { userId: partnerUser.id, referralCode: 'MANUAL-PROMO', percentage: 10 } })
    const promo = await db.promoCode.create({ data: { code: 'PARTNER10', discountType: 'percentage', discountValue: 10, usageType: 'single', partnerId: partner.id, minOrderAmount: 500 } })
    const product = await db.product.create({ data: { title: 'Товар', slug: 'manual-promo-product', description: '', price: 1000, stock: 10 } })
    const consultation = await db.consultationRequest.create({ data: { userId: buyer.id, customerName: 'Buyer', customerEmail: buyer.email, customerPhone: '+79990000001', specialist: 'Doctor', contactFormat: 'online', question: 'Question', status: 'DONE', completedAt: new Date(Date.now() - 60_000) } })
    const baseUrl = `http://127.0.0.1:${server.address().port}/api/admin/orders`
    const request = (user, path, body) => fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${jwt.sign({ userId: user.id, purpose: 'session' }, process.env.JWT_SECRET)}` } : {}) },
      body: JSON.stringify(body)
    })
    const siteRequest = (user, path, body) => fetch(`http://127.0.0.1:${server.address().port}/api/orders${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({ userId: user.id, purpose: 'session' }, process.env.JWT_SECRET)}` },
      body: JSON.stringify(body)
    })
    const payload = { userId: buyer.id, customerName: 'Buyer', customerEmail: buyer.email, customerPhone: '+79990000001', items: [{ productId: product.id, quantity: 1, price: 1000 }], paymentStatus: 'PAID', promoCode: ' partner10 ' }

    await db.partner.update({ where: { id: partner.id }, data: { isActive: false } })
    const inactiveAdminPreview = await request(admin, '/promo/validate', { userId: buyer.id, subtotal: 1000, promoCode: 'PARTNER10' })
    assert.equal(inactiveAdminPreview.status, 400)
    assert.match((await inactiveAdminPreview.json()).error, /Партнёр промокода неактивен/)
    const inactiveSitePreview = await siteRequest(buyer, '/promo/validate', { code: 'PARTNER10', amount: 1000 })
    assert.equal(inactiveSitePreview.status, 400)
    assert.match((await inactiveSitePreview.json()).error, /Партнёр промокода неактивен/)
    const inactiveSiteOrder = await siteRequest(buyer, '', { ...payload, items: [{ productId: product.id, quantity: 1 }], promoCode: 'PARTNER10' })
    assert.equal(inactiveSiteOrder.status, 400)
    assert.match((await inactiveSiteOrder.json()).error, /Партнёр промокода неактивен/)
    const inactiveAdminOrder = await request(admin, '', payload)
    assert.equal(inactiveAdminOrder.status, 400)
    assert.match((await inactiveAdminOrder.json()).error, /Партнёр промокода неактивен/)
    assert.equal((await db.promoCode.findUnique({ where: { id: promo.id } })).activationCount, 0)
    assert.equal((await db.product.findUnique({ where: { id: product.id } })).stock, 10)
    await db.partner.update({ where: { id: partner.id }, data: { isActive: true } })
    assert.equal((await siteRequest(buyer, '/promo/validate', { code: 'PARTNER10', amount: 1000 })).status, 200)

    const inactiveBoundUser = await db.user.create({ data: { email: 'inactive-bound@manual.test', password: 'unused', name: 'Inactive Bound', role: 'PARTNER' } })
    const inactiveBoundPartner = await db.partner.create({ data: { userId: inactiveBoundUser.id, referralCode: 'INACTIVE-BOUND', isActive: false } })
    const boundBuyer = await db.user.create({ data: { email: 'bound-buyer@manual.test', password: 'unused', name: 'Bound Buyer', role: 'USER' } })
    await db.partnerUser.create({ data: { userId: boundBuyer.id, partnerId: inactiveBoundPartner.id, referralSource: 'test' } })
    const boundAdminPreview = await request(admin, '/promo/validate', { userId: boundBuyer.id, subtotal: 1000, promoCode: 'PARTNER10' })
    assert.equal(boundAdminPreview.status, 400)
    assert.match((await boundAdminPreview.json()).error, /Партнёр не найден или неактивен/)
    const boundSitePreview = await siteRequest(boundBuyer, '/promo/validate', { code: 'PARTNER10', amount: 1000 })
    assert.equal(boundSitePreview.status, 400)
    assert.match((await boundSitePreview.json()).error, /Партнёр, за которым закреплён клиент, неактивен/)
    const boundSiteOrder = await siteRequest(boundBuyer, '', { ...payload, customerEmail: boundBuyer.email, items: [{ productId: product.id, quantity: 1 }], promoCode: 'PARTNER10' })
    assert.equal(boundSiteOrder.status, 400)
    assert.match((await boundSiteOrder.json()).error, /Партнёр, за которым закреплён клиент, неактивен/)
    const historicalBuyer = await db.user.create({ data: { email: 'historical-buyer@manual.test', password: 'unused', name: 'Historical Buyer', role: 'USER' } })
    await db.order.create({ data: { userId: historicalBuyer.id, partnerId: inactiveBoundPartner.id, total: 1000, customerName: historicalBuyer.name, customerEmail: historicalBuyer.email, customerPhone: '+79990000003' } })
    assert.equal((await request(admin, '/promo/validate', { userId: historicalBuyer.id, subtotal: 1000, promoCode: 'PARTNER10' })).status, 400)
    assert.equal((await siteRequest(historicalBuyer, '/promo/validate', { code: 'PARTNER10', amount: 1000 })).status, 400)

    assert.equal((await request(null, '', payload)).status, 401)
    assert.equal((await request(partnerUser, '', payload)).status, 403)
    const preview = await request(admin, '/promo/validate', { userId: buyer.id, subtotal: 1000, promoCode: payload.promoCode })
    const previewBody = await preview.json()
    assert.equal(preview.status, 200, JSON.stringify(previewBody))
    assert.deepEqual(previewBody, { promoCode: 'PARTNER10', discountAmount: 100, partnerId: partner.id })
    assert.equal((await db.promoCode.findUnique({ where: { id: promo.id } })).activationCount, 0)

    const response = await request(admin, '', payload)
    const responseBody = await response.json()
    assert.equal(response.status, 201, JSON.stringify(responseBody))
    const { order: created } = responseBody
    const order = await db.order.findUnique({ where: { id: created.id } })
    assert.equal(order.promoCodeId, promo.id)
    assert.equal(order.origin, 'ADMIN_MANUAL')
    assert.equal(order.partnerId, partner.id)
    assert.equal(order.discountAmount, 100)
    assert.equal(order.total, 900)
    assert.equal(order.paymentAmount, 900)
    assert.equal((await db.promoCode.findUnique({ where: { id: promo.id } })).activationCount, 1)
    assert.equal((await db.partnerUser.findUnique({ where: { userId: buyer.id } })).promoCodeId, promo.id)
    assert.equal((await db.partnerCommission.findUnique({ where: { orderId: order.id } })).amount, 90)
    assert.equal(await db.partnerCommission.count({ where: { orderId: order.id } }), 1)
    assert.equal((await calculatePartnerBalance(db, partner.id)).totalCommissions, 90)
    assert.equal((await db.user.findUnique({ where: { id: buyer.id } })).pointsBalance, 0)
    assert.equal((await db.consultationRequest.findUnique({ where: { id: consultation.id } })).rewardOrderId, null)
    assert.equal(await db.userPointTransaction.count({ where: { userId: buyer.id, orderId: order.id, type: 'CONSULTATION_REWARD' } }), 0)

    const repeated = await request(admin, '', { ...payload, userId: otherBuyer.id, customerEmail: otherBuyer.email })
    assert.equal(repeated.status, 400, await repeated.text())
    assert.equal(await db.order.count(), 2)
    assert.equal((await db.promoCode.findUnique({ where: { id: promo.id } })).activationCount, 1)
    assert.equal((await db.product.findUnique({ where: { id: product.id } })).stock, 9)

    const ownPromo = await db.promoCode.create({ data: { code: 'OWN10', discountType: 'percentage', discountValue: 10, partnerId: partner.id } })
    const ownResponse = await request(admin, '', { ...payload, userId: partnerUser.id, customerEmail: partnerUser.email, promoCode: ownPromo.code })
    assert.equal(ownResponse.status, 400, await ownResponse.text())
    assert.equal(await db.order.count(), 2)

    const firstPurchasePromo = await db.promoCode.create({ data: { code: 'FIRST10', discountType: 'percentage', discountValue: 10, isFirstPurchase: true } })
    const firstPurchasePreview = await request(admin, '/promo/validate', { userId: buyer.id, subtotal: 1000, promoCode: firstPurchasePromo.code })
    assert.equal(firstPurchasePreview.status, 400)
    const minimumPromo = await db.promoCode.create({ data: { code: 'MINIMUM10', discountType: 'percentage', discountValue: 10, minOrderAmount: 2000 } })
    const minimumPreview = await request(admin, '/promo/validate', { userId: otherBuyer.id, subtotal: 1000, promoCode: minimumPromo.code })
    assert.equal(minimumPreview.status, 400)

    await db.consultationRequest.create({ data: { userId: otherBuyer.id, customerName: 'Other', customerEmail: otherBuyer.email, customerPhone: '+79990000002', specialist: 'Doctor', contactFormat: 'online', question: 'Question', status: 'DONE', completedAt: new Date(Date.now() - 60_000) } })
    const reusablePromo = await db.promoCode.create({ data: { code: 'PENDING125', discountType: 'fixed', discountValue: 125.5, usageType: 'multi', maxActivations: 0, partnerId: partner.id } })
    const pendingResponse = await request(admin, '', { ...payload, userId: otherBuyer.id, customerEmail: otherBuyer.email, promoCode: reusablePromo.code, paymentStatus: 'PENDING' })
    const pendingBody = await pendingResponse.json()
    assert.equal(pendingResponse.status, 201, JSON.stringify(pendingBody))
    const pendingOrderId = pendingBody.order.id
    assert.equal((await db.promoCode.findUnique({ where: { id: reusablePromo.id } })).activationCount, 1)
    assert.equal((await db.order.findUnique({ where: { id: pendingOrderId } })).total, 874.5)
    assert.equal(await db.partnerCommission.count({ where: { orderId: pendingOrderId } }), 0)
    assert.equal((await db.user.findUnique({ where: { id: otherBuyer.id } })).pointsBalance, 0)

    const pay = () => fetch(`${baseUrl}/${pendingOrderId}/payment-status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({ userId: admin.id, purpose: 'session' }, process.env.JWT_SECRET)}` },
      body: JSON.stringify({ paymentStatus: 'PAID' })
    })
    assert.equal((await pay()).status, 200)
    assert.equal((await pay()).status, 200)
    assert.equal(await db.partnerCommission.count({ where: { orderId: pendingOrderId } }), 1)
    assert.equal((await db.partnerCommission.findUnique({ where: { orderId: pendingOrderId } })).amount, 87.45)
    assert.equal((await db.promoCode.findUnique({ where: { id: reusablePromo.id } })).activationCount, 1)
    assert.equal((await db.user.findUnique({ where: { id: otherBuyer.id } })).pointsBalance, 0)
    assert.equal(await db.userPointTransaction.count({ where: { userId: otherBuyer.id, orderId: pendingOrderId, type: 'CONSULTATION_REWARD' } }), 0)
  } finally {
    await db.$disconnect()
    await new Promise(resolve => server.close(resolve))
    await rm(directory, { recursive: true, force: true })
  }
})
