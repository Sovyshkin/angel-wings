import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFileSync, spawnSync } from 'node:child_process'
import express from 'express'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'

test('marketing campaign respects broad-audience consent and delivers direct selections without it', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-email-campaign-'))
  const databasePath = join(directory, 'test.db')
  process.env.DATABASE_URL = `file:${databasePath}`
  process.env.JWT_SECRET = 'email-campaign-test-secret'
  process.env.UPLOAD_DIR = join(directory, 'uploads')
  const sql = execFileSync('npx', ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], { cwd: process.cwd(), env: process.env, encoding: 'utf8' })
  const schema = spawnSync('sqlite3', ['-batch', databasePath], { input: sql, encoding: 'utf8' })
  assert.equal(schema.status, 0, schema.stderr)
  const [{ default: adminRoutes }, { default: emailService }, { recoveryRouter }, { default: marketingRoutes }, { processMarketingCampaignBatch }] = await Promise.all([import('./admin.js'), import('../services/email.js'), import('./recovery.js'), import('./marketingNotices.js'), import('../services/marketingCampaign.js')])
  const originalSend = emailService.sendCampaignEmail
  const sent = []
  emailService.sendCampaignEmail = async message => { sent.push(message) }
  const db = new PrismaClient()
  const app = express()
  app.use(express.json())
  app.use('/api/admin', adminRoutes)
  app.use('/api/recovery', recoveryRouter)
  app.use('/api/marketing-notices', marketingRoutes)
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
    assert.equal(response.status, 202, await response.text())
    const firstCampaign = (await db.emailCampaign.findFirst({ orderBy: { id: 'desc' } }))
    await processMarketingCampaignBatch(db, firstCampaign)
    assert.equal(sent.length, 1)
    assert.equal(sent[0].to, 'anna@campaign.test')
    assert.match(sent[0].html, /Здравствуйте, Анна!/)
    assert.match(sent[0].html, /Отписаться от рассылки/)
    assert.match(sent[0].text, /https:\/\/angel-wings.ru\/product\/42/)
    const imageForm = new FormData()
    imageForm.append('image', new Blob([Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9WlQXvMAAAAASUVORK5CYII=', 'base64')], { type: 'image/png' }), 'campaign.png')
    const imageUpload = await fetch(`${base}/image`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: imageForm })
    const uploadedImage = await imageUpload.json()
    assert.equal(imageUpload.status, 201, JSON.stringify(uploadedImage))
    assert.match(uploadedImage.imageUrl, /^https:\/\/angel-wings\.ru\/uploads\/[a-f\d-]+\.png$/)
    const fakeImage = new FormData()
    fakeImage.append('image', new Blob(['not an image'], { type: 'image/png' }), 'fake.png')
    const rejectedImage = await fetch(`${base}/image`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fakeImage })
    assert.equal(rejectedImage.status, 400)
    const selectedUser = await db.user.create({ data: { email: 'selected@campaign.test', password: 'unused', name: 'Выбранный', role: 'PARTNER', telegramId: '123456789', marketingConsentAt: new Date() } })
    const optedOut = await db.user.findUnique({ where: { email: 'unsubscribed@campaign.test' } })
    const selectedPayload = { ...payload, audience: 'selected', targetUserIds: [selectedUser.id, optedOut.id], siteEnabled: true, siteBody: 'Скидка на товар для {{name}}', telegramEnabled: true, telegramBody: 'Новинка для {{name}}', imageUrl: uploadedImage.imageUrl }
    const selectedPreview = await request('/preview', selectedPayload)
    assert.equal(selectedPreview.status, 200)
    const selectedPreviewData = await selectedPreview.json()
    assert.equal(selectedPreviewData.count, 1)
    assert.deepEqual(selectedPreviewData.channels, { total: 1, email: 1, telegram: 1, site: 1 })
    assert.equal(selectedPreviewData.selectedCount, 2)
    assert.deepEqual(selectedPreviewData.excluded, [{ id: optedOut.id, name: optedOut.name, email: optedOut.email, reason: 'Пользователь отписался от рассылки' }])
    const noConsent = await db.user.create({ data: { email: 'without-consent@campaign.test', password: 'unused', name: 'Без согласия', role: 'USER' } })
    const detailedPreview = await request('/preview', { ...selectedPayload, targetUserIds: [selectedUser.id, optedOut.id, noConsent.id, admin.id] })
    const detailedData = await detailedPreview.json()
    assert.equal(detailedPreview.status, 200)
    assert.equal(detailedData.selectedCount, 4)
    assert.equal(detailedData.count, 3)
    assert.deepEqual(detailedData.channels, { total: 3, email: 3, telegram: 1, site: 3 })
    assert.deepEqual(detailedData.excluded.map(user => [user.id, user.reason]), [
      [optedOut.id, 'Пользователь отписался от рассылки']
    ])
    const staleSelection = await request('', { ...selectedPayload, expectedCount: 1, expectedAudienceHash: 'old-audience' })
    assert.equal(staleSelection.status, 409)
    const selectedSend = await request('', { ...selectedPayload, expectedCount: 1, expectedAudienceHash: selectedPreviewData.audienceHash })
    assert.equal(selectedSend.status, 202, await selectedSend.text())
    const selectedCampaign = await db.emailCampaign.findFirst({ orderBy: { id: 'desc' } })
    const telegram = []
    await processMarketingCampaignBatch(db, selectedCampaign, 20, {
      sendEmail: message => emailService.sendCampaignEmail(message),
      sendTelegram: async (chatId, message) => { telegram.push({ chatId, message }) }
    })
    assert.equal((await db.emailCampaign.findUnique({ where: { id: selectedCampaign.id } })).status, 'SENT')
    assert.equal(sent.length, 2)
    assert.equal(sent[1].to, selectedUser.email)
    assert.equal(telegram.length, 1)
    assert.equal(telegram[0].chatId, selectedUser.telegramId)
    assert.equal(telegram[0].message.campaignKey, `news-${selectedCampaign.id}`)
    assert.equal(telegram[0].message.imageType, 'image/png')
    assert.ok(telegram[0].message.imageBase64)
    assert.match(sent[1].html, /<img/)
    const selectedAuth = { Authorization: `Bearer ${jwt.sign({ userId: selectedUser.id, purpose: 'session' }, process.env.JWT_SECRET)}` }
    const siteGet = await fetch(`http://127.0.0.1:${server.address().port}/api/marketing-notices/unseen`, { headers: selectedAuth })
    const siteNotice = (await siteGet.json()).notice
    assert.equal(siteNotice.title, 'Новинка')
    assert.equal(siteNotice.body, 'Скидка на товар для Выбранный')
    const seen = await fetch(`http://127.0.0.1:${server.address().port}/api/marketing-notices/${siteNotice.id}/seen`, { method: 'POST', headers: selectedAuth })
    assert.equal((await seen.json()).seen, true)
    const afterSeen = await fetch(`http://127.0.0.1:${server.address().port}/api/marketing-notices/unseen`, { headers: selectedAuth })
    assert.equal((await afterSeen.json()).notice, null)
    const directPayload = { ...selectedPayload, targetUserIds: [noConsent.id], expectedCount: 1 }
    const directPreview = await request('/preview', directPayload)
    const directPreviewData = await directPreview.json()
    assert.equal(directPreviewData.count, 1)
    const directSend = await request('', { ...directPayload, expectedAudienceHash: directPreviewData.audienceHash })
    assert.equal(directSend.status, 202, await directSend.text())
    const directCampaign = await db.emailCampaign.findFirst({ orderBy: { id: 'desc' } })
    await processMarketingCampaignBatch(db, directCampaign, 20, { sendEmail: message => emailService.sendCampaignEmail(message), sendTelegram: async () => {} })
    assert.equal(sent.at(-1).to, noConsent.email)
    const noConsentAuth = { Authorization: `Bearer ${jwt.sign({ userId: noConsent.id, purpose: 'session' }, process.env.JWT_SECRET)}` }
    const directNotice = await fetch(`http://127.0.0.1:${server.address().port}/api/marketing-notices/unseen`, { headers: noConsentAuth })
    assert.equal((await directNotice.json()).notice.title, 'Новинка')
    const emptySelection = await request('/preview', { ...payload, audience: 'selected', targetUserIds: [] })
    assert.equal(emptySelection.status, 400)
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
