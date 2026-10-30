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
import emailService from '../services/email.js'
import { resolveManualOrderPromo } from '../utils/manualOrderPromo.js'

test('personal discount belongs to one customer, sends once and appears once on site', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-personal-promo-'))
  const databasePath = join(directory, 'test.db')
  process.env.DATABASE_URL = `file:${databasePath}`
  process.env.JWT_SECRET = 'personal-promo-test-secret'
  const serverDirectory = join(dirname(fileURLToPath(import.meta.url)), '../..')
  const schemaSql = execFileSync('npx', ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], {
    cwd: serverDirectory, env: process.env, encoding: 'utf8'
  })
  const schemaResult = spawnSync('sqlite3', ['-batch', databasePath], { input: schemaSql, encoding: 'utf8' })
  assert.equal(schemaResult.status, 0, schemaResult.stderr)

  const originalSendMail = emailService.sendMail
  const sent = []
  emailService.sendMail = async message => { sent.push(message); return { messageId: 'test' } }
  const [{ default: analyticsRoutes }, { default: orderRoutes }] = await Promise.all([import('./analytics.js'), import('./orders.js')])
  const db = new PrismaClient()
  const app = express()
  app.use(express.json())
  app.use('/api/admin/analytics', analyticsRoutes)
  app.use('/api/orders', orderRoutes)
  app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.message }))
  const server = await new Promise(resolve => { const listening = app.listen(0, '127.0.0.1', () => resolve(listening)) })
  const url = `http://127.0.0.1:${server.address().port}`
  const request = async (user, path, method = 'GET', body) => {
    const response = await fetch(`${url}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${jwt.sign({ userId: user.id, purpose: 'session' }, process.env.JWT_SECRET)}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {})
    })
    return { status: response.status, body: await response.json() }
  }
  try {
    const admin = await db.user.create({ data: { email: 'admin@personal.test', name: 'Admin', password: 'unused', role: 'ADMIN' } })
    const buyer = await db.user.create({ data: { email: 'buyer@personal.test', name: 'Buyer', password: 'unused', marketingConsentAt: new Date() } })
    const stranger = await db.user.create({ data: { email: 'stranger@personal.test', name: 'Stranger', password: 'unused' } })
    const product = await db.product.create({ data: { title: 'Product', slug: 'personal-test-product', description: '', price: 1000, stock: 5 } })
    const order = await db.order.create({ data: { userId: buyer.id, customerName: buyer.name, customerEmail: buyer.email, customerPhone: '+79990000000', total: 1000, paymentStatus: 'PAID', items: { create: { productId: product.id, quantity: 1, price: 1000 } } } })
    const path = '/api/admin/analytics/actions/personal_discount'
    const body = { payload: { userId: buyer.id, productId: product.id, lastOrderId: order.id, discountValue: 80, customerEmail: stranger.email } }
    assert.equal((await request(null, path, 'POST', body)).status, 401)
    assert.equal((await request(stranger, path, 'POST', body)).status, 403)
    const created = await request(admin, path, 'POST', body)
    assert.equal(created.status, 201, JSON.stringify(created.body))
    assert.equal(created.body.emailSent, true)
    const promo = await db.promoCode.findUnique({ where: { id: created.body.promoCode.id } })
    assert.equal(promo.recipientUserId, buyer.id)
    assert.equal(promo.discountValue, 15)
    assert.equal(sent.length, 1)
    assert.equal(sent[0].to, buyer.email)
    assert.match(sent[0].text, new RegExp(promo.code))

    assert.equal((await request(stranger, '/api/orders/promo/validate', 'POST', { code: promo.code, amount: 1000 })).body.error, 'Этот промокод предназначен другому клиенту')
    await assert.rejects(resolveManualOrderPromo(db, { code: promo.code, userId: stranger.id, subtotal: 1000 }), /предназначен другому клиенту/)
    assert.equal((await resolveManualOrderPromo(db, { code: promo.code, userId: buyer.id, subtotal: 1000 })).discountAmount, 150)
    assert.equal((await request(buyer, '/api/orders/promo/validate', 'POST', { code: promo.code, amount: 1000 })).body.discountAmount, 150)
    assert.equal((await request(stranger, '/api/orders/personal-promos/unseen')).body.promos.length, 0)
    assert.equal((await request(buyer, '/api/orders/personal-promos/unseen')).body.promos.length, 1)
    assert.equal((await request(stranger, `/api/orders/personal-promos/${promo.id}/seen`, 'POST')).body.marked, 0)
    assert.equal((await request(buyer, `/api/orders/personal-promos/${promo.id}/seen`, 'POST')).body.marked, 1)
    assert.equal((await request(buyer, '/api/orders/personal-promos/unseen')).body.promos.length, 0)

    const repeated = await request(admin, path, 'POST', body)
    assert.equal(repeated.status, 200)
    assert.equal(await db.promoCode.count(), 1)
    assert.equal(sent.length, 1)

    const secondBuyer = await db.user.create({ data: { email: 'second@personal.test', name: 'Second buyer', password: 'unused', marketingConsentAt: new Date() } })
    const secondOrder = await db.order.create({ data: { userId: secondBuyer.id, customerName: secondBuyer.name, customerEmail: secondBuyer.email, customerPhone: '+79990000002', total: 1000, paymentStatus: 'PAID', items: { create: { productId: product.id, quantity: 1, price: 1000 } } } })
    const secondBody = { payload: { userId: secondBuyer.id, productId: product.id, lastOrderId: secondOrder.id } }
    emailService.sendMail = async () => { throw new Error('temporary mail outage') }
    const failedEmail = await request(admin, path, 'POST', secondBody)
    assert.equal(failedEmail.status, 201)
    assert.equal(failedEmail.body.emailSent, false)
    assert.equal((await request(secondBuyer, '/api/orders/personal-promos/unseen')).body.promos.length, 1)
    emailService.sendMail = async message => { sent.push(message); return { messageId: 'retry' } }
    const retried = await request(admin, path, 'POST', secondBody)
    assert.equal(retried.status, 201)
    assert.equal(retried.body.emailSent, true)
    assert.equal(await db.promoCode.count(), 2)
    assert.equal(sent.length, 2)
  } finally {
    emailService.sendMail = originalSendMail
    await new Promise(resolve => server.close(resolve))
    await db.$disconnect()
    await rm(directory, { recursive: true, force: true })
  }
})
