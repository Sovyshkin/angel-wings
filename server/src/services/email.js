import nodemailer from 'nodemailer'
import crypto from 'node:crypto'
import axios from 'axios'

const DEFAULT_FROM = 'info@angel-wings.ru'
const DEFAULT_CONNECTION_TIMEOUT_MS = 8000
const DEFAULT_GREETING_TIMEOUT_MS = 8000
const DEFAULT_SOCKET_TIMEOUT_MS = 15000

function getSmtpConfig() {
  const host = process.env.SMTP_HOST || 'mail.hosting.reg.ru'
  const port = Number(process.env.SMTP_PORT || 465)
  const secure = String(process.env.SMTP_SECURE || 'true').toLowerCase() !== 'false'
  const requireTLS = String(process.env.SMTP_REQUIRE_TLS ?? (port === 587 ? 'true' : 'false')).toLowerCase() === 'true'
  const user = process.env.SMTP_USER || DEFAULT_FROM
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS
  const from = process.env.SMTP_FROM || user || DEFAULT_FROM
  const connectionTimeout = Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || DEFAULT_CONNECTION_TIMEOUT_MS)
  const greetingTimeout = Number(process.env.SMTP_GREETING_TIMEOUT_MS || DEFAULT_GREETING_TIMEOUT_MS)
  const socketTimeout = Number(process.env.SMTP_SOCKET_TIMEOUT_MS || DEFAULT_SOCKET_TIMEOUT_MS)

  return {
    host,
    port,
    secure,
    requireTLS,
    user,
    pass,
    from,
    connectionTimeout,
    greetingTimeout,
    socketTimeout
  }
}

function getRelayConfig() {
  return {
    url: String(process.env.EMAIL_RELAY_URL || '').trim().replace(/\/+$/, ''),
    secret: String(
      process.env.EMAIL_RELAY_SECRET ||
      process.env.TELEGRAM_RELAY_SECRET ||
      ''
    ).trim(),
    timeout: Number(process.env.EMAIL_RELAY_TIMEOUT_MS || 20000)
  }
}

function createRelaySignature(secret, timestamp, body) {
  return crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${body}`)
    .digest('hex')
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function textToHtml(text) {
  return escapeHtml(text).replace(/\n/g, '<br>')
}

class EmailService {
  constructor() {
    this.transporter = null
    this.transporterKey = ''
  }

  isConfigured() {
    const relay = getRelayConfig()
    if (relay.url) {
      return Boolean(relay.secret)
    }

    const config = getSmtpConfig()
    return Boolean(config.host && config.port && config.user && config.pass)
  }

  async sendViaRelay(message) {
    const relay = getRelayConfig()
    if (!relay.url || !relay.secret) {
      const error = new Error('EMAIL_RELAY_URL или EMAIL_RELAY_SECRET не настроены')
      error.code = 'EMAIL_RELAY_NOT_CONFIGURED'
      throw error
    }

    const payload = {
      to: message.to,
      subject: message.subject,
      text: message.text || '',
      html: message.html || ''
    }
    const body = JSON.stringify(payload)
    const timestamp = String(Date.now())
    const signature = createRelaySignature(relay.secret, timestamp, body)

    const response = await axios.post(`${relay.url}/email/send`, body, {
      timeout: relay.timeout,
      headers: {
        'Content-Type': 'application/json',
        'X-AngelWings-Timestamp': timestamp,
        'X-AngelWings-Signature': signature
      },
      validateStatus: () => true
    })

    if (Number(response.status || 0) >= 400 || response.data?.ok === false) {
      const error = new Error(response.data?.error || `Email relay returned HTTP ${response.status}`)
      error.code = 'EMAIL_RELAY_REJECTED'
      error.responseCode = response.status
      throw error
    }

    return {
      messageId: response.data?.messageId || null,
      accepted: response.data?.accepted || [message.to],
      rejected: response.data?.rejected || []
    }
  }

  getTransporter() {
    const config = getSmtpConfig()
    const key = `${config.host}:${config.port}:${config.secure}:${config.requireTLS}:${config.user}`

    if (this.transporter && this.transporterKey === key) {
      return this.transporter
    }

    this.transporterKey = key
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      requireTLS: config.requireTLS,
      family: 4,
      connectionTimeout: config.connectionTimeout,
      greetingTimeout: config.greetingTimeout,
      socketTimeout: config.socketTimeout,
      auth: {
        user: config.user,
        pass: config.pass
      },
      tls: {
        servername: config.host,
        rejectUnauthorized: true
      },
      disableFileAccess: true,
      disableUrlAccess: true
    })

    return this.transporter
  }

  async sendMail({ to, subject, text, html }) {
    const config = getSmtpConfig()
    const relay = getRelayConfig()

    if (!this.isConfigured()) {
      const error = new Error('Отправка почты не настроена. Проверьте EMAIL_RELAY_URL/EMAIL_RELAY_SECRET или SMTP-параметры в .env')
      error.code = 'SMTP_NOT_CONFIGURED'
      throw error
    }

    const message = {
      from: `"Angel Wings" <${config.from}>`,
      to,
      subject,
      text,
      html: html || textToHtml(text || '')
    }

    console.log('[EMAIL] sendMail request', JSON.stringify({
      to,
      subject,
      mode: relay.url ? 'relay' : 'smtp',
      target: relay.url || `${config.host}:${config.port}`,
      secure: relay.url ? true : config.secure,
      requireTLS: relay.url ? null : config.requireTLS
    }))

    let result
    try {
      result = relay.url
        ? await this.sendViaRelay(message)
        : await this.getTransporter().sendMail(message)
    } catch (error) {
      const nestedErrors = Array.isArray(error?.errors)
        ? error.errors.map(item => ({
            code: item?.code || null,
            message: item?.message || null,
            address: item?.address || null,
            port: item?.port || null
          }))
        : []
      console.error('[EMAIL] sendMail failed', JSON.stringify({
        to,
        mode: relay.url ? 'relay' : 'smtp',
        target: relay.url || `${config.host}:${config.port}`,
        code: error?.code || error?.cause?.code || null,
        command: error?.command || null,
        responseCode: error?.responseCode || null,
        message: error?.message || error?.cause?.message || 'Unknown delivery error',
        nestedErrors
      }))

      const deliveryError = new Error(
        'Не удалось отправить письмо. Почтовый сервис временно недоступен, попробуйте ещё раз через несколько минут.'
      )
      deliveryError.name = 'EmailDeliveryError'
      deliveryError.code = 'EMAIL_DELIVERY_FAILED'
      deliveryError.status = 503
      deliveryError.cause = error
      throw deliveryError
    }

    console.log('[EMAIL] sendMail success', JSON.stringify({
      to,
      messageId: result.messageId || null,
      accepted: result.accepted || [],
      rejected: result.rejected || []
    }))

    return result
  }

  async sendVerificationCode({ to, name, code, purpose = 'email_verification' }) {
    const safeName = escapeHtml(name || 'клиент')
    const safeCode = escapeHtml(code)
    const isLogin = purpose === 'login_verification'
    const subject = isLogin ? 'Код для входа в Angel Wings' : 'Код подтверждения Angel Wings'
    const heading = isLogin ? 'Подтверждение входа' : 'Подтверждение email'

    return this.sendMail({
      to,
      subject,
      text: [
        `Здравствуйте, ${name || 'клиент'}!`,
        '',
        `Ваш код подтверждения: ${code}`,
        '',
        'Код действует 15 минут.',
        'Если вы не запрашивали код, просто проигнорируйте это письмо.'
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:28px;background:#f6f7fb;color:#151722">
          <div style="background:#fff;border-radius:20px;padding:28px;border:1px solid #e7e9f2">
            <h1 style="margin:0 0 12px;font-size:24px">${heading}</h1>
            <p style="margin:0 0 18px;font-size:16px;line-height:1.5">Здравствуйте, ${safeName}! Введите этот код на сайте Angel Wings:</p>
            <div style="font-size:32px;letter-spacing:8px;font-weight:700;background:#eef2ff;color:#24316f;border-radius:16px;padding:18px;text-align:center">${safeCode}</div>
            <p style="margin:18px 0 0;color:#73788a;font-size:14px">Код действует 15 минут. Если вы не запрашивали код, письмо можно удалить.</p>
          </div>
        </div>
      `
    })
  }

  async sendAdminInvite({ to, name, password, adminUrl }) {
    const safeName = escapeHtml(name || 'администратор')
    const safeEmail = escapeHtml(to)
    const safePassword = escapeHtml(password)
    const safeAdminUrl = escapeHtml(adminUrl)

    return this.sendMail({
      to,
      subject: 'Вас назначили администратором Angel Wings',
      text: [
        `Здравствуйте, ${name || 'администратор'}!`,
        '',
        'Вас назначили администратором Angel Wings.',
        '',
        `Панель администратора: ${adminUrl}`,
        `Логин: ${to}`,
        `Временный пароль: ${password}`,
        '',
        'После входа рекомендуем сменить пароль на новый надежный.',
        'Если вы не ожидали это письмо, пожалуйста, свяжитесь с владельцем магазина.'
      ].join('\n'),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:28px;background:#f6f7fb;color:#151722">
          <div style="background:#fff;border-radius:22px;padding:30px;border:1px solid #e7e9f2">
            <div style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#8da2ff;font-weight:700;margin-bottom:12px">Angel Wings</div>
            <h1 style="margin:0 0 14px;font-size:25px;line-height:1.2">Вас назначили администратором</h1>
            <p style="margin:0 0 22px;font-size:16px;line-height:1.55">Здравствуйте, ${safeName}! Для вас создан доступ к админ-панели Angel Wings.</p>

            <div style="background:#f3f5ff;border-radius:18px;padding:20px;margin:0 0 22px;border:1px solid #dfe5ff">
              <p style="margin:0 0 10px;color:#687087;font-size:14px">Ссылка для входа</p>
              <a href="${safeAdminUrl}" style="display:inline-block;color:#5068d9;font-size:16px;font-weight:700;text-decoration:none">${safeAdminUrl}</a>
              <div style="height:16px"></div>
              <p style="margin:0 0 8px;color:#687087;font-size:14px">Логин</p>
              <div style="font-size:17px;font-weight:700;color:#151722">${safeEmail}</div>
              <div style="height:16px"></div>
              <p style="margin:0 0 8px;color:#687087;font-size:14px">Временный пароль</p>
              <div style="font-family:Menlo,Consolas,monospace;font-size:20px;font-weight:700;letter-spacing:.04em;background:#151722;color:#fff;border-radius:14px;padding:14px 16px">${safePassword}</div>
            </div>

            <p style="margin:0;color:#73788a;font-size:14px;line-height:1.5">После первого входа рекомендуем сменить пароль на новый надежный. Если вы не ожидали это письмо, свяжитесь с владельцем магазина.</p>
          </div>
        </div>
      `
    })
  }

  async sendCampaignEmail({ to, subject, body }) {
    return this.sendMail({
      to,
      subject,
      text: body,
      html: textToHtml(body)
    })
  }
}

export function generateEmailCode() {
  return String(crypto.randomInt(100000, 1000000))
}

export function hashEmailCode(code) {
  return crypto
    .createHash('sha256')
    .update(String(code || '').trim())
    .digest('hex')
}

export default new EmailService()
