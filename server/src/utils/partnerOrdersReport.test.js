import test from 'node:test'
import assert from 'node:assert/strict'
import { allocateOrderItems, getOrderReportAmounts } from './partnerOrdersReport.js'

test('item discounts reconcile to the order total to the kopeck', () => {
  const order = {
    discountAmount: 100,
    items: [
      { price: 5000, quantity: 1 },
      { price: 3000, quantity: 1 },
      { price: 2000, quantity: 1 }
    ]
  }
  const lines = allocateOrderItems(order)
  assert.deepEqual(lines.map(line => line.gross), [5000, 3000, 2000])
  assert.equal(lines.reduce((sum, line) => sum + Math.round(line.net * 100), 0), 990000)
  assert.equal(lines.reduce((sum, line) => sum + Math.round(line.discount * 100), 0), 10000)
})

test('discount allocation never makes a tiny line negative', () => {
  const order = { discountAmount: 0.60, items: Array.from({ length: 101 }, () => ({ price: 0.01, quantity: 1 })) }
  const lines = allocateOrderItems(order)
  assert.equal(lines.reduce((sum, line) => sum + Math.round(line.discount * 100), 0), 60)
  assert.ok(lines.every(line => line.net >= 0))
})

test('financial columns include only paid orders and label estimated acquiring', () => {
  const paid = getOrderReportAmounts({ total: 10000, paymentStatus: 'PAID', paymentId: 'pay-1', acquiringFee: null }, 2.7)
  assert.deepEqual(paid, {
    revenue: 10000, tax: 1141.2, acquiring: 270,
    acquiringSource: 'Оценка: 2.7%', balance: 8588.8
  })
  const unpaid = getOrderReportAmounts({ total: 10000, paymentStatus: 'PENDING', paymentId: 'pay-2', acquiringFee: null }, 2.7)
  assert.equal(unpaid.revenue, 0)
  assert.equal(unpaid.tax, 0)
  assert.equal(unpaid.acquiring, 0)
  const actual = getOrderReportAmounts({ total: 10000, paymentStatus: 'PAID', paymentId: 'pay-3', acquiringFee: 125.43 }, 2.7)
  assert.equal(actual.acquiring, 125.43)
  assert.equal(actual.acquiringSource, 'Фактическая сумма')
})
