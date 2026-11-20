import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import express from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

test('partner removal archives records, releases bindings and preserves financial history', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-partner-delete-'))
  const databasePath = join(directory, 'test.db')
  process.env.DATABASE_URL = `file:${databasePath}`
  process.env.JWT_SECRET = 'partner-delete-test-secret'
  const sql = execFileSync('npx', ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], { cwd: process.cwd(), env: process.env, encoding: 'utf8' })
  const schema = spawnSync('sqlite3', ['-batch', databasePath], { input: sql, encoding: 'utf8' })
  assert.equal(schema.status, 0, schema.stderr)
  const { default: partnerRoutes } = await import('./partner.js')
  const { default: adminRoutes } = await import('./admin.js')
  const db = new PrismaClient()
  const app = express()
  app.use(express.json())
  app.use('/api/admin/partners', partnerRoutes)
  app.use('/api/admin', adminRoutes)
  app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.message }))
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)) })
  try {
    const admin = await db.user.create({ data: { email: 'admin@delete.test', password: 'unused', name: 'Admin', role: 'ADMIN' } })
    const token = jwt.sign({ userId: admin.id, purpose: 'session', adminPanel: true }, process.env.JWT_SECRET)
    const remove = id => fetch(`http://127.0.0.1:${server.address().port}/api/admin/partners/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    const user = await db.user.create({ data: { email: 'empty@delete.test', password: 'unused', name: 'Ксения', role: 'PARTNER' } })
    const partner = await db.partner.create({ data: { userId: user.id, referralCode: 'EMPTY-DELETE' } })
    const promo = await db.promoCode.create({ data: { code: 'EMPTY-PROMO', discountValue: 10, partnerId: partner.id } })
    const application = await db.partnerApplication.create({ data: { name: 'Ксения', email: user.email, partnerId: partner.id } })
    const response = await remove(partner.id)
    const result = await response.json()
    assert.equal(response.status, 200, JSON.stringify(result))
    const archived = await db.partner.findUnique({ where: { id: partner.id } })
    assert.equal(archived.isActive, false)
    assert.ok(archived.archivedAt)
    assert.equal((await db.user.findUnique({ where: { id: user.id } })).role, 'USER')
    assert.deepEqual(await db.promoCode.findUnique({ where: { id: promo.id }, select: { partnerId: true, isActive: true } }), { partnerId: partner.id, isActive: false })
    assert.equal((await db.partnerApplication.findUnique({ where: { id: application.id } })).partnerId, partner.id)

    const usedUser = await db.user.create({ data: { email: 'used@delete.test', password: 'unused', name: 'Used', role: 'PARTNER' } })
    const usedPartner = await db.partner.create({ data: { userId: usedUser.id, referralCode: 'USED-DELETE' } })
    const payment = await db.partnerPayment.create({ data: { partnerId: usedPartner.id, amount: 100, type: 'PAYOUT' } })
    const buyer = await db.user.create({ data: { email: 'buyer@delete.test', password: 'unused', name: 'Buyer', role: 'USER' } })
    await db.partnerUser.create({ data: { userId: buyer.id, partnerId: usedPartner.id } })
    const order = await db.order.create({ data: { userId: buyer.id, partnerId: usedPartner.id, total: 1000, paymentStatus: 'PAID', customerName: 'Buyer', customerEmail: buyer.email, customerPhone: '+79990000000' } })
    const commission = await db.partnerCommission.create({ data: { partnerId: usedPartner.id, orderId: order.id, userId: buyer.id, amount: 100, percentage: 10 } })
    const archivedWithHistory = await remove(usedPartner.id)
    assert.equal(archivedWithHistory.status, 200, await archivedWithHistory.text())
    assert.ok((await db.partner.findUnique({ where: { id: usedPartner.id } })).archivedAt)
    assert.equal((await db.partnerPayment.findUnique({ where: { id: payment.id } })).partnerId, usedPartner.id)
    assert.equal((await db.partnerCommission.findUnique({ where: { id: commission.id } })).partnerId, usedPartner.id)
    assert.equal((await db.order.findUnique({ where: { id: order.id } })).partnerId, usedPartner.id)
    assert.equal(await db.partnerUser.findUnique({ where: { userId: buyer.id } }), null)
    assert.equal((await db.user.findUnique({ where: { id: usedUser.id } })).role, 'USER')
    const nextUser = await db.user.create({ data: { email: 'next@delete.test', password: 'unused', name: 'Next', role: 'PARTNER' } })
    const nextPartner = await db.partner.create({ data: { userId: nextUser.id, referralCode: 'NEXT-DELETE' } })
    await db.promoCode.create({ data: { code: 'NEXT-PROMO', discountValue: 10, partnerId: nextPartner.id } })
    const preview = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/orders/promo/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: buyer.id, subtotal: 1000, promoCode: 'NEXT-PROMO' })
    })
    assert.equal(preview.status, 200, await preview.text())
    const rebinding = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/partners/partner-users/${buyer.id}/partner`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ partnerId: nextPartner.id })
    })
    assert.equal(rebinding.status, 200, await rebinding.text())
    assert.equal((await db.partnerUser.findUnique({ where: { userId: buyer.id } })).partnerId, nextPartner.id)
    const reactivate = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/partners/promo-codes/${promo.id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ isActive: true })
    })
    assert.equal(reactivate.status, 400)
    assert.equal((await remove(usedPartner.id)).status, 200)
    const list = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/partners`, { headers: { Authorization: `Bearer ${token}` } })
    assert.equal((await list.json()).total, 1)
    const archive = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/partners?archived=true`, { headers: { Authorization: `Bearer ${token}` } })
    const archivedList = await archive.json()
    assert.equal(archivedList.total, 2)
    assert.deepEqual(archivedList.partners.map(item => item.id).sort(), [partner.id, usedPartner.id].sort())
  } finally {
    await db.$disconnect()
    await new Promise(resolve => server.close(resolve))
    await rm(directory, { recursive: true, force: true })
  }
})
