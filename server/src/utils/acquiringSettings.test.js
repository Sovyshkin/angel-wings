import assert from 'node:assert/strict'
import test from 'node:test'
import { DEFAULT_ACQUIRING_SETTINGS, getAcquiringSettings, parseAcquiringPlan, parseAcquiringSettings } from './acquiringSettings.js'
import { getAcquiringEstimate } from './paymentAcquiring.js'

test('defaults are used before settings are saved', async () => {
  const settings = await getAcquiringSettings({ acquiringSettings: { findUnique: async () => null } })
  assert.equal(settings.sbpPercent, DEFAULT_ACQUIRING_SETTINGS.sbpPercent)
  assert.equal(settings.cardPercent, DEFAULT_ACQUIRING_SETTINGS.cardPercent)
  assert.equal(settings.sbpUntil, '')
})

test('legacy fallback setting is not exposed for editing', async () => {
  const settings = await getAcquiringSettings({ acquiringSettings: { findUnique: async () => ({ sbpPercent: 0.5, cardPercent: 2.3, fallbackPercent: 2.7 }) } })
  assert.equal(settings.sbpPercent, 0.5)
  assert.equal(settings.cardPercent, 2.3)
  assert.equal(settings.fallbackPercent, undefined)
})

test('scheduled rates switch separately after the inclusive Moscow end date', async () => {
  const settings = await getAcquiringSettings({
    acquiringSettings: { findUnique: async () => ({ sbpPercent: 0.4, cardPercent: 2.5 }) },
    acquiringRatePeriod: { findMany: async () => [
      { method: 'sbp', effectiveFrom: new Date('2026-12-01T21:00:00Z'), percent: 0.7 },
      { method: 'card', effectiveFrom: new Date('2026-12-10T21:00:00Z'), percent: 3 }
    ] }
  })
  assert.equal(settings.sbpUntil, '2026-12-01')
  assert.equal(settings.cardUntil, '2026-12-10')
  const before = { paymentStatus: 'PAID', paymentType: 'sbp', total: 10000, createdAt: new Date('2026-12-01T20:59:59Z') }
  assert.equal(getAcquiringEstimate(before, settings).amount, 40)
  assert.equal(getAcquiringEstimate({ ...before, createdAt: new Date('2026-12-01T21:00:00Z') }, settings).amount, 70)
  assert.equal(getAcquiringEstimate({ ...before, paymentType: 'card', createdAt: new Date('2026-12-02T00:00:00Z') }, settings).amount, 250)
})

test('scheduled rates require a valid date and the next percent', () => {
  const now = new Date('2026-11-24T12:00:00Z')
  const plan = parseAcquiringPlan({ sbpPercent: 0.4, cardPercent: 2.5, sbpUntil: '2026-11-24', sbpNextPercent: 0.6 }, now)
  assert.equal(plan.schedules.sbp.effectiveFrom.toISOString(), '2026-11-24T21:00:00.000Z')
  assert.equal(plan.schedules.card, null)
  assert.throws(() => parseAcquiringPlan({ sbpPercent: 0.4, cardPercent: 2.5, sbpUntil: '2026-11-23', sbpNextPercent: 0.6 }, now))
  assert.throws(() => parseAcquiringPlan({ sbpPercent: 0.4, cardPercent: 2.5, sbpUntil: '2026-11-24' }, now))
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
