import assert from 'node:assert/strict'
import test from 'node:test'
import { requestBrowserLocation } from './browserGeolocation.js'

test('returns valid browser coordinates', async () => {
  const geolocation = {
    getCurrentPosition(success) {
      success({ coords: { latitude: 51.77, longitude: 55.1, accuracy: 25 } })
    }
  }
  assert.deepEqual(await requestBrowserLocation(geolocation, 20), { latitude: 51.77, longitude: 55.1, accuracy: 25 })
})

test('stops waiting even when the browser never calls back', async () => {
  const geolocation = { getCurrentPosition() {} }
  await assert.rejects(requestBrowserLocation(geolocation, 20), error => error.code === 'TIMEOUT')
})

test('propagates permission denial and ignores a late success', async () => {
  let success
  const geolocation = { getCurrentPosition(onSuccess, onError) {
    success = onSuccess
    onError({ code: 1 })
  } }
  await assert.rejects(requestBrowserLocation(geolocation, 20), error => error.code === 1)
  success({ coords: { latitude: 51, longitude: 55 } })
})
