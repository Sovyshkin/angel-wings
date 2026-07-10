import 'dotenv/config'
import https from 'node:https'
import crypto from 'node:crypto'
import express from 'express'
import axios from 'axios'
import nodemailer from 'nodemailer'

const app = express()
const port = Number(process.env.PORT || 3010)

app.disable('x-powered-by')
app.use(express.json({
  limit: '300kb',
  verify: (req, res, buffer) => {
    req.rawBody = buffer.toString('utf8')
  }
}))

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
  const isEmailRequest = req.path === '/email/send'
  const expectedSecret = String(isEmailRequest
    ? (process.env.EMAIL_RELAY_SECRET || process.env.TELEGRAM_RELAY_SECRET || '')
    : (process.env.TELEGRAM_RELAY_SECRET || '')
  ).trim()
  const toleranceMs = Number(process.env.TELEGRAM_RELAY_SIGNATURE_TOLERANCE_MS || 300000)

  if (!expectedSecret || expectedSecret.length < 24) {
    console.error(`[RELAY] ${isEmailRequest ? 'EMAIL_RELAY_SECRET' : 'TELEGRAM_RELAY_SECRET'} is missing or too short`)
    return res.status(500).json({ ok: false, error: 'Relay secret is not configured' })
  }

  const timestampHeader = String(req.headers['x-angelwings-timestamp'] || '')
  const signatureHeader = String(req.headers['x-angelwings-signature'] || '').trim().toLowerCase()
  const timestamp = Number(timestampHeader)

  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > toleranceMs) {
    console.warn('[RELAY] Unauthorized request', JSON.stringify({
      ip: req.ip,
      reason: 'stale_or_missing_timestamp',
      timestamp: timestampHeader
    }))
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  const expectedSignature = crypto
    .createHmac('sha256', expectedSecret)
    .update(`${timestampHeader}.${req.rawBody || ''}`)
    .digest('hex')

  const received = Buffer.from(signatureHeader, 'hex')
  const expected = Buffer.from(expectedSignature, 'hex')
  const signatureIsValid =
    received.length === expected.length &&
    crypto.timingSafeEqual(received, expected)

  if (!signatureIsValid) {
    console.warn('[RELAY] Unauthorized request', JSON.stringify({
      ip: req.ip,
      reason: 'invalid_signature',
      received: maskSecret(signatureHeader)
    }))
    return res.status(401).json({ ok: false, error: 'Unauthorized' })
  }

  next()
}

let mailTransporter = null

function getMailTransporter() {
  if (mailTransporter) return mailTransporter

  const host = getRequiredEnv('SMTP_HOST')
  const port = Number(process.env.SMTP_PORT || 465)
  const secure = String(process.env.SMTP_SECURE || 'true').toLowerCase() !== 'false'
  const requireTLS = String(process.env.SMTP_REQUIRE_TLS ?? (port === 587 ? 'true' : 'false')).toLowerCase() === 'true'

  mailTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    requireTLS,
    family: 4,
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 8000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 8000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 15000),
    auth: {
      user: getRequiredEnv('SMTP_USER'),
      pass: getRequiredEnv('SMTP_PASSWORD')
    },
    tls: {
      servername: host,
      rejectUnauthorized: true
    },
    disableFileAccess: true,
    disableUrlAccess: true
  })

  return mailTransporter
}

function getEmailErrorInfo(error) {
  const code = error?.code || error?.cause?.code || ''
  const responseCode = Number(error?.responseCode || 0)
  const message = String(error?.message || error?.cause?.message || '')

  if (message.includes('is not configured')) {
    return {
      code: 'SMTP_NOT_CONFIGURED',
      message: 'На relay-сервере не настроены SMTP-параметры'
    }
  }

  if (code === 'EAUTH' || responseCode === 535 || responseCode === 534) {
    return {
      code: 'SMTP_AUTH_FAILED',
      message: 'SMTP отклонил логин или пароль почтового ящика'
    }
  }

  if (['ETIMEDOUT', 'ESOCKET', 'ECONNREFUSED', 'EHOSTUNREACH', 'ENOTFOUND'].includes(code)) {
    return {
      code: 'SMTP_CONNECTION_FAILED',
      message: 'Relay-сервер не смог подключиться к SMTP-серверу'
    }
  }

  if (responseCode >= 400) {
    return {
      code: 'SMTP_REJECTED',
      message: 'SMTP-сервер отклонил отправку письма'
    }
  }

  return {
    code: 'SMTP_DELIVERY_FAILED',
    message: 'Почтовый сервис не смог отправить письмо'
  }
}

app.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'angel-wings-telegram-relay',
    telegramConfigured: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ORDERS_CHAT_ID),
    emailConfigured: Boolean(
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD &&
      (process.env.EMAIL_RELAY_SECRET || process.env.TELEGRAM_RELAY_SECRET)
    )
  })
})

app.post('/email/send', requireRelayAuth, async (req, res) => {
  const to = String(req.body?.to || '').trim()
  const subject = String(req.body?.subject || '').trim()
  const text = String(req.body?.text || '')
  const html = String(req.body?.html || '')

  if (!/^\S+@\S+\.\S+$/.test(to) || !subject || (!text && !html)) {
    return res.status(400).json({ ok: false, error: 'Invalid email payload' })
  }

  try {
    const from = getRequiredEnv('SMTP_FROM')
    console.log('[RELAY] Email send request', JSON.stringify({ to, subject }))

    const result = await getMailTransporter().sendMail({
      from: `"Angel Wings" <${from}>`,
      to,
      subject,
      text,
      html: html || undefined
    })

    console.log('[RELAY] Email send success', JSON.stringify({
      to,
      messageId: result.messageId || null,
      accepted: result.accepted || [],
      rejected: result.rejected || []
    }))

    return res.json({
      ok: true,
      messageId: result.messageId || null,
      accepted: result.accepted || [],
      rejected: result.rejected || []
    })
  } catch (error) {
    const emailError = getEmailErrorInfo(error)
    console.error('[RELAY] Email send failed', JSON.stringify({
      to,
      emailErrorCode: emailError.code,
      code: error?.code || null,
      command: error?.command || null,
      responseCode: error?.responseCode || null,
      message: error?.message || null
    }))
    return res.status(503).json({
      ok: false,
      error: 'Email delivery failed',
      code: emailError.code,
      message: emailError.message
    })
  }
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

  res.status(202).json({ ok: true, queued: true })

  setImmediate(async () => {
    try {
      const response = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, payload, {
        timeout: Number(process.env.TELEGRAM_SEND_TIMEOUT_MS || 30000),
        headers: { 'Content-Type': 'application/json' },
        httpsAgent: telegramAgent,
        validateStatus: () => true
      })

      const data = response?.data && typeof response.data === 'object' ? response.data : {}
      console.log('[RELAY] Telegram response', JSON.stringify({
        orderId,
        httpStatus: response?.status || null,
        ok: data?.ok,
        messageId: data?.result?.message_id || null,
        description: data?.description || null
      }))

      if (Number(response?.status || 0) >= 400 || data?.ok === false) {
        console.error('[RELAY] Telegram send failed', JSON.stringify({
          orderId,
          telegramStatus: response?.status || null,
          error: data?.description || 'Telegram sendMessage failed'
        }))
      }
    } catch (error) {
      console.error('[RELAY] Telegram network error', JSON.stringify({
        orderId,
        message: error?.message || null,
        code: error?.cause?.code || error?.code || null
      }))
    }
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
