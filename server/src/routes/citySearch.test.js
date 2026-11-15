import test from 'node:test'
import assert from 'node:assert/strict'
import express from 'express'
import cdek from '../services/cdek.js'
import deliveryRoutes from './delivery.js'

test('pickup city API resolves colloquial names and suggests foreign cities with CDEK codes', async () => {
  const original = cdek.findCity
  const calls = []
  cdek.findCity = async (name, options) => {
    calls.push([name, options?.country_code])
    if (name === 'Санкт-Петербург') return [{ code: 137, city: 'Санкт-Петербург', country_code: 'RU', country: 'Россия' }]
    if (name === 'Тбилиси') return [{ code: 210, city: 'Тбилиси', country_code: 'GE', country: 'Грузия' }]
    if (name === 'Оренбург') return [{ code: 1, city: 'Оренбург', country_code: 'RU', country: 'Россия' }]
    if (name === 'орен') return Array.from({ length: 12 }, (_, index) => ({ code: 100 + index, city: 'Орен', country_code: 'TR', country: 'Турция' }))
    if (name === 'Oslo') return [{ code: 310, city: 'Oslo', country_code: 'NO', country: 'Norway' }]
    return []
  }
  const app = express()
  app.use(express.json())
  app.use('/api/delivery', deliveryRoutes)
  const server = await new Promise(resolve => { const listener = app.listen(0, '127.0.0.1', () => resolve(listener)) })
  const base = `http://127.0.0.1:${server.address().port}/api/delivery`
  try {
    const alias = await fetch(`${base}/find-city`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'СПБ' }) })
    assert.equal(alias.status, 200)
    assert.equal((await alias.json())[0].code, 137)
    assert.ok(calls.some(([name, country]) => name === 'Санкт-Петербург' && country === 'RU'))
    const foreign = await fetch(`${base}/city-suggestions?q=tbilisi`)
    assert.equal((await foreign.json())[0].country_code, 'GE')
    const unknownAlias = await fetch(`${base}/city-suggestions?q=Oslo`)
    assert.equal((await unknownAlias.json())[0].code, 310)
    const preferred = await fetch(`${base}/city-suggestions?q=орен`)
    const preferredCities = await preferred.json()
    assert.equal(preferredCities[0].city, 'Оренбург')
    assert.equal(preferredCities.length, 8)
    const partialSuggestion = await fetch(`${base}/city-suggestions?q=оренбу`)
    assert.deepEqual((await partialSuggestion.json()).map(city => city.code), [1])
    const partialSearch = await fetch(`${base}/find-city`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ name: 'оренбу' }) })
    assert.deepEqual((await partialSearch.json()).map(city => city.code), [1])
  } finally {
    cdek.findCity = original
    await new Promise(resolve => server.close(resolve))
  }
})
