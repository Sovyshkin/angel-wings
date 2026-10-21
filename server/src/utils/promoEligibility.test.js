import test from 'node:test'
import assert from 'node:assert/strict'
import { isOwnPartnerPromoCode } from './promoEligibility.js'

test('rejects only the owner of a partner promo code', async () => {
  const prisma = { partner: { findUnique: async ({ where }) => where.id === 7 ? { userId: 42 } : null } }
  assert.equal(await isOwnPartnerPromoCode(prisma, { partnerId: 7 }, 42), true)
  assert.equal(await isOwnPartnerPromoCode(prisma, { partnerId: 7 }, 43), false)
  assert.equal(await isOwnPartnerPromoCode(prisma, { partnerId: 8 }, 42), false)
})

test('does not restrict ordinary promo codes', async () => {
  const prisma = { partner: { findUnique: () => { throw new Error('No partner lookup expected') } } }
  assert.equal(await isOwnPartnerPromoCode(prisma, { partnerId: null }, 42), false)
})
