import assert from 'node:assert/strict'
import test from 'node:test'
import { extractTochkaPaymentType, getAcquiringEstimate, normalizePaymentType } from './paymentAcquiring.js'

test('normalizes only supported payment types', () => {
  assert.equal(normalizePaymentType('SBP'), 'sbp')
  assert.equal(normalizePaymentType('card'), 'card')
  assert.equal(normalizePaymentType(['sbp', 'card']), null)
})

test('reads actual type from the Tochka operation or webhook', () => {
  assert.equal(extractTochkaPaymentType({ Data: { Operation: [{ paymentType: 'sbp', paymentMode: ['sbp', 'card'] }] } }), 'sbp')
  assert.equal(extractTochkaPaymentType({ paymentType: 'card' }), 'card')
  assert.equal(extractTochkaPaymentType({ Data: { Operation: [{ paymentMode: ['sbp', 'card'] }] } }), null)
})

test('uses payment amount and correct method-specific rate', () => {
  assert.deepEqual(getAcquiringEstimate({ paymentStatus: 'PAID', paymentType: 'sbp', total: 11000, paymentAmount: 10000 }),
    { amount: 40, source: 'Расчёт: СБП 0,4%' })
  assert.deepEqual(getAcquiringEstimate({ paymentStatus: 'PAID', paymentType: 'card', total: 10000 }),
    { amount: 250, source: 'Расчёт: карта 2,5%' })
})

test('does not guess a method for old or manual orders', () => {
  assert.deepEqual(getAcquiringEstimate({ paymentStatus: 'PAID', total: 10000 }, 2.7),
    { amount: 270, source: 'Оценка: способ оплаты неизвестен, 2.7%' })
  assert.deepEqual(getAcquiringEstimate({ paymentStatus: 'PENDING', paymentType: 'card', total: 10000 }),
    { amount: 0, source: 'Не оплачен' })
})

test('prefers known actual fee over rate estimate, including zero', () => {
  assert.deepEqual(getAcquiringEstimate({ paymentStatus: 'PAID', paymentType: 'card', total: 10000, acquiringFee: 112.34 }),
    { amount: 112.34, source: 'Фактическая сумма' })
  assert.equal(getAcquiringEstimate({ paymentStatus: 'PAID', acquiringFee: 0, total: 10000 }).amount, 0)
  assert.equal(getAcquiringEstimate({ paymentStatus: 'PENDING', acquiringFee: 100, total: 10000 }).amount, 0)
})
