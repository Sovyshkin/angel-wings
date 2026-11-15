import test from 'node:test'
import assert from 'node:assert/strict'
import { cityLookupPlans, searchCdekCities } from './citySearch.js'

test('colloquial city names resolve with a country and preserve other-country results', async () => {
  assert.deepEqual(cityLookupPlans('СПБ')[0], { name: 'Санкт-Петербург', countryCode: 'RU' })
  assert.deepEqual(cityLookupPlans('питер')[0], { name: 'Санкт-Петербург', countryCode: 'RU' })
  assert.deepEqual(cityLookupPlans('алма-ата')[0], { name: 'Алматы', countryCode: 'KZ' })
  assert.deepEqual(cityLookupPlans('st petersburg')[0], { name: 'Санкт-Петербург', countryCode: 'RU' })
  assert.deepEqual(cityLookupPlans('оренбу')[0], { name: 'Оренбург', countryCode: 'RU' })
  const calls = []
  const lookup = async (name, options) => {
    calls.push([name, options.country_code])
    if (name === 'Санкт-Петербург') return [{ code: 137, city: 'Санкт-Петербург', country_code: 'RU' }]
    if (name === 'Тбилиси') return [{ code: 210, city: 'Тбилиси', country_code: 'GE' }]
    if (name === 'Минск') return [{ code: 300, city: 'Минск', country_code: 'BY' }]
    return []
  }
  assert.equal((await searchCdekCities('спб', lookup))[0].city, 'Санкт-Петербург')
  assert.deepEqual(calls[0], ['Санкт-Петербург', 'RU'])
  assert.equal((await searchCdekCities('tbilisi', lookup))[0].country_code, 'GE')
  assert.equal((await searchCdekCities('Минск', lookup))[0].country_code, 'BY')
  assert.deepEqual(await searchCdekCities('Париж', async () => []), [])
})

test('duplicate CDEK results are removed and unknown cities use live search', async () => {
  const calls = []
  const result = await searchCdekCities('Нижний', async name => {
    calls.push(name)
    return name === 'Нижний Новгород'
      ? [{ code: 1, city: 'Нижний Новгород' }]
      : [{ code: 1, city: 'Нижний Новгород' }, { code: 2, city: 'Нижний Тагил' }]
  })
  assert.deepEqual(result.map(item => item.code), [1, 2])
  assert.ok(calls.includes('Нижний'))
  assert.deepEqual(cityLookupPlans('Reykjavik'), [{ name: 'Reykjavik', countryCode: '' }])
})

test('CIS cities appear before other countries, including when CDEK returns many exact foreign matches', async () => {
  const foreign = Array.from({ length: 12 }, (_, index) => ({ code: index + 100, city: 'Орен', country_code: 'TR' }))
  const results = await searchCdekCities('орен', async name => name === 'Оренбург'
    ? [{ code: 1, city: 'Оренбург', country_code: 'RU' }]
    : [...foreign, { code: 2, city: 'Орен', country_code: 'KZ' }, { code: 3, city: 'Орен', country_code: 'DE' }], { limit: 8 })
  assert.deepEqual(results.map(city => city.country_code).slice(0, 2), ['RU', 'KZ'])
  assert.equal(results.length, 8)
  assert.ok(results.some(city => city.country_code === 'TR'))
})
