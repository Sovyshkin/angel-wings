import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_ACQUIRING_SETTINGS, getAcquiringSettings, parseAcquiringSettings } from './acquiringSettings.js'
import { getAcquiringEstimate } from './paymentAcquiring.js'

test('defaults are used before settings are saved', async () => {
  const settings = await getAcquiringSettings({ acquiringSettings: { findUnique: async () => null } })
  assert.deepEqual(settings, DEFAULT_ACQUIRING_SETTINGS)
})

test('admin rates are validated and allow zero', () => {
  assert.deepEqual(parseAcquiringSettings({ sbpPercent: 0, cardPercent: '2.35', fallbackPercent: 3 }), {
    sbpPercent: 0, cardPercent: 2.35, fallbackPercent: 3
  })
  assert.throws(() => parseAcquiringSettings({ sbpPercent: -1, cardPercent: 2.5, fallbackPercent: 2.7 }))
  assert.throws(() => parseAcquiringSettings({ sbpPercent: 0.4, cardPercent: 2.5, fallbackPercent: '' }))
})

test('edited settings change estimates while actual fees remain authoritative', () => {
  const rates = { sbpPercent: 0.5, cardPercent: 2.3, fallbackPercent: 3 }
  assert.equal(getAcquiringEstimate({ paymentStatus: 'PAID', paymentType: 'sbp', total: 10000 }, rates).amount, 50)
  assert.equal(getAcquiringEstimate({ paymentStatus: 'PAID', paymentType: 'card', total: 10000 }, rates).amount, 230)
  assert.equal(getAcquiringEstimate({ paymentStatus: 'PAID', total: 10000 }, rates).amount, 300)
  assert.equal(getAcquiringEstimate({ paymentStatus: 'PAID', paymentType: 'card', total: 10000, acquiringFee: 99 }, rates).amount, 99)
})
