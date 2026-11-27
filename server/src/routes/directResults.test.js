import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import express from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

test('Direct report credits only paid checkout orders to the tagged ad', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-direct-results-'))
  const databasePath = join(directory, 'test.db')
  process.env.DATABASE_URL = `file:${databasePath}`
  process.env.JWT_SECRET = 'direct-results-test-secret'
  const sql = execFileSync('npx', ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], {
    cwd: process.cwd(), env: process.env, encoding: 'utf8'
  })
  const schema = spawnSync('sqlite3', ['-batch', databasePath], { input: sql, encoding: 'utf8' })
  assert.equal(schema.status, 0, schema.stderr)
  const { default: analyticsRouter } = await import('./analytics.js')
  const db = new PrismaClient()
  const app = express()
  app.use('/api/admin/analytics', analyticsRouter)
  app.use((error, _req, res, _next) => res.status(500).json({ error: error.message }))
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)) })
  try {
    const admin = await db.user.create({ data: { email: 'admin@direct.test', password: 'unused', name: 'Admin', role: 'ADMIN' } })
    const customer = { customerName: 'Buyer', customerEmail: 'buyer@direct.test', customerPhone: '+79990000000' }
    const tagged = { utmSource: 'yandex', directCampaignId: '100', directGroupId: '200', directAdId: '300' }
    const order = extra => db.order.create({ data: { ...customer, total: 1000, ...tagged, ...extra } })
    await order({ paymentStatus: 'PAID' })
    await order({ paymentStatus: 'PENDING' })
    await order({ paymentStatus: 'PAID', status: 'CANCELLED' })
    await order({ paymentStatus: 'PAID', origin: 'ADMIN_MANUAL' })
    await order({ paymentStatus: 'PAID', utmSource: 'google' })
    await db.contactRequest.create({ data: { name: 'Buyer', email: 'buyer@direct.test', message: 'Question', ...tagged } })
    const response = await fetch(`http://127.0.0.1:${server.address().port}/api/admin/analytics/direct-results?days=30`, {
      headers: { Authorization: `Bearer ${jwt.sign({ userId: admin.id, purpose: 'session', adminPanel: true }, process.env.JWT_SECRET)}` }
    })
    const responseBody = await response.text()
    assert.equal(response.status, 200, responseBody)
    const data = JSON.parse(responseBody)
    assert.equal(data.summary.ordersCreated, 3)
    assert.equal(data.summary.paidOrders, 1)
    assert.equal(data.summary.paidRevenue, 1000)
    assert.equal(data.summary.leadsSubmitted, 1)
    assert.equal(data.results[0].adId, '300')
  } finally {
    server.close()
    await db.$disconnect()
    await rm(directory, { recursive: true, force: true })
  }
})
