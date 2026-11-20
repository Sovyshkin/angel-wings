import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import express from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

test('unused partner can be removed without deleting account or linked records', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-partner-delete-'))
  const databasePath = join(directory, 'test.db')
  process.env.DATABASE_URL = `file:${databasePath}`
  process.env.JWT_SECRET = 'partner-delete-test-secret'
  const sql = execFileSync('npx', ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], { cwd: process.cwd(), env: process.env, encoding: 'utf8' })
  const schema = spawnSync('sqlite3', ['-batch', databasePath], { input: sql, encoding: 'utf8' })
  assert.equal(schema.status, 0, schema.stderr)
  const { default: partnerRoutes } = await import('./partner.js')
  const db = new PrismaClient()
  const app = express()
  app.use('/api/admin/partners', partnerRoutes)
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
    assert.equal(await db.partner.findUnique({ where: { id: partner.id } }), null)
    assert.equal((await db.user.findUnique({ where: { id: user.id } })).role, 'USER')
    assert.deepEqual(await db.promoCode.findUnique({ where: { id: promo.id }, select: { partnerId: true, isActive: true } }), { partnerId: null, isActive: false })
    assert.equal((await db.partnerApplication.findUnique({ where: { id: application.id } })).partnerId, null)

    const usedUser = await db.user.create({ data: { email: 'used@delete.test', password: 'unused', name: 'Used', role: 'PARTNER' } })
    const usedPartner = await db.partner.create({ data: { userId: usedUser.id, referralCode: 'USED-DELETE' } })
    await db.partnerPayment.create({ data: { partnerId: usedPartner.id, amount: 100, type: 'PAYOUT' } })
    const blocked = await remove(usedPartner.id)
    assert.equal(blocked.status, 409)
    assert.match((await blocked.json()).error, /операции по балансу и выплатам/)
    assert.ok(await db.partner.findUnique({ where: { id: usedPartner.id } }))
    assert.equal((await db.user.findUnique({ where: { id: usedUser.id } })).role, 'PARTNER')
  } finally {
    await db.$disconnect()
    await new Promise(resolve => server.close(resolve))
    await rm(directory, { recursive: true, force: true })
  }
})
