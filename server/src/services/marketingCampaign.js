import jwt from 'jsonwebtoken'
import { readFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import emailService from './email.js'
import { sendPointsCampaignTelegram } from './telegram.js'
import { renderEmailCampaign } from '../utils/emailCampaignTemplate.js'
import { hasTelegramCampaignId, hasVerifiedCampaignEmail } from '../utils/pointsCampaignPreview.js'
import { uploadDir } from '../utils/fileUpload.js'

const clean = value => String(value || '').trim()
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
const personalize = (value, name) => String(value || '').replace(/\{\{\s*name\s*\}\}/gi, name || 'клиент')

async function telegramCampaignImage(imageUrl) {
  if (!imageUrl) return null
  let pathname
  try { pathname = new URL(imageUrl).pathname } catch { return null }
  if (!/^\/uploads\/[a-f\d-]+\.(?:png|jpe?g)$/i.test(pathname)) return null
  const content = await readFile(join(uploadDir, basename(pathname)))
  if (content.length > 5 * 1024 * 1024) throw new Error('Изображение Telegram больше 5 МБ')
  return { imageBase64: content.toString('base64'), imageType: /\.png$/i.test(pathname) ? 'image/png' : 'image/jpeg' }
}

export async function resolveMarketingAudience(db, settings) {
  if (settings.audience === 'blog') {
    const subscribers = await db.blogSubscriber.findMany({ where: { active: true }, select: { id: true, email: true }, orderBy: { createdAt: 'desc' } })
    const seen = new Set()
    const emails = subscribers.filter(row => {
      const email = clean(row.email).toLowerCase()
      if (!email || seen.has(email)) return false
      seen.add(email)
      return true
    })
    return { users: [], emails, telegramIds: new Set(), counts: { total: emails.length, email: emails.length, telegram: 0, site: 0 } }
  }

  const selectedAudience = settings.audience === 'selected'
  const users = await db.user.findMany({
    where: {
      ...(selectedAudience
        ? { id: { in: settings.targetUserIds } }
        : { ...(settings.audience === 'partners' ? { role: 'PARTNER' } : settings.audience === 'clients' ? { role: 'USER' } : {}), marketingUnsubscribedAt: null })
    },
    select: { id: true, name: true, role: true, email: true, emailVerified: true, telegramId: true, marketingConsentAt: true, marketingUnsubscribedAt: true },
    orderBy: { id: 'asc' }
  })
  const emails = [], selected = [], seenEmails = new Set(), telegramIds = new Set()
  const excluded = []
  const exclude = (user, reason) => excluded.push({ id: user.id, name: user.name, email: user.email, reason })
  let siteCount = 0
  for (const user of users) {
    if (user.marketingUnsubscribedAt) {
      if (selectedAudience) exclude(user, 'Пользователь отписался от рассылки')
      continue
    }
    const email = clean(user.email).toLowerCase()
    const canEmail = settings.emailEnabled && hasVerifiedCampaignEmail(user) && !seenEmails.has(email)
    const telegramId = clean(user.telegramId)
    const canTelegram = settings.telegramEnabled && hasTelegramCampaignId(user) && !telegramIds.has(telegramId)
    if (canEmail) { seenEmails.add(email); emails.push(user) }
    if (canTelegram) telegramIds.add(telegramId)
    if (!canEmail && !canTelegram && !settings.siteEnabled) {
      if (selectedAudience) exclude(user, 'Нет доступного выбранного канала: проверьте подтверждение почты и подключение Telegram')
      continue
    }
    if (settings.siteEnabled) siteCount++
    selected.push({ user, emailStatus: canEmail ? 'PENDING' : 'SKIPPED', telegramStatus: canTelegram ? 'PENDING' : 'SKIPPED' })
  }
  if (selectedAudience) {
    const found = new Set(users.map(user => user.id))
    for (const id of settings.targetUserIds) if (!found.has(id)) excluded.push({ id, name: '', email: '', reason: 'Аккаунт не найден' })
    excluded.sort((a, b) => settings.targetUserIds.indexOf(a.id) - settings.targetUserIds.indexOf(b.id))
  }
  return { users: selected, emails, telegramIds, excluded, selectedCount: selectedAudience ? settings.targetUserIds.length : null, counts: { total: selected.length, email: emails.length, telegram: telegramIds.size, site: siteCount } }
}

export async function processMarketingCampaignBatch(db, campaign, limit = 20, delivery = {
  sendEmail: message => emailService.sendCampaignEmail(message),
  sendTelegram: (chatId, message) => sendPointsCampaignTelegram(chatId, message)
}) {
  if (campaign.status !== 'SENDING' || !campaign.settingsJson) return 0
  const settings = JSON.parse(campaign.settingsJson)
  let telegramImage
  if (settings.telegramEnabled) {
    try { telegramImage = await telegramCampaignImage(settings.imageUrl) } catch (error) { console.warn('[MARKETING] Telegram image is unavailable', campaign.id, error.message) }
  }
  const notices = await db.marketingNotice.findMany({
    where: { campaignId: campaign.id, OR: [{ emailStatus: 'PENDING' }, { telegramStatus: 'PENDING' }] },
    include: { user: { select: { name: true, email: true, emailVerified: true, telegramId: true, marketingConsentAt: true, marketingUnsubscribedAt: true } } },
    orderBy: { id: 'asc' }, take: limit
  })
  for (const notice of notices) {
    const user = notice.user
    const allowed = !user.marketingUnsubscribedAt
    if (notice.emailStatus === 'PENDING') {
      const lock = await db.marketingNotice.updateMany({ where: { id: notice.id, emailStatus: 'PENDING' }, data: { emailStatus: 'SENDING' } })
      if (lock.count) {
        try {
          if (!allowed || !hasVerifiedCampaignEmail(user)) {
            await db.marketingNotice.update({ where: { id: notice.id }, data: { emailStatus: 'SKIPPED', emailError: 'Пользователь отписался или почта не подтверждена' } })
          } else {
            const unsubscribeUrl = `https://angel-wings.ru/api/recovery/unsubscribe?token=${encodeURIComponent(jwt.sign({ userId: notice.userId, purpose: 'marketing_unsubscribe' }, process.env.JWT_SECRET, { expiresIn: '90d' }))}`
            const content = renderEmailCampaign(settings, user.name || 'клиент')
            await delivery.sendEmail({ to: user.email, subject: settings.subject, body: content.text + `\n\nОтписаться от рассылки: ${unsubscribeUrl}`, text: content.text + `\n\nОтписаться от рассылки: ${unsubscribeUrl}`, html: content.html + `<p style="text-align:center;font:12px Arial,sans-serif"><a href="${escapeHtml(unsubscribeUrl)}">Отписаться от рассылки</a></p>` })
            await db.marketingNotice.update({ where: { id: notice.id }, data: { emailStatus: 'SENT', emailSentAt: new Date() } })
          }
        } catch (error) {
          await db.marketingNotice.update({ where: { id: notice.id }, data: { emailStatus: 'FAILED', emailError: clean(error.message || error).slice(0, 500) } })
        }
      }
    }
    if (notice.telegramStatus === 'PENDING') {
      const lock = await db.marketingNotice.updateMany({ where: { id: notice.id, telegramStatus: 'PENDING' }, data: { telegramStatus: 'SENDING' } })
      if (lock.count) {
        try {
          if (!allowed || !hasTelegramCampaignId(user)) {
            await db.marketingNotice.update({ where: { id: notice.id }, data: { telegramStatus: 'SKIPPED', telegramError: 'Пользователь отписался или Telegram ID больше не действует' } })
          } else {
            await delivery.sendTelegram(user.telegramId, { campaignKey: `news-${campaign.id}`, text: personalize(settings.telegramBody, user.name).slice(0, 1024), buttonText: settings.buttonText || 'Открыть сайт', buttonUrl: settings.buttonUrl || 'https://angel-wings.ru/', ...(telegramImage || {}) })
            await db.marketingNotice.update({ where: { id: notice.id }, data: { telegramStatus: 'SENT', telegramSentAt: new Date() } })
          }
        } catch (error) {
          await db.marketingNotice.update({ where: { id: notice.id }, data: { telegramStatus: 'FAILED', telegramError: clean(error.message || error).slice(0, 500) } })
        }
      }
    }
  }
  const [pending, uncertain, emailSent, emailFailed, telegramFailed] = await Promise.all([
    db.marketingNotice.count({ where: { campaignId: campaign.id, OR: [{ emailStatus: 'PENDING' }, { telegramStatus: 'PENDING' }] } }),
    db.marketingNotice.count({ where: { campaignId: campaign.id, OR: [{ emailStatus: 'SENDING' }, { telegramStatus: 'SENDING' }] } }),
    db.marketingNotice.count({ where: { campaignId: campaign.id, emailStatus: 'SENT' } }),
    db.marketingNotice.count({ where: { campaignId: campaign.id, emailStatus: 'FAILED' } }),
    db.marketingNotice.count({ where: { campaignId: campaign.id, telegramStatus: 'FAILED' } })
  ])
  await db.emailCampaign.update({ where: { id: campaign.id }, data: {
    sent: emailSent, failed: emailFailed,
    ...(!pending ? { status: uncertain || emailFailed || telegramFailed ? 'PARTIAL' : 'SENT', sentAt: new Date(), ...(uncertain ? { errorLog: `${uncertain} отправок остались с неопределённым статусом после перезапуска. Проверьте доставку вручную.` } : {}) } : {})
  } })
  return notices.length
}

export function startMarketingCampaignWorker(db, intervalMs = 10000) {
  let running = false
  const tick = async () => {
    if (running) return
    running = true
    try {
      const campaign = await db.emailCampaign.findFirst({ where: { status: 'SENDING', settingsJson: { not: null } }, orderBy: { id: 'asc' } })
      if (campaign) await processMarketingCampaignBatch(db, campaign)
    } catch (error) {
      console.error('[MARKETING] campaign worker failed', error)
    } finally { running = false }
  }
  const timer = setInterval(tick, intervalMs)
  timer.unref?.()
  tick()
  return () => clearInterval(timer)
}
