import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_ACQUIRING_SETTINGS, getAcquiringSettings, parseAcquiringSettings } from './acquiringSettings.js'
import { getAcquiringEstimate } from './paymentAcquiring.js'

test('defaults are used before settings are saved', async () => {
  const settings = await getAcquiringSettings({ acquiringSettings: { findUnique: async () => null } })
  assert.deepEqual(settings, DEFAULT_ACQUIRING_SETTINGS)
})

test('legacy fallback setting is not exposed for editing', async () => {
  const settings = await getAcquiringSettings({ acquiringSettings: { findUnique: async () => ({ sbpPercent: 0.5, cardPercent: 2.3, fallbackPercent: 2.7 }) } })
  assert.deepEqual(settings, { sbpPercent: 0.5, cardPercent: 2.3 })
})

test('admin rates are validated and allow zero', () => {
  assert.deepEqual(parseAcquiringSettings({ sbpPercent: 0, cardPercent: '2.35', fallbackPercent: 3 }), {
    sbpPercent: 0, cardPercent: 2.35
  })
  assert.throws(() => parseAcquiringSettings({ sbpPercent: -1, cardPercent: 2.5 }))
  assert.throws(() => parseAcquiringSettings({ sbpPercent: 0.4, cardPercent: '' }))
})

test('edited settings change estimates while actual fees remain authoritative', () => {
  const rates = { sbpPercent: 0.5, cardPercent: 2.3 }
  assert.equal(getAcquiringEstimate({ paymentStatus: 'PAID', paymentType: 'sbp', total: 10000 }, rates).amount, 50)
  assert.equal(getAcquiringEstimate({ paymentStatus: 'PAID', paymentType: 'card', total: 10000 }, rates).amount, 230)
  assert.equal(getAcquiringEstimate({ paymentStatus: 'PAID', total: 10000 }, rates).amount, 250)
  assert.equal(getAcquiringEstimate({ paymentStatus: 'PAID', paymentType: 'card', total: 10000, acquiringFee: 99 }, rates).amount, 99)
})
