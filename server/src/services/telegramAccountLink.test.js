import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import { linkTelegramAccount } from './telegramAccountLink.js'
import { POINTS_CAMPAIGN_KEY } from './pointsCampaign.js'
import { refundUserPointsForOrder } from '../utils/userPoints.js'

test('linking site and Telegram accounts keeps one campaign gift', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-telegram-link-'))
  const databasePath = join(directory, 'test.db')
  process.env.DATABASE_URL = `file:${databasePath}`
  const serverDirectory = join(dirname(fileURLToPath(import.meta.url)), '../..')
  const schemaSql = execFileSync('npx', ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], {
    cwd: serverDirectory, env: process.env, encoding: 'utf8'
  })
  const schemaResult = spawnSync('sqlite3', ['-batch', databasePath], { input: schemaSql, encoding: 'utf8' })
  assert.equal(schemaResult.status, 0, schemaResult.stderr)
  const db = new PrismaClient()
  let sequence = 0
  const now = new Date()
  const expiry = new Date(now.getTime() + 7 * 86400_000)

  async function accountPair({ sourceClaimed, targetClaimed, sourceSpent = 0, targetSpent = 0, sourceHasEmail = false }) {
    const number = ++sequence
    const source = await db.user.create({ data: {
      telegramId: String(900000 + number), email: sourceHasEmail ? `telegram-${number}@example.com` : `tg-${number}@telegram.invalid`, password: 'internal',
      name: 'Telegram User', emailVerified: sourceHasEmail, pointsBalance: sourceClaimed ? 4000 - sourceSpent : 0
    } })
    const target = await db.user.create({ data: {
      email: `customer-${number}@example.com`, password: 'internal', name: 'Site User',
      pointsBalance: targetClaimed ? 4000 - targetSpent : 0
    } })
    const sourceOffer = await db.pointCampaignOffer.create({ data: {
      campaignKey: POINTS_CAMPAIGN_KEY, userId: source.id, claimedAt: sourceClaimed ? now : null,
      expiresAt: sourceClaimed ? expiry : null, remainingPoints: sourceClaimed ? 4000 - sourceSpent : 0
    } })
    const targetOffer = await db.pointCampaignOffer.create({ data: {
      campaignKey: POINTS_CAMPAIGN_KEY, userId: target.id, claimedAt: targetClaimed ? now : null,
      expiresAt: targetClaimed ? expiry : null, remainingPoints: targetClaimed ? 4000 - targetSpent : 0
    } })
    for (const [offer, user, spent] of [[sourceOffer, source, sourceSpent], [targetOffer, target, targetSpent]]) {
      if (!spent) continue
      const order = await db.order.create({ data: {
        userId: user.id, customerName: user.name, customerEmail: user.email,
        customerPhone: '+79990000000', total: 5000, userPointsUsed: spent
      } })
      await db.pointCampaignSpend.create({ data: { offerId: offer.id, orderId: order.id, amount: spent } })
    }
    const verification = await db.emailVerificationCode.create({ data: {
      userId: target.id, email: target.email, codeHash: 'test', purpose: 'telegram_link', expiresAt: expiry
    } })
    return { source, target, verification }
  }

  async function link({ source, target, verification }) {
    return linkTelegramAccount(db, {
      sourceId: source.id, targetId: target.id, telegramId: source.telegramId,
      email: target.email, name: source.name, photoUrl: 'https://example.com/avatar.jpg', verificationId: verification.id
    })
  }

  try {
    const both = await accountPair({ sourceClaimed: true, targetClaimed: true })
    const bothLinked = await link(both)
    assert.equal(bothLinked.pointsBalance, 4000)
    assert.equal(bothLinked.telegramId, both.source.telegramId)
    assert.equal(bothLinked.telegramPhotoUrl, 'https://example.com/avatar.jpg')
    assert.equal((await db.pointCampaignOffer.findUnique({ where: { campaignKey_userId: { campaignKey: POINTS_CAMPAIGN_KEY, userId: both.target.id } } })).remainingPoints, 4000)
    assert.equal((await db.user.findUnique({ where: { id: both.source.id } })).role, 'DELETED')

    const alreadySignedIn = await accountPair({ sourceClaimed: true, targetClaimed: true, sourceHasEmail: true })
    const signedInLinked = await link(alreadySignedIn)
    assert.equal(signedInLinked.email, alreadySignedIn.target.email)
    assert.equal(signedInLinked.pointsBalance, 4000)
    assert.equal((await db.user.findUnique({ where: { id: alreadySignedIn.source.id } })).role, 'DELETED')

    const telegramOnly = await accountPair({ sourceClaimed: true, targetClaimed: false })
    const telegramOnlyLinked = await link(telegramOnly)
    assert.equal(telegramOnlyLinked.pointsBalance, 4000)
    assert.ok((await db.pointCampaignOffer.findUnique({ where: { campaignKey_userId: { campaignKey: POINTS_CAMPAIGN_KEY, userId: telegramOnly.target.id } } })).claimedAt)

    const partlySpent = await accountPair({ sourceClaimed: true, targetClaimed: true, sourceSpent: 1000 })
    const partlySpentLinked = await link(partlySpent)
    assert.equal(partlySpentLinked.pointsBalance, 3000)
    assert.equal((await db.pointCampaignOffer.findUnique({ where: { campaignKey_userId: { campaignKey: POINTS_CAMPAIGN_KEY, userId: partlySpent.target.id } } })).remainingPoints, 3000)
    const spentOrder = await db.order.findFirst({ where: { userId: partlySpent.target.id, customerEmail: partlySpent.source.email } })
    assert.equal((await db.$transaction(tx => refundUserPointsForOrder(tx, { order: spentOrder }))).refunded, 0)
    assert.equal((await db.user.findUnique({ where: { id: partlySpent.target.id } })).pointsBalance, 3000)

    const refundedBeforeMerge = await accountPair({ sourceClaimed: true, targetClaimed: true, sourceSpent: 1000 })
    const refundedOrder = await db.order.findFirst({ where: { userId: refundedBeforeMerge.source.id } })
    await db.pointCampaignOffer.updateMany({ where: { userId: refundedBeforeMerge.source.id }, data: { remainingPoints: { increment: 1000 } } })
    await db.user.update({ where: { id: refundedBeforeMerge.source.id }, data: { pointsBalance: { increment: 1000 } } })
    await db.userPointTransaction.create({ data: {
      userId: refundedBeforeMerge.source.id, orderId: refundedOrder.id,
      amount: 1000, balanceAfter: 4000, type: 'ORDER_REFUND'
    } })
    assert.equal((await link(refundedBeforeMerge)).pointsBalance, 4000)
    const movedRefundedOrder = await db.order.findUnique({ where: { id: refundedOrder.id } })
    assert.equal((await db.$transaction(tx => refundUserPointsForOrder(tx, { order: movedRefundedOrder }))).alreadyRefunded, true)

    const overSpent = await accountPair({ sourceClaimed: true, targetClaimed: true, sourceSpent: 2500, targetSpent: 2500 })
    await assert.rejects(link(overSpent), /сверх лимита акции/)
    assert.equal((await db.emailVerificationCode.findUnique({ where: { id: overSpent.verification.id } })).usedAt, null)
    assert.equal((await db.user.findUnique({ where: { id: overSpent.source.id } })).role, 'USER')
  } finally {
    await db.$disconnect()
    await rm(directory, { recursive: true, force: true })
  }
})
