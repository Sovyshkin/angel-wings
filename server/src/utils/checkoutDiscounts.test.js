import test from 'node:test'
import assert from 'node:assert/strict'
import { calculatePromoDiscount } from './checkoutDiscounts.js'
import { calculatePromoDiscount as websitePreview } from '../../../vue-app/src/utils/checkoutDiscounts.js'
import { calculatePromoDiscount as telegramPreview } from '../../../telegram-mini-app/src/utils/checkoutDiscounts.js'

test('server and both storefronts discount the remainder after customer points', () => {
  const cases = [
    [10000, { discountType: 'percentage', discountValue: 20 }, 4000, 1200],
    [10000, { discountType: 'percentage', discountValue: 20 }, 0, 2000],
    [10000, { discountType: 'percentage', discountValue: 20 }, 10000, 0],
    [10000, { discountType: 'fixed', discountValue: 8000 }, 4000, 6000],
    [10000, { discountType: 'fixed', discountValue: 500 }, 4000, 500],
    [100.01, { discountType: 'percentage', discountValue: 15 }, 20, 12],
    [100, { discountType: 'percentage', discountValue: 100 }, 200, 0],
    [10000, null, 4000, 0]
  ]
  for (const calculator of [calculatePromoDiscount, websitePreview, telegramPreview]) {
    for (const [subtotal, promo, points, expected] of cases) {
      assert.equal(calculator(subtotal, promo, points), expected)
    }
  }
})
