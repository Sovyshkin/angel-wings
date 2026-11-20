import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import express from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

test('marketing email previews recipients and sends a safe product campaign only to opted-in users', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-email-campaign-'))
  const databasePath = join(directory, 'test.db')
  process.env.DATABASE_URL = `file:${databasePath}`
  process.env.JWT_SECRET = 'email-campaign-test-secret'
  const sql = execFileSync('npx', ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], { cwd: process.cwd(), env: process.env, encoding: 'utf8' })
  const schema = spawnSync('sqlite3', ['-batch', databasePath], { input: sql, encoding: 'utf8' })
  assert.equal(schema.status, 0, schema.stderr)
  const [{ default: adminRoutes }, { default: emailService }, { recoveryRouter }] = await Promise.all([import('./admin.js'), import('../services/email.js'), import('./recovery.js')])
  const originalSend = emailService.sendCampaignEmail
  const sent = []
  emailService.sendCampaignEmail = async message => { sent.push(message) }
  const db = new PrismaClient()
  const app = express()
  app.use(express.json())
  app.use('/api/admin', adminRoutes)
  app.use('/api/recovery', recoveryRouter)
  app.use((error, _req, res, _next) => res.status(error.status || 500).json({ error: error.message }))
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)) })
  try {
    const admin = await db.user.create({ data: { email: 'admin@campaign.test', password: 'unused', name: 'Admin', role: 'ADMIN' } })
    await db.user.create({ data: { email: 'anna@campaign.test', password: 'unused', name: 'Анна', role: 'USER', marketingConsentAt: new Date() } })
    await db.user.create({ data: { email: 'unsubscribed@campaign.test', password: 'unused', name: 'No', role: 'USER', marketingConsentAt: new Date(), marketingUnsubscribedAt: new Date() } })
    await db.user.create({ data: { email: 'unverified@campaign.test', password: 'unused', name: 'No', role: 'USER', emailVerified: false, marketingConsentAt: new Date() } })
    const base = `http://127.0.0.1:${server.address().port}/api/admin/email-campaigns`
    const token = jwt.sign({ userId: admin.id, purpose: 'session', adminPanel: true }, process.env.JWT_SECRET)
    const payload = { audience: 'clients', type: 'NEW_PRODUCT', subject: 'Новый товар', headline: 'Новинка', body: 'Здравствуйте, {{name}}! Узнайте о нашем новом товаре.', buttonText: 'Открыть товар', buttonUrl: 'https://angel-wings.ru/product/42' }
    const request = (path, body) => fetch(base + path, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const preview = await request('/preview', payload)
    const previewData = await preview.json()
    assert.equal(preview.status, 200, JSON.stringify(previewData))
    assert.equal(previewData.count, 1)
    assert.equal(sent.length, 0)
    const changed = await request('', { ...payload, expectedCount: 2 })
    assert.equal(changed.status, 409)
    assert.equal(sent.length, 0)
    const response = await request('', { ...payload, expectedCount: previewData.count })
    assert.equal(response.status, 201, await response.text())
    assert.equal(sent.length, 1)
    assert.equal(sent[0].to, 'anna@campaign.test')
    assert.match(sent[0].html, /Здравствуйте, Анна!/)
    assert.match(sent[0].html, /Отписаться от рассылки/)
    assert.match(sent[0].text, /https:\/\/angel-wings.ru\/product\/42/)
    const unsubscribeUrl = sent[0].text.match(/https:\/\/angel-wings\.ru\/api\/recovery\/unsubscribe\?token=[^\s]+/)?.[0]
    assert.ok(unsubscribeUrl)
    const unsubscribePath = new URL(unsubscribeUrl).pathname + new URL(unsubscribeUrl).search
    const unsubscribe = await fetch(`http://127.0.0.1:${server.address().port}${unsubscribePath}`)
    assert.equal(unsubscribe.status, 200)
    assert.equal((await db.user.findUnique({ where: { email: 'anna@campaign.test' } })).marketingUnsubscribedAt != null, true)
    const afterUnsubscribe = await request('/preview', payload)
    assert.equal((await afterUnsubscribe.json()).count, 0)
  } finally {
    emailService.sendCampaignEmail = originalSend
    await db.$disconnect()
    await new Promise(resolve => server.close(resolve))
    await rm(directory, { recursive: true, force: true })
  }
})
