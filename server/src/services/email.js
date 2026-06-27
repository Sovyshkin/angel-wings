import nodemailer from 'nodemailer'
import crypto from 'node:crypto'

const DEFAULT_FROM = 'info@angel-wings.ru'

function getSmtpConfig() {
  const host = process.env.SMTP_HOST || 'mail.hosting.reg.ru'
  const port = Number(process.env.SMTP_PORT || 465)
  const secure = String(process.env.SMTP_SECURE || 'true').toLowerCase() !== 'false'
  const user = process.env.SMTP_USER || DEFAULT_FROM
  const pass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS
  const from = process.env.SMTP_FROM || user || DEFAULT_FROM

  return { host, port, secure, user, pass, from }
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
    const config = getSmtpConfig()
    return Boolean(config.host && config.port && config.user && config.pass)
  }

  getTransporter() {
    const config = getSmtpConfig()
    const key = `${config.host}:${config.port}:${config.secure}:${config.user}`

    if (this.transporter && this.transporterKey === key) {
      return this.transporter
    }

    this.transporterKey = key
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.pass
      }
    })

    return this.transporter
  }

  async sendMail({ to, subject, text, html }) {
    const config = getSmtpConfig()

    if (!this.isConfigured()) {
      const error = new Error('SMTP не настроен. Укажите SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD и SMTP_FROM в .env')
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
      host: config.host,
      port: config.port,
      secure: config.secure
    }))

    const result = await this.getTransporter().sendMail(message)

    console.log('[EMAIL] sendMail success', JSON.stringify({
      to,
      messageId: result.messageId || null,
      accepted: result.accepted || [],
      rejected: result.rejected || []
    }))

    return result
  }

  async sendVerificationCode({ to, name, code }) {
    const safeName = escapeHtml(name || 'клиент')
    const safeCode = escapeHtml(code)

    return this.sendMail({
      to,
      subject: 'Код подтверждения Angel Wings',
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
            <h1 style="margin:0 0 12px;font-size:24px">Подтверждение email</h1>
            <p style="margin:0 0 18px;font-size:16px;line-height:1.5">Здравствуйте, ${safeName}! Введите этот код на сайте Angel Wings:</p>
            <div style="font-size:32px;letter-spacing:8px;font-weight:700;background:#eef2ff;color:#24316f;border-radius:16px;padding:18px;text-align:center">${safeCode}</div>
            <p style="margin:18px 0 0;color:#73788a;font-size:14px">Код действует 15 минут. Если вы не запрашивали код, письмо можно удалить.</p>
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
