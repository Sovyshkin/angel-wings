import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateEditedOrderDiscount, calculateOrderEditAmounts, getBilledOrderTotal } from './orderEditAmounts.js'

test('percentage promo applies to the changed merchandise once and preserves other deductions', () => {
  const input = {
    previousItems: [{ price: 1000, quantity: 1 }],
    nextItems: [{ price: 1000, quantity: 1 }, { price: 500, quantity: 1 }],
    previousDiscountAmount: 250,
    partnerBonusAmount: 100,
    userPointsUsed: 50,
    promoCode: { discountType: 'percentage', discountValue: 10 }
  }
  assert.equal(calculateEditedOrderDiscount(input), 300)
  assert.equal(calculateEditedOrderDiscount({ ...input, previousItems: input.nextItems, previousDiscountAmount: 300 }), 300)
  assert.equal(calculateEditedOrderDiscount({ ...input, previousItems: input.nextItems, nextItems: input.previousItems, previousDiscountAmount: 300 }), 250)
})

test('fixed promo is used once, including when the original subtotal capped it', () => {
  const promoCode = { discountType: 'fixed', discountValue: 200 }
  assert.equal(calculateEditedOrderDiscount({
    previousItems: [{ price: 500, quantity: 1 }], nextItems: [{ price: 1000, quantity: 1 }],
    previousDiscountAmount: 200, promoCode
  }), 200)
  assert.equal(calculateEditedOrderDiscount({
    previousItems: [{ price: 100, quantity: 1 }], nextItems: [{ price: 300, quantity: 1 }],
    previousDiscountAmount: 100, promoCode
  }), 200)
  assert.equal(calculateEditedOrderDiscount({
    previousItems: [{ price: 100, quantity: 1 }], nextItems: [{ price: 300, quantity: 1 }],
    previousDiscountAmount: 100, promoCode: { ...promoCode, discountValue: 50 }
  }), 100)
})

test('admin edits preserve points-first discount without consuming points or promo twice', () => {
  const input = {
    previousItems: [{ price: 10000, quantity: 1 }],
    nextItems: [{ price: 10000, quantity: 1 }, { price: 5000, quantity: 1 }],
    userPointsUsed: 4000, partnerBonusAmount: 1000,
    previousDiscountAmount: 6200,
    promoCode: { discountType: 'percentage', discountValue: 20 }
  }
  assert.equal(calculateEditedOrderDiscount(input), 7200)
  assert.equal(calculateEditedOrderDiscount({ ...input, previousItems: input.nextItems, previousDiscountAmount: 7200 }), 7200)
  assert.equal(calculateEditedOrderDiscount({ ...input, previousItems: input.nextItems, nextItems: input.previousItems, previousDiscountAmount: 7200 }), 6200)
})

test('a fixed coupon capped after customer points can cover newly added merchandise once', () => {
  assert.equal(calculateEditedOrderDiscount({
    previousItems: [{ price: 10000, quantity: 1 }],
    nextItems: [{ price: 15000, quantity: 1 }],
    userPointsUsed: 4000, previousDiscountAmount: 10000,
    promoCode: { discountType: 'fixed', discountValue: 8000 }
  }), 12000)
})

test('paid order composition changes its total without changing the existing payment', () => {
  assert.deepEqual(calculateOrderEditAmounts({
    items: [{ price: 1000, quantity: 2 }, { price: 500, quantity: 1 }],
    deliveryPrice: 300,
    discountAmount: 200,
    financialLocked: true,
    previousTotal: 1100,
    previousUnbilledAdjustment: 0
  }), { total: 2600, unbilledAdjustment: 1500 })
})

test('zero-price replacement preserves the amount billed before the admin edit', () => {
  assert.deepEqual(calculateOrderEditAmounts({
    items: [{ price: 0, quantity: 1 }],
    discountAmount: 0,
    financialLocked: true,
    previousTotal: 900,
    previousUnbilledAdjustment: 0
  }), { total: 0, unbilledAdjustment: -900 })
})

test('unpaid order updates both totals and excludes separately paid CDEK delivery', () => {
  assert.deepEqual(calculateOrderEditAmounts({
    items: [{ price: 123.45, quantity: 2 }],
    deliveryPrice: 690,
    deliveryPickupPoint: 'PVZ-1',
    discountAmount: 40,
    financialLocked: false,
    previousTotal: 0,
    previousUnbilledAdjustment: 0
  }), { total: 206.9, unbilledAdjustment: 0, paymentAmount: 206.9 })
})

test('discount cannot exceed products and site-paid delivery', () => {
  assert.equal(calculateOrderEditAmounts({
    items: [{ price: 50, quantity: 1 }],
    discountAmount: 100,
    financialLocked: true,
    previousTotal: 100,
    previousUnbilledAdjustment: 0
  }), null)
})

test('billed order total keeps earlier installments and excludes admin-only changes', () => {
  assert.equal(getBilledOrderTotal({ total: 15000, paymentAmount: 2000, unbilledAdjustment: 5000 }), 10000)
  assert.equal(getBilledOrderTotal({ total: 17000, paymentAmount: 2000, unbilledAdjustment: 5000 }), 12000)
  assert.equal(getBilledOrderTotal({ total: 900, unbilledAdjustment: -100 }), 1000)
})

test('repeated admin edits keep the original billed total', () => {
  const next = calculateOrderEditAmounts({
    items: [{ price: 1200, quantity: 1 }],
    discountAmount: 0,
    financialLocked: true,
    previousTotal: 1500,
    previousUnbilledAdjustment: 500
  })
  assert.deepEqual(next, { total: 1200, unbilledAdjustment: 200 })
  assert.equal(getBilledOrderTotal(next), 1000)
})
