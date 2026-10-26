import test from 'node:test'
import assert from 'node:assert/strict'
import { mergeRecent, normalizeRecentCity, normalizeRecentPickup, readRecentDelivery, writeRecentDelivery } from './recentDelivery.js'

test('keeps only three most recent unique cities and pickup points', () => {
  const cities = [1, 2, 3, 4].reduce((history, code) => mergeRecent(history, normalizeRecentCity({ name: `Город ${code}`, code })), [])
  assert.deepEqual(cities.map(city => city.code), ['4', '3', '2'])
  assert.deepEqual(mergeRecent(cities, normalizeRecentCity({ name: 'Новый адрес', code: 3 })).map(city => city.code), ['3', '4', '2'])

  const pickup = normalizeRecentPickup({ code: 'PVZ1', name: 'Пункт', city: 'Казань', address: 'ул. Тестовая' })
  assert.equal(pickup.code, 'PVZ1')
  assert.equal(pickup.city, 'Казань')
})

test('stores only normalized recent choices and tolerates unavailable storage', () => {
  const entries = new Map()
  const storage = {
    getItem: key => entries.get(key),
    setItem: (key, value) => entries.set(key, value)
  }
  writeRecentDelivery(storage, 'recent', {
    cities: [normalizeRecentCity({ name: 'Москва', code: 44 })],
    pickups: [normalizeRecentPickup({ code: 'MSK1', name: 'ПВЗ', address: 'Адрес' })]
  })
  assert.equal(readRecentDelivery(storage, 'recent').cities[0].name, 'Москва')
  assert.equal(readRecentDelivery(storage, 'recent').pickups[0].code, 'MSK1')
  assert.deepEqual(readRecentDelivery({ getItem: () => '{bad json' }, 'recent'), { cities: [], pickups: [] })
})
