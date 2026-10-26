import test from 'node:test'
import assert from 'node:assert/strict'
import { distanceKm, pickupCoordinates, pickupMatchesHours } from './pickupMap.js'

test('uses CDEK coordinates and rejects invalid points', () => {
  assert.deepEqual(pickupCoordinates({ location: { latitude: 55.75, longitude: 37.62 } }), { latitude: 55.75, longitude: 37.62 })
  assert.equal(pickupCoordinates({ location: { latitude: 0, longitude: 0 } }), null)
  assert.equal(pickupCoordinates({ location: { latitude: 200, longitude: 37 } }), null)
})

test('orders nearest points by straight-line distance', () => {
  const location = { latitude: 55.75, longitude: 37.62 }
  assert.equal(distanceKm(location, location), 0)
  assert.ok(distanceKm(location, { latitude: 55.76, longitude: 37.62 }) < distanceKm(location, { latitude: 56.1, longitude: 37.62 }))
})

test('filters by working schedule supplied by CDEK', () => {
  const everyday = { work_time_list: Array.from({ length: 7 }, (_, day) => ({ day: day + 1, time: '10:00/21:00' })) }
  assert.equal(pickupMatchesHours(everyday, 'everyday'), true)
  assert.equal(pickupMatchesHours(everyday, 'late'), true)
  assert.equal(pickupMatchesHours({ work_time_list: [{ day: 1, time: '10:00/18:00' }] }, 'everyday'), false)
  assert.equal(pickupMatchesHours({ work_time_list: [{ day: 1, time: '10:00/18:00' }] }, 'late'), false)
})
