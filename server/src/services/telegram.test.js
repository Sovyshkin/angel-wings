import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import test from 'node:test'
import axios from 'axios'
import { notifyOrderToTelegram } from './telegram.js'

test('relay notifications use a scoped TLS 1.2 agent and retain HMAC authentication', async () => {
  const originalPost = axios.post
  const originalUrl = process.env.TELEGRAM_RELAY_URL
  const originalSecret = process.env.TELEGRAM_RELAY_SECRET
  let request

  process.env.TELEGRAM_RELAY_URL = 'https://relay.example.test'
  process.env.TELEGRAM_RELAY_SECRET = 'test-relay-secret'
  axios.post = async (url, body, options) => {
    request = { url, body, options }
    return { status: 200, data: { ok: true, messageId: 123 } }
  }

  try {
    const result = await notifyOrderToTelegram({ id: 648, total: 100, items: [] })
    assert.equal(result.ok, true)
    assert.equal(result.messageId, 123)
    assert.equal(request.url, 'https://relay.example.test/telegram/orders')
    assert.equal(request.options.httpsAgent.options.family, 4)
    assert.equal(request.options.httpsAgent.options.minVersion, 'TLSv1.2')
    assert.equal(request.options.httpsAgent.options.maxVersion, 'TLSv1.2')
    assert.equal(request.options.httpsAgent.options.rejectUnauthorized, undefined)
    const timestamp = request.options.headers['X-AngelWings-Timestamp']
    const signature = crypto.createHmac('sha256', 'test-relay-secret')
      .update(`${timestamp}.${request.body}`).digest('hex')
    assert.equal(request.options.headers['X-AngelWings-Signature'], signature)
  } finally {
    axios.post = originalPost
    if (originalUrl === undefined) delete process.env.TELEGRAM_RELAY_URL
    else process.env.TELEGRAM_RELAY_URL = originalUrl
    if (originalSecret === undefined) delete process.env.TELEGRAM_RELAY_SECRET
    else process.env.TELEGRAM_RELAY_SECRET = originalSecret
  }
})
