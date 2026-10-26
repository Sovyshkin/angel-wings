import test from 'node:test'
import assert from 'node:assert/strict'
import { favoritePickupFromCdek } from './favoritePickupPoints.js'

test('normalizes only delivery points with a city', () => {
  assert.equal(favoritePickupFromCdek({ code: 'MSK1', location: {} }), null)
  assert.deepEqual(favoritePickupFromCdek({
    code: 'MSK1', name: 'Пункт СДЭК',
    location: { city: 'Москва', city_code: 44, address: 'ул. Тестовая, 1', country_code: 'RU' }
  }), {
    code: 'MSK1', name: 'Пункт СДЭК', address: 'ул. Тестовая, 1', city: 'Москва', cityCode: '44', country: '', countryCode: 'RU'
  })
})
