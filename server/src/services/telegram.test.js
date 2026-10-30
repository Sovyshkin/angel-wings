import assert from 'node:assert/strict'
import crypto from 'node:crypto'
import test from 'node:test'
import axios from 'axios'
import { notifyOrderToTelegram } from './telegram.js'

test('relay notifications use a scoped TLS 1.2 agent and retain HMAC authentication', async () => {
  const originalPost = axios.post
  const originalUrl = process.env.TELEGRAM_RELAY_URL
  const originalSecret = process.env.TELEGRAM_RELAY_SECRET
  const originalOriginIp = process.env.TELEGRAM_RELAY_ORIGIN_IP
  let request

  process.env.TELEGRAM_RELAY_URL = 'https://relay.example.test'
  process.env.TELEGRAM_RELAY_SECRET = 'test-relay-secret'
  delete process.env.TELEGRAM_RELAY_ORIGIN_IP
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
    if (originalOriginIp === undefined) delete process.env.TELEGRAM_RELAY_ORIGIN_IP
    else process.env.TELEGRAM_RELAY_ORIGIN_IP = originalOriginIp
  }
})

test('uses the authenticated direct origin before POST when the public route is down', async () => {
  const originalGet = axios.get
  const originalPost = axios.post
  const originalUrl = process.env.TELEGRAM_RELAY_URL
  const originalSecret = process.env.TELEGRAM_RELAY_SECRET
  const originalOriginIp = process.env.TELEGRAM_RELAY_ORIGIN_IP
  let request

  process.env.TELEGRAM_RELAY_URL = 'https://tg.angel-wings.ru'
  process.env.TELEGRAM_RELAY_SECRET = 'test-relay-secret'
  process.env.TELEGRAM_RELAY_ORIGIN_IP = '192.0.2.10'
  axios.get = async () => { throw Object.assign(new Error('Public route timed out'), { code: 'ETIMEDOUT' }) }
  axios.post = async (url, body, options) => {
    request = { url, body, options }
    return { status: 200, data: { ok: true, messageId: 456 } }
  }

  try {
    const result = await notifyOrderToTelegram({ id: 648, total: 100, items: [] })
    assert.equal(result.messageId, 456)
    assert.equal(request.url, 'https://tg.angel-wings.ru/telegram/orders')
    assert.equal(request.options.proxy, false)
    assert.equal(request.options.maxRedirects, 0)
    assert.equal(request.options.httpsAgent.options.maxVersion, 'TLSv1.2')
    const lookup = request.options.httpsAgent.options.lookup
    await new Promise(resolve => lookup('tg.angel-wings.ru', { all: true }, (_error, addresses) => {
      assert.deepEqual(addresses, [{ address: '192.0.2.10', family: 4 }])
      resolve()
    }))
    const signature = crypto.createHmac('sha256', 'test-relay-secret')
      .update(`${request.options.headers['X-AngelWings-Timestamp']}.${request.body}`).digest('hex')
    assert.equal(request.options.headers['X-AngelWings-Signature'], signature)
  } finally {
    axios.get = originalGet
    axios.post = originalPost
    if (originalUrl === undefined) delete process.env.TELEGRAM_RELAY_URL
    else process.env.TELEGRAM_RELAY_URL = originalUrl
    if (originalSecret === undefined) delete process.env.TELEGRAM_RELAY_SECRET
    else process.env.TELEGRAM_RELAY_SECRET = originalSecret
    if (originalOriginIp === undefined) delete process.env.TELEGRAM_RELAY_ORIGIN_IP
    else process.env.TELEGRAM_RELAY_ORIGIN_IP = originalOriginIp
  }
})

test('does not fail over after an ambiguous POST timeout', async () => {
  const originalGet = axios.get
  const originalPost = axios.post
  const originalUrl = process.env.TELEGRAM_RELAY_URL
  const originalSecret = process.env.TELEGRAM_RELAY_SECRET
  const originalOriginIp = process.env.TELEGRAM_RELAY_ORIGIN_IP
  const originalAttempts = process.env.TELEGRAM_RELAY_RETRY_ATTEMPTS
  let posts = 0

  process.env.TELEGRAM_RELAY_URL = 'https://tg.angel-wings.ru'
  process.env.TELEGRAM_RELAY_SECRET = 'test-relay-secret'
  process.env.TELEGRAM_RELAY_ORIGIN_IP = '192.0.2.10'
  process.env.TELEGRAM_RELAY_RETRY_ATTEMPTS = '1'
  axios.get = async () => ({ status: 200, data: { ok: true } })
  axios.post = async () => { posts++; throw new Error('POST timed out') }

  try {
    await assert.rejects(notifyOrderToTelegram({ id: 648, total: 100, items: [] }), /POST timed out/)
    assert.equal(posts, 1)
  } finally {
    axios.get = originalGet
    axios.post = originalPost
    for (const [name, value] of [
      ['TELEGRAM_RELAY_URL', originalUrl],
      ['TELEGRAM_RELAY_SECRET', originalSecret],
      ['TELEGRAM_RELAY_ORIGIN_IP', originalOriginIp],
      ['TELEGRAM_RELAY_RETRY_ATTEMPTS', originalAttempts]
    ]) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
})
