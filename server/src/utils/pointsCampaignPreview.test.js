import assert from 'node:assert/strict'
import test from 'node:test'
import { buildPointsCampaignPreview } from './pointsCampaignPreview.js'

const now = new Date('2026-10-30T12:00:00.000Z')

function user(id, overrides = {}) {
  return {
    id,
    role: 'USER',
    email: `user${id}@example.com`,
    emailVerified: true,
    marketingConsentAt: now,
    marketingUnsubscribedAt: null,
    telegramId: null,
    ...overrides
  }
}

function order(id, overrides = {}) {
  return {
    id,
    userId: null,
    customerEmail: `user${id}@example.com`,
    paymentStatus: 'PAID',
    status: 'PROCESSING',
    createdAt: now,
    ...overrides
  }
}

test('counts zero and one paid purchase, excludes two; combines userId and guest email without double counting', () => {
  const users = [user(1), user(2), user(3)]
  const orders = [
    order(10, { userId: 2, customerEmail: 'USER2@example.com' }),
    order(11, { userId: 3, customerEmail: 'user3@example.com' }),
    order(12, { customerEmail: 'USER3@example.com' })
  ]
  const result = buildPointsCampaignPreview(users, orders, now)
  assert.equal(result.eligibleAccounts, 2)
  assert.equal(result.eligibleWithZeroPurchases, 1)
  assert.equal(result.eligibleWithOnePurchase, 1)
  assert.equal(result.excludedWithTwoOrMorePurchases, 1)
})

test('ignores unpaid, returned, cancelled and older orders', () => {
  const orders = [
    order(1, { paymentStatus: 'PENDING' }),
    order(2, { status: 'RETURNED' }),
    order(3, { status: 'CANCELLED' }),
    order(4, { createdAt: new Date('2026-09-01T00:00:00.000Z') })
  ]
  const result = buildPointsCampaignPreview([user(1)], orders, now)
  assert.equal(result.eligibleWithZeroPurchases, 1)
})

test('separates site, email and Telegram candidates; includes verified emails without marketing consent', () => {
  const users = [
    user(1, { telegramId: '123' }),
    user(2, { email: 'tg-456@telegram.invalid', emailVerified: false, telegramId: '456', marketingConsentAt: null }),
    user(3, { marketingConsentAt: null }),
    user(4, { telegramId: '789', marketingUnsubscribedAt: now }),
    user(5, { role: 'ADMIN' })
  ]
  const result = buildPointsCampaignPreview(users, [], now)
  assert.equal(result.siteNotificationCandidates, 4)
  assert.equal(result.emailCandidates, 3)
  assert.equal(result.telegramCandidates, 2)
  assert.equal(result.telegramWithMarketingConsent, 1)
  assert.equal(result.emailAndTelegramCandidates, 1)
  assert.equal(result.emailOnlyCandidates, 2)
  assert.equal(result.telegramOnlyCandidates, 1)
  assert.equal(result.noOutboundChannelCandidates, 0)
  assert.equal(result.emailSkippedNoConsent, 2)
  assert.equal(result.excludedStaffOrDeleted, 1)
})
