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

test('admin can unbind and rebind a buyer without changing old commissions', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-partner-binding-'))
  const databasePath = join(directory, 'test.db')
  process.env.DATABASE_URL = `file:${databasePath}`
  process.env.JWT_SECRET = 'partner-binding-test-secret'
  const serverDirectory = join(dirname(fileURLToPath(import.meta.url)), '../..')
  const schemaSql = execFileSync('npx', ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], {
    cwd: serverDirectory, env: process.env, encoding: 'utf8'
  })
  const schemaResult = spawnSync('sqlite3', ['-batch', databasePath], { input: schemaSql, encoding: 'utf8' })
  assert.equal(schemaResult.status, 0, schemaResult.stderr)

  const [{ default: adminRoutes }, { default: orderRoutes }] = await Promise.all([import('./admin.js'), import('./orders.js')])
  const db = new PrismaClient()
  const app = express()
  app.use(express.json())
  app.use('/api/admin', adminRoutes)
  app.use('/api/orders', orderRoutes)
  app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.message }))
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)) })
  try {
    const admin = await db.user.create({ data: { email: 'admin@binding.test', password: 'unused', name: 'Admin', role: 'ADMIN' } })
    const oldOwner = await db.user.create({ data: { email: 'old@binding.test', password: 'unused', name: 'Old partner', role: 'PARTNER' } })
    const newOwner = await db.user.create({ data: { email: 'new@binding.test', password: 'unused', name: 'New partner', role: 'PARTNER' } })
    const buyer = await db.user.create({ data: { email: 'buyer@binding.test', password: 'unused', name: 'Buyer' } })
    const oldPartner = await db.partner.create({ data: { userId: oldOwner.id, referralCode: 'OLD-BINDING', percentage: 10 } })
    const newPartner = await db.partner.create({ data: { userId: newOwner.id, referralCode: 'NEW-BINDING', percentage: 12 } })
    const promo = await db.promoCode.create({ data: { code: 'OLD10', partnerId: oldPartner.id, discountValue: 10, usageType: 'multi', maxActivations: 0 } })
    const product = await db.product.create({ data: { title: 'Product', slug: 'binding-product', description: '', price: 1000, stock: 10 } })
    await db.partnerUser.create({ data: { userId: buyer.id, partnerId: oldPartner.id } })
    const oldOrder = await db.order.create({ data: { userId: buyer.id, partnerId: oldPartner.id, total: 1000, paymentStatus: 'PAID', customerName: 'Buyer', customerEmail: buyer.email, customerPhone: '+79990000000' } })
    await db.partnerCommission.create({ data: { partnerId: oldPartner.id, userId: buyer.id, orderId: oldOrder.id, amount: 100, percentage: 10 } })

    const base = `http://127.0.0.1:${server.address().port}`
    const token = jwt.sign({ userId: admin.id, purpose: 'session' }, process.env.JWT_SECRET)
    const request = async (method, path, body) => {
      const response = await fetch(`${base}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        ...(body ? { body: JSON.stringify(body) } : {})
      })
      return { status: response.status, body: await response.json() }
    }
    const bindingPath = `/api/admin/users/${buyer.id}/partner-binding`
    const orderPayload = { userId: buyer.id, customerName: 'Buyer', customerEmail: buyer.email, customerPhone: '+79990000000', items: [{ productId: product.id, quantity: 1, price: 1000 }], paymentStatus: 'PAID', promoCode: promo.code }

    const removed = await request('PUT', bindingPath, { partnerId: null })
    assert.equal(removed.status, 200, JSON.stringify(removed.body))
    assert.equal(removed.body.partnerBindingDisabled, true)
    assert.equal(await db.partnerUser.findUnique({ where: { userId: buyer.id } }), null)
    const siteResponse = await fetch(`${base}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt.sign({ userId: buyer.id, purpose: 'session' }, process.env.JWT_SECRET)}` },
      body: JSON.stringify({
        customerName: 'Buyer', customerEmail: buyer.email, customerPhone: '+79990000000',
        items: [{ productId: product.id, quantity: 1 }], delivery: { type: 'self_pickup', price: 0 }, promoCode: promo.code
      })
    })
    const siteBody = await siteResponse.json()
    assert.equal(siteResponse.status, 201, JSON.stringify(siteBody))
    assert.equal(siteBody.order.partnerId, null)
    assert.equal(siteBody.order.promoCodeId, promo.id)
    assert.equal(await db.partnerUser.findUnique({ where: { userId: buyer.id } }), null)
    const unboundOrder = await request('POST', '/api/admin/orders', orderPayload)
    assert.equal(unboundOrder.status, 201, JSON.stringify(unboundOrder.body))
    assert.equal(unboundOrder.body.order.partnerId, null)
    assert.equal(unboundOrder.body.order.discountAmount, 100)
    assert.equal(await db.partnerCommission.findUnique({ where: { orderId: unboundOrder.body.order.id } }), null)

    const assigned = await request('PUT', bindingPath, { partnerId: newPartner.id })
    assert.equal(assigned.status, 200, JSON.stringify(assigned.body))
    assert.equal(assigned.body.partnerUser.partnerId, newPartner.id)
    assert.equal(assigned.body.partnerBindingDisabled, false)
    const reboundOrder = await request('POST', '/api/admin/orders', orderPayload)
    assert.equal(reboundOrder.status, 201, JSON.stringify(reboundOrder.body))
    assert.equal(reboundOrder.body.order.partnerId, newPartner.id)
    const newCommission = await db.partnerCommission.findUnique({ where: { orderId: reboundOrder.body.order.id } })
    assert.equal(newCommission.partnerId, newPartner.id)
    assert.equal(newCommission.amount, 108)
    assert.equal((await db.partnerCommission.findUnique({ where: { orderId: oldOrder.id } })).partnerId, oldPartner.id)
    assert.equal((await db.partnerCommission.findUnique({ where: { orderId: oldOrder.id } })).amount, 100)
  } finally {
    await new Promise(resolve => server.close(resolve))
    await db.$disconnect()
    await rm(directory, { recursive: true, force: true })
  }
})
