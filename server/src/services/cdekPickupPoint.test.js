import assert from 'node:assert/strict'
import test from 'node:test'

process.env.CDEK_ACCOUNT = 'test-account'
process.env.CDEK_PASSWORD = 'test-password'
process.env.CDEK_URL = 'https://cdek.example/v2'
process.env.CDEK_TOKEN_URL = 'https://cdek.example/v2/oauth/token'

const { getPickupPoint } = await import('./cdek.js')

test('pickup point lookup uses the CDEK code filter and returns the exact point', async () => {
  const originalFetch = globalThis.fetch
  const requests = []
  globalThis.fetch = async (url) => {
    requests.push(String(url))
    if (String(url).endsWith('/oauth/token')) {
      return { json: async () => ({ access_token: 'test-token', expires_in: 3600 }) }
    }
    return { ok: true, status: 200, text: async () => JSON.stringify([
      { code: 'OTHER', location: { city: 'Оренбург', city_code: 1 } },
      { code: 'ORN80', location: { city: 'Оренбург', city_code: 1 } }
    ]) }
  }

  try {
    const point = await getPickupPoint('ORN80')
    assert.equal(point.code, 'ORN80')
    assert.equal(requests.at(-1), 'https://cdek.example/v2/deliverypoints?code=ORN80')
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('pickup point lookup does not return a different point', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify([{ code: 'OTHER' }])
  })

  try {
    await assert.rejects(getPickupPoint('ORN80'), error => error.status === 404)
  } finally {
    globalThis.fetch = originalFetch
  }
})
