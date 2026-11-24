import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveManualOrderPromo } from './manualOrderPromo.js'

test('another partner promo discounts the order but keeps commission with the bound partner', async () => {
  const promoCode = {
    id: 54,
    code: 'OTHER10',
    isActive: true,
    partnerId: 72,
    discountType: 'percentage',
    discountValue: 10,
    usageType: 'multi',
    activationCount: 0
  }
  const db = {
    promoCode: { findFirst: async () => promoCode },
    partner: {
      findUnique: async ({ where }) => ({
        id: where.id,
        userId: where.id === 72 ? 524 : 16,
        isActive: true,
        archivedAt: null,
        user: { role: 'PARTNER' }
      })
    }
  }

  const result = await resolveManualOrderPromo(db, {
    code: promoCode.code,
    userId: 415,
    subtotal: 1000,
    boundPartnerId: 7
  })

  assert.equal(result.promoCode.id, 54)
  assert.equal(result.discountAmount, 100)
  assert.equal(result.partnerId, 7)
})

test('manual promo discounts merchandise after customer points are spent', async () => {
  const promoCode = {
    id: 55, code: 'TEN', isActive: true, partnerId: null,
    discountType: 'percentage', discountValue: 10, usageType: 'multi', activationCount: 0
  }
  const result = await resolveManualOrderPromo({ promoCode: { findFirst: async () => promoCode } }, {
    code: 'TEN', userId: 415, subtotal: 1000, userPointsUsed: 100
  })
  assert.equal(result.discountAmount, 90)
  assert.equal(result.discountAmount + 100, 190)
})
