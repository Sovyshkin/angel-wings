import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import { validateCampaignSettings, previewCampaign, prepareCampaign, processCampaignBatch, renderCampaignText } from './customPointsCampaign.js'
import { claimPointsCampaignOffer } from './pointsCampaign.js'

test('custom campaign previews by paid purchases and channels, prepares once, and credits once', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-custom-campaign-'))
  const databasePath = join(directory, 'test.db')
  process.env.DATABASE_URL = `file:${databasePath}`
  const serverDirectory = join(dirname(fileURLToPath(import.meta.url)), '../..')
  const sql = execFileSync('npx', ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], { cwd: serverDirectory, env: process.env, encoding: 'utf8' })
  const created = spawnSync('sqlite3', ['-batch', databasePath], { input: sql, encoding: 'utf8' })
  assert.equal(created.status, 0, created.stderr)
  const db = new PrismaClient()
  try {
    const now = new Date()
    const settings = validateCampaignSettings({ title: 'Тестовый подарок', amount: 2500, lookbackDays: 45, maxPaidOrders: 1, roles: ['USER'], emailEnabled: true, telegramEnabled: true, siteEnabled: true, validityDays: 14 })
    const first = await db.user.create({ data: { name: 'Анна', email: 'anna@example.com', emailVerified: true, password: 'unused', telegramId: '123456' } })
    const second = await db.user.create({ data: { name: 'Борис', email: 'boris@example.com', emailVerified: true, password: 'unused' } })
    const partner = await db.user.create({ data: { name: 'Партнёр', email: 'partner@example.com', emailVerified: true, password: 'unused', role: 'PARTNER' } })
    const order = (id, userId, customerEmail) => db.order.create({ data: { userId, customerName: 'Покупатель', customerEmail, customerPhone: '+79990000000', total: 500, paymentStatus: 'PAID', status: 'PROCESSING', createdAt: new Date(now.getTime() - id * 1000) } })
    await order(1, second.id, second.email)
    await order(2, null, second.email)
    const { counts } = await previewCampaign(db, settings, now)
    assert.deepEqual([counts.checked, counts.eligible, counts.excludedPurchases, counts.email, counts.telegram, counts.site], [2, 1, 1, 1, 1, 1])
    assert.equal(counts.pointsIfAllClaim, 2500)
    assert.equal(renderCampaignText('Для {{name}}: {{points}}', { name: first.name, points: '2 500' }), 'Для Анна: 2 500')
    const campaign = await db.pointsCampaign.create({ data: { key: 'gift-test-2026-01-01', settingsJson: JSON.stringify(settings) } })
    await assert.rejects(prepareCampaign(db, campaign, { ...counts, email: 2 }), /Аудитория изменилась/)
    await prepareCampaign(db, campaign, counts)
    await assert.rejects(prepareCampaign(db, campaign, counts), /уже подготовлена|черновик/)
    const offer = await db.pointCampaignOffer.findUnique({ where: { campaignKey_userId: { campaignKey: campaign.key, userId: first.id } } })
    assert.equal(offer.amount, 2500)
    assert.equal(offer.emailStatus, 'PENDING')
    assert.equal(offer.telegramStatus, 'PENDING')
    assert.equal(await db.pointCampaignOffer.count({ where: { userId: partner.id } }), 0)
    await assert.rejects(claimPointsCampaignOffer(db, first.id, now, campaign.key), /Кампания ещё не запущена/)
    await db.pointsCampaign.update({ where: { id: campaign.id }, data: { status: 'SENDING' } })
    let emailSent = 0, telegramSent = 0
    const delivery = { sendEmail: async message => { assert.equal(message.to, first.email); emailSent++ }, sendTelegram: async (chatId, message) => { assert.equal(chatId, first.telegramId); assert.equal(message.campaignKey, campaign.key); telegramSent++ } }
    await processCampaignBatch(db, { ...campaign, status: 'SENDING' }, 20, delivery)
    await processCampaignBatch(db, { ...campaign, status: 'SENDING' }, 20, delivery)
    assert.deepEqual([emailSent, telegramSent], [1, 1])
    assert.equal((await db.pointsCampaign.findUnique({ where: { id: campaign.id } })).status, 'FINISHED')
    const claim = await claimPointsCampaignOffer(db, first.id, now, campaign.key)
    assert.equal(claim.balance, 2500)
    assert.equal(claim.expiresAt.toISOString(), new Date(now.getTime() + 14 * 86400000).toISOString())
    assert.equal((await claimPointsCampaignOffer(db, first.id, now, campaign.key)).alreadyClaimed, true)
    assert.equal(await db.userPointTransaction.count({ where: { userId: first.id, batchId: campaign.key } }), 1)
  } finally {
    await db.$disconnect()
    await rm(directory, { recursive: true, force: true })
  }
})
