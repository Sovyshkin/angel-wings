import test from 'node:test'
import assert from 'node:assert/strict'
import { MAX_FAVORITE_PICKUPS, normalizeFavoritePickup, readFavoritePickups, writeFavoritePickups } from './favoritePickups.js'

test('favorite points require a stable code and city code', () => {
  assert.equal(normalizeFavoritePickup({ code: 'MSK1', city: 'Москва' }), null)
  assert.deepEqual(normalizeFavoritePickup({ code: 'MSK1', city: 'Москва', cityCode: 44 }).cityCode, '44')
})

test('favorites stay unique and bounded in browser storage', () => {
  const entries = new Map()
  const storage = { getItem: key => entries.get(key), setItem: (key, value) => entries.set(key, value) }
  const points = Array.from({ length: MAX_FAVORITE_PICKUPS + 2 }, (_, index) => ({ code: `MSK${index}`, city: 'Москва', cityCode: '44', name: `ПВЗ ${index}` }))
  writeFavoritePickups(storage, 'favorites', [points[0], points[0], ...points])
  const loaded = readFavoritePickups(storage, 'favorites')
  assert.equal(loaded.length, MAX_FAVORITE_PICKUPS)
  assert.equal(loaded[0].code, 'MSK0')
  assert.equal(new Set(loaded.map(point => point.code)).size, MAX_FAVORITE_PICKUPS)
})
