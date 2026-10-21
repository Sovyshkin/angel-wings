import test from 'node:test'
import assert from 'node:assert/strict'
import { parseReportPeriod } from './reportPeriod.js'

test('empty period keeps the all-time report', () => {
  assert.deepEqual(parseReportPeriod({}), {})
})

test('includes both Moscow calendar days, including the last day', () => {
  const range = parseReportPeriod({ dateFrom: '2026-10-01', dateTo: '2026-10-21' })
  assert.equal(range.createdAt.gte.toISOString(), '2026-09-30T21:00:00.000Z')
  assert.equal(range.createdAt.lt.toISOString(), '2026-10-21T21:00:00.000Z')
})

test('rejects incomplete, reversed and invalid dates', () => {
  for (const query of [
    { dateFrom: '2026-10-01' },
    { dateFrom: '2026-10-21', dateTo: '2026-10-01' },
    { dateFrom: '2026-02-30', dateTo: '2026-03-01' }
  ]) assert.throws(() => parseReportPeriod(query), { status: 400 })
})
