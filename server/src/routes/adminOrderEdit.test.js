import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'
import express from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { calculatePartnerBalance } from '../utils/partnerBalance.js'

test('only an admin can edit a paid order; bank amount stays fixed, stock and audit change', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-order-edit-'))
  const databasePath = join(directory, 'test.db')
  process.env.DATABASE_URL = `file:${databasePath}`
  process.env.JWT_SECRET = 'order-edit-test-secret'
  const serverDirectory = join(dirname(fileURLToPath(import.meta.url)), '../..')
  const schemaSql = execFileSync('npx', ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], {
    cwd: serverDirectory, env: process.env, encoding: 'utf8'
  })
  const schemaResult = spawnSync('sqlite3', ['-batch', databasePath], { input: schemaSql, encoding: 'utf8' })
  assert.equal(schemaResult.status, 0, schemaResult.stderr)

  const { default: adminRoutes } = await import('./admin.js')
  const db = new PrismaClient()
  const app = express()
  app.use(express.json())
  app.use('/api/admin', adminRoutes)
  app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.message }))
  const server = await new Promise(resolve => {
    const listening = app.listen(0, '127.0.0.1', () => resolve(listening))
  })
  try {
    const admin = await db.user.create({ data: { email: 'admin@example.test', password: 'unused', name: 'Admin', role: 'ADMIN' } })
    const partner = await db.user.create({ data: { email: 'partner@example.test', password: 'unused', name: 'Partner', role: 'PARTNER' } })
    const buyer = await db.user.create({ data: { email: 'buyer@example.test', password: 'unused', name: 'Buyer', role: 'USER' } })
    const referral = await db.partner.create({ data: { userId: partner.id, referralCode: 'ORDER-EDIT-TEST', percentage: 10 } })
    const first = await db.product.create({ data: { title: 'Первый', slug: 'first', description: '', price: 1000, stock: 9 } })
    const second = await db.product.create({ data: { title: 'Второй', slug: 'second', description: '', price: 700, stock: 6 } })
    const order = await db.order.create({
      data: {
        customerName: 'Покупатель', customerEmail: 'buyer@example.test', customerPhone: '+79990000000',
        status: 'PROCESSING', paymentStatus: 'PAID', paymentId: 'bank-payment-1', paymentAmount: 1000, total: 1000,
        userId: buyer.id, partnerId: referral.id,
        items: { create: [{ productId: first.id, quantity: 1, price: 1000 }] }
      },
      include: { items: true }
    })
    const originalCommission = await db.partnerCommission.create({ data: { partnerId: referral.id, orderId: order.id, userId: buyer.id, amount: 100, percentage: 10 } })
    const url = `http://127.0.0.1:${server.address().port}/api/admin/orders/${order.id}`
    const body = {
      expectedUpdatedAt: order.updatedAt.toISOString(),
      expectedEditVersion: order.editVersion,
      items: [
        { id: order.items[0].id, productId: first.id, quantity: 1, price: 1000 },
        { productId: second.id, quantity: 2, price: 700 }
      ]
    }
    const send = (user, payload) => fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({ userId: user.id, purpose: 'session' }, process.env.JWT_SECRET)}` },
      body: JSON.stringify(payload)
    })

    const cdekUrl = `http://127.0.0.1:${server.address().port}/api/admin/orders/999999/cdek-register`
    assert.equal((await fetch(cdekUrl, { method: 'POST' })).status, 401)
    assert.equal((await fetch(cdekUrl, { method: 'POST', headers: { Authorization: `Bearer ${jwt.sign({ userId: partner.id, purpose: 'session' }, process.env.JWT_SECRET)}` } })).status, 403)
    assert.equal((await fetch(cdekUrl, { method: 'POST', headers: { Authorization: `Bearer ${jwt.sign({ userId: admin.id, purpose: 'session' }, process.env.JWT_SECRET)}` } })).status, 404)

    assert.equal((await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })).status, 401)
    assert.equal((await send(partner, body)).status, 403)
    const response = await send(admin, body)
    assert.equal(response.status, 200, await response.text())
    const updated = await db.order.findUnique({ where: { id: order.id }, include: { items: true } })
    assert.equal(updated.total, 2400)
    assert.equal(updated.paymentAmount, 1000)
    assert.equal(updated.paymentId, 'bank-payment-1')
    assert.equal(updated.unbilledAdjustment, 1400)
    assert.equal(updated.items.length, 2)
    assert.equal(updated.items.find(item => item.productId === second.id).adminAddedById, admin.id)
    assert.equal(updated.items.find(item => item.productId === second.id).adminUnbilled, true)
    assert.equal((await db.product.findUnique({ where: { id: second.id } })).stock, 4)
    assert.equal(await db.orderEditLog.count({ where: { orderId: order.id, adminId: admin.id } }), 1)
    let commission = await db.partnerCommission.findUnique({ where: { orderId: order.id } })
    assert.equal(commission.id, originalCommission.id)
    assert.equal(commission.amount, 240)
    assert.equal(commission.percentage, 10)
    assert.equal(await db.partnerCommission.count({ where: { orderId: order.id } }), 1)
    assert.equal((await calculatePartnerBalance(db, referral.id)).totalCommissions, 240)

    const staleResponse = await send(admin, body)
    assert.equal(staleResponse.status, 409, await staleResponse.text())
    assert.equal((await db.partnerCommission.findUnique({ where: { orderId: order.id } })).amount, 240)

    const repeatResponse = await send(admin, {
      expectedUpdatedAt: updated.updatedAt.toISOString(),
      expectedEditVersion: updated.editVersion,
      items: updated.items.map(item => ({ id: item.id, productId: item.productId, quantity: item.quantity, price: item.price }))
    })
    assert.equal(repeatResponse.status, 200, await repeatResponse.text())
    const repeated = await db.order.findUnique({ where: { id: order.id }, include: { items: true } })
    assert.equal((await db.partnerCommission.findUnique({ where: { orderId: order.id } })).amount, 240)
    assert.equal(await db.partnerCommission.count({ where: { orderId: order.id } }), 1)
    assert.equal((await calculatePartnerBalance(db, referral.id)).totalCommissions, 240)

    const removeResponse = await send(admin, {
      expectedUpdatedAt: repeated.updatedAt.toISOString(),
      expectedEditVersion: repeated.editVersion,
      items: [{ id: repeated.items.find(item => item.productId === first.id).id, productId: first.id, quantity: 1, price: 1000 }]
    })
    assert.equal(removeResponse.status, 200, await removeResponse.text())
    assert.equal((await db.product.findUnique({ where: { id: second.id } })).stock, 6)
    assert.equal((await db.partnerCommission.findUnique({ where: { orderId: order.id } })).amount, 100)
    assert.equal((await calculatePartnerBalance(db, referral.id)).totalCommissions, 100)

    const remaining = await db.order.findUnique({ where: { id: order.id }, include: { items: true } })
    const replaceResponse = await send(admin, {
      expectedUpdatedAt: remaining.updatedAt.toISOString(),
      expectedEditVersion: remaining.editVersion,
      items: [{ productId: second.id, quantity: 1, price: 0 }]
    })
    assert.equal(replaceResponse.status, 200, await replaceResponse.text())
    const replaced = await db.order.findUnique({ where: { id: order.id }, include: { items: true } })
    assert.equal(replaced.total, 0)
    assert.equal(replaced.paymentAmount, 1000)
    assert.equal(replaced.paymentId, 'bank-payment-1')
    assert.equal(replaced.items[0].price, 0)
    assert.equal(replaced.items[0].adminUnbilled, true)
    commission = await db.partnerCommission.findUnique({ where: { orderId: order.id } })
    assert.equal(commission.id, originalCommission.id)
    assert.equal(commission.amount, 0)
    assert.equal(await db.partnerCommission.count({ where: { orderId: order.id } }), 1)
    assert.equal((await calculatePartnerBalance(db, referral.id)).totalCommissions, 0)
    assert.equal((await db.product.findUnique({ where: { id: first.id } })).stock, 10)
    assert.equal((await db.product.findUnique({ where: { id: second.id } })).stock, 5)

    const variants = await db.product.create({ data: {
      title: 'С дозировками', slug: 'with-dosages', description: '', price: 1000, stock: 6,
      specs: JSON.stringify({ dosages: [{ dosage: '20 мг', quantity: 1 }, { dosage: '40 мг', quantity: 5 }] })
    } })
    const variantOrder = await db.order.create({ data: {
      customerName: 'Покупатель', customerEmail: 'buyer@example.test', customerPhone: '+79990000000',
      status: 'PROCESSING', paymentStatus: 'PENDING', total: 1000, userId: buyer.id,
      items: { create: [{ productId: variants.id, dosage: '20 мг', quantity: 1, dosageStockDeducted: 1, price: 1000 }] }
    }, include: { items: true } })
    const variantUrl = `http://127.0.0.1:${server.address().port}/api/admin/orders/${variantOrder.id}`
    const editVariant = (existing, items) => fetch(variantUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({ userId: admin.id, purpose: 'session' }, process.env.JWT_SECRET)}` },
      body: JSON.stringify({ expectedUpdatedAt: existing.updatedAt.toISOString(), expectedEditVersion: existing.editVersion, items })
    })
    const swapResponse = await editVariant(variantOrder, [{ id: variantOrder.items[0].id, productId: variants.id, dosage: '40 мг', quantity: 1, price: 1000 }])
    assert.equal(swapResponse.status, 200, await swapResponse.text())
    const afterSwap = await db.order.findUnique({ where: { id: variantOrder.id }, include: { items: true } })
    const afterSwapProduct = await db.product.findUnique({ where: { id: variants.id } })
    assert.equal(afterSwapProduct.stock, 6)
    assert.deepEqual(JSON.parse(afterSwapProduct.specs).dosages.map(item => item.quantity), [2, 4])
    assert.equal(afterSwap.items[0].dosageStockDeducted, 1)

    const legacy = await db.product.create({ data: {
      title: 'Старая партия', slug: 'legacy-dosages', description: '', price: 1000, stock: 4,
      specs: JSON.stringify({ dosages: [{ dosage: '20 мг', quantity: 5 }, { dosage: '40 мг', quantity: 4 }] })
    } })
    const legacyOrder = await db.order.create({ data: {
      customerName: 'Покупатель', customerEmail: 'buyer@example.test', customerPhone: '+79990000000',
      status: 'PROCESSING', paymentStatus: 'PENDING', total: 1000, userId: buyer.id,
      items: { create: [{ productId: legacy.id, dosage: '20 мг', quantity: 1, price: 1000 }] }
    }, include: { items: true } })
    const legacyEditUrl = `http://127.0.0.1:${server.address().port}/api/admin/orders/${legacyOrder.id}`
    const legacyResponse = await fetch(legacyEditUrl, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({ userId: admin.id, purpose: 'session' }, process.env.JWT_SECRET)}` },
      body: JSON.stringify({
        expectedUpdatedAt: legacyOrder.updatedAt.toISOString(), expectedEditVersion: legacyOrder.editVersion,
        items: [{ id: legacyOrder.items[0].id, productId: legacy.id, dosage: '40 мг', quantity: 1, price: 1000 }]
      })
    })
    assert.equal(legacyResponse.status, 200, await legacyResponse.text())
    const afterLegacy = await db.product.findUnique({ where: { id: legacy.id } })
    assert.equal(afterLegacy.stock, 4)
    assert.deepEqual(JSON.parse(afterLegacy.specs).dosages.map(item => item.quantity), [5, 3])
  } finally {
    await db.$disconnect()
    await new Promise(resolve => server.close(resolve))
    await rm(directory, { recursive: true, force: true })
  }
})
