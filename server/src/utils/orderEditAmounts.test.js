import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateOrderEditAmounts, getBilledOrderTotal } from './orderEditAmounts.js'

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
