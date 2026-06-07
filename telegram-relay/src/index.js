import 'dotenv/config'
import https from 'node:https'
import express from 'express'
import axios from 'axios'

const app = express()
const port = Number(process.env.PORT || 3010)

app.disable('x-powered-by')
app.use(express.json({ limit: '100kb' }))

const telegramAgent = new https.Agent({
  family: 4,
  keepAlive: true
})

function maskSecret(value) {
  const text = String(value || '')
  if (!text) return ''
  if (text.length <= 8) return '***'
  return `${text.slice(0, 4)}...${text.slice(-4)}`
}

function getRequiredEnv(name) {
  const value = String(process.env[name] || '').trim()
  if (!value) {
    throw new Error(`${name} is not configured`)
  }
  return value
}

function requireRelayAuth(req, res, next) {
  const expectedSecret = String(process.env.TELEGRAM_RELAY_SECRET || '').trim()

  if (!expectedSecret || expectedSecret.length < 24) {
    console.error('[RELAY] TELEGRAM_RELAY_SECRET is missing or too short')
    return res.status(500).json({ ok: false, error: 'Relay secret is not configured' })
  }

  const authHeader = String(req.headers.authorization || '')
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : ''

  if (token !== expectedSecret) {
    console.warn('[RELAY] Unauthorized request', JSON.stringify({
      ip: req.ip,
      received: maskSecret(token)
    }))
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  next()
}

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'angel-wings-telegram-relay',
    telegramConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ORDERS_CHAT_ID)
  })
})

app.post('/telegram/orders', requireRelayAuth, async (req, res) => {
  let token
  let chatId
  try {
    token = getRequiredEnv('TELEGRAM_BOT_TOKEN')
    chatId = getRequiredEnv('TELEGRAM_ORDERS_CHAT_ID')
  } catch (error) {
    console.error('[RELAY] Configuration error', error?.message || error)
    return res.status(500).json({ ok: false, error: 'Telegram relay is not configured' })
  }

  const defaultThreadId = String(process.env.TELEGRAM_ORDERS_THREAD_ID || '').trim()
  const text = String(req.body?.text || '').trim()
  const orderId = req.body?.orderId || null

  if (!text) {
    return res.status(400).json({ ok: false, error: 'Message text is required' })
  }

  const payload = {
    chat_id: chatId,
    text,
    parse_mode: req.body?.parseMode || 'HTML',
    disable_web_page_preview: req.body?.disableWebPagePreview !== false
  }

  const threadId = req.body?.threadId || defaultThreadId
  if (threadId) {
    payload.message_thread_id = Number(threadId) || threadId
  }

  console.log('[RELAY] Telegram send request', JSON.stringify({
    orderId,
    chatId,
    hasThreadId: Boolean(payload.message_thread_id),
    textLength: text.length
  }))

  let response
  try {
    response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, payload, {
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
      httpsAgent: telegramAgent,
      validateStatus: () => true
    })
  } catch (error) {
    console.error('[RELAY] Telegram network error', JSON.stringify({
      orderId,
      message: error?.message || null,
      code: error?.cause?.code || error?.code || null
    }))
    return res.status(502).json({ ok: false, error: 'Telegram network error' })
  }

  const data = response?.data && typeof response.data === 'object' ? response.data : {}
  console.log('[RELAY] Telegram response', JSON.stringify({
    orderId,
    httpStatus: response?.status || null,
    ok: data?.ok,
    messageId: data?.result?.message_id || null,
    description: data?.description || null
  }))

  if (Number(response?.status || 0) >= 400 || data?.ok === false) {
    return res.status(502).json({
      ok: false,
      error: data?.description || 'Telegram sendMessage failed',
      telegramStatus: response?.status || null
    })
  }

  res.json({
    ok: true,
    messageId: data?.result?.message_id || null
  })
})

app.use((req, res) => {
  res.status(404).json({ ok: false, error: 'Not found' })
})

app.use((error, req, res, next) => {
  console.error('[RELAY] Unhandled error', error)
  res.status(500).json({ ok: false, error: 'Internal relay error' })
})

app.listen(port, '127.0.0.1', () => {
  console.log(`[RELAY] Telegram relay listening on 127.0.0.1:${port}`)
})
