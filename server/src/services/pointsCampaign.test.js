import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync, spawnSync } from 'node:child_process'
import { PrismaClient } from '@prisma/client'
import { claimPointsCampaignOffer, expireDuePointsCampaignOffers, POINTS_CAMPAIGN_KEY } from './pointsCampaign.js'
import { refundUserPointsForOrder, spendUserPoints } from '../utils/userPoints.js'

test('campaign claim is idempotent; only unused points expire after one month', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-points-campaign-'))
  const databasePath = join(directory, 'test.db')
  process.env.DATABASE_URL = `file:${databasePath}`
  const serverDirectory = join(dirname(fileURLToPath(import.meta.url)), '../..')
  const schemaSql = execFileSync('npx', ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], {
    cwd: serverDirectory, env: process.env, encoding: 'utf8'
  })
  const schemaResult = spawnSync('sqlite3', ['-batch', databasePath], { input: schemaSql, encoding: 'utf8' })
  assert.equal(schemaResult.status, 0, schemaResult.stderr)
  const db = new PrismaClient()
  try {
    const user = await db.user.create({ data: { name: 'Customer', email: 'campaign@test.local', password: 'unused' } })
    await db.pointCampaignOffer.create({ data: { campaignKey: POINTS_CAMPAIGN_KEY, userId: user.id } })
    const claimedAt = new Date('2026-10-30T12:00:00.000Z')
    const claim = await claimPointsCampaignOffer(db, user.id, claimedAt)
    assert.equal(claim.alreadyClaimed, false)
    assert.equal(claim.balance, 4000)
    assert.equal(claim.expiresAt.toISOString(), '2026-11-30T12:00:00.000Z')
    const repeat = await claimPointsCampaignOffer(db, user.id, claimedAt)
    assert.equal(repeat.alreadyClaimed, true)
    assert.equal(await db.userPointTransaction.count({ where: { userId: user.id, amount: 4000 } }), 1)

    const order = await db.order.create({ data: { userId: user.id, customerName: user.name, customerEmail: user.email, customerPhone: '+79990000000', total: 1000, userPointsUsed: 1000 } })
    await db.$transaction(tx => spendUserPoints(tx, { userId: user.id, amount: 1000, orderId: order.id }))
    assert.equal((await db.pointCampaignOffer.findFirst({ where: { userId: user.id } })).remainingPoints, 3000)
    assert.equal((await db.user.findUnique({ where: { id: user.id } })).pointsBalance, 3000)

    await db.pointCampaignOffer.updateMany({ where: { userId: user.id }, data: { expiresAt: new Date(Date.now() - 1000) } })
    await assert.rejects(db.$transaction(tx => spendUserPoints(tx, { userId: user.id, amount: 1000, orderId: order.id })), /Недостаточно действующих баллов/)
    assert.equal(await expireDuePointsCampaignOffers(db, new Date('2026-12-01T00:00:00.000Z')), 1)
    assert.equal(await expireDuePointsCampaignOffers(db, new Date('2026-12-01T00:00:00.000Z')), 0)
    assert.equal((await db.user.findUnique({ where: { id: user.id } })).pointsBalance, 0)
    assert.equal((await db.pointCampaignOffer.findFirst({ where: { userId: user.id } })).remainingPoints, 0)
    assert.equal(await db.userPointTransaction.count({ where: { userId: user.id, type: 'CAMPAIGN_EXPIRE', amount: -3000 } }), 1)
    const lateRefund = await db.$transaction(tx => refundUserPointsForOrder(tx, { order }))
    assert.equal(lateRefund.refunded, 0)
    assert.equal((await db.user.findUnique({ where: { id: user.id } })).pointsBalance, 0)
  } finally {
    await db.$disconnect()
    await rm(directory, { recursive: true, force: true })
  }
})

test('refunded campaign spend returns to the expiring bucket before expiry', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'angel-points-refund-'))
  const databasePath = join(directory, 'test.db')
  process.env.DATABASE_URL = `file:${databasePath}`
  const serverDirectory = join(dirname(fileURLToPath(import.meta.url)), '../..')
  const schemaSql = execFileSync('npx', ['prisma', 'migrate', 'diff', '--from-empty', '--to-schema-datamodel', 'prisma/schema.prisma', '--script'], {
    cwd: serverDirectory, env: process.env, encoding: 'utf8'
  })
  const schemaResult = spawnSync('sqlite3', ['-batch', databasePath], { input: schemaSql, encoding: 'utf8' })
  assert.equal(schemaResult.status, 0, schemaResult.stderr)
  const db = new PrismaClient()
  try {
    const user = await db.user.create({ data: { name: 'Customer', email: 'refund@test.local', password: 'unused' } })
    await db.pointCampaignOffer.create({ data: { campaignKey: POINTS_CAMPAIGN_KEY, userId: user.id } })
    await claimPointsCampaignOffer(db, user.id)
    const order = await db.order.create({ data: { userId: user.id, customerName: user.name, customerEmail: user.email, customerPhone: '+79990000000', total: 1000, userPointsUsed: 1000 } })
    await db.$transaction(tx => spendUserPoints(tx, { userId: user.id, amount: 1000, orderId: order.id }))
    await db.$transaction(tx => refundUserPointsForOrder(tx, { order }))
    assert.equal((await db.pointCampaignOffer.findFirst({ where: { userId: user.id } })).remainingPoints, 4000)
    assert.equal((await db.user.findUnique({ where: { id: user.id } })).pointsBalance, 4000)
    await db.$transaction(tx => refundUserPointsForOrder(tx, { order }))
    assert.equal((await db.user.findUnique({ where: { id: user.id } })).pointsBalance, 4000)
  } finally {
    await db.$disconnect()
    await rm(directory, { recursive: true, force: true })
  }
})
