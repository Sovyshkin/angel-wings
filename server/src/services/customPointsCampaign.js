import { readFile } from 'node:fs/promises'
import { join, basename } from 'node:path'
import emailService from './email.js'
import { sendPointsCampaignTelegram } from './telegram.js'
import { uploadDir } from '../utils/fileUpload.js'
import { hasTelegramCampaignId, hasVerifiedCampaignEmail, normalizeCampaignEmail } from '../utils/pointsCampaignPreview.js'

const DAY = 86400000
const CUSTOMER_ROLES = new Set(['USER', 'PARTNER'])
const DEFAULTS = {
  title: 'Подарок Angel Wings', amount: 4000, lookbackDays: 45, minPaidOrders: 0, maxPaidOrders: 1, targetUserIds: '', excludeClaimedAnyCampaign: false,
  roles: ['USER', 'PARTNER'], emailEnabled: true, telegramEnabled: true, siteEnabled: true,
  requireEmailConsent: false, respectTelegramUnsubscribe: true, validityDays: 30,
  claimUntil: '', imageUrl: '', emailSubject: 'Вам доступны {{points}} баллов Angel Wings',
  emailBody: 'Здравствуйте, {{name}}!\n\nВам доступны {{points}} баллов. Войдите в аккаунт и нажмите «Получить».\n\n{{claim_url}}',
  telegramBody: '🎁 Вам доступны {{points}} баллов Angel Wings! Нажмите «Получить» в мини-приложении.',
  claimTitle: 'Ваши баллы ждут вас', claimBody: 'Нажмите «Получить», чтобы баллы появились на балансе.',
  buttonText: 'Получить {{points}} баллов'
}

const clean = value => String(value ?? '').trim()
const integer = (value, min, max, label) => {
  const number = Number(value)
  if (!Number.isInteger(number) || number < min || number > max) throw Object.assign(new Error(`${label}: допустимо от ${min} до ${max}`), { status: 400 })
  return number
}
const bad = message => { throw Object.assign(new Error(message), { status: 400 }) }

export function validateCampaignSettings(input = {}) {
  const settings = { ...DEFAULTS, ...input }
  settings.title = clean(settings.title).slice(0, 120)
  if (settings.title.length < 3) bad('Укажите название кампании')
  settings.amount = integer(settings.amount, 1, 100000, 'Баллы')
  settings.lookbackDays = integer(settings.lookbackDays, 1, 365, 'Период покупок')
  settings.maxPaidOrders = integer(settings.maxPaidOrders, 0, 100, 'Максимум покупок')
  settings.minPaidOrders = integer(settings.minPaidOrders, 0, settings.maxPaidOrders, 'Минимум покупок')
  settings.targetUserIds = clean(settings.targetUserIds)
  if (settings.targetUserIds && (!/^[\d,\s]+$/.test(settings.targetUserIds) || settings.targetUserIds.length > 3000)) bad('ID пользователей укажите через запятую')
  const targetIds = settings.targetUserIds.split(/[\s,]+/).filter(Boolean).map(Number)
  if (targetIds.some(id => !Number.isSafeInteger(id) || id < 1)) bad('Укажите существующие положительные ID пользователей')
  settings.targetUserIds = [...new Set(targetIds)].join(', ')
  settings.validityDays = integer(settings.validityDays, 1, 365, 'Срок действия баллов')
  settings.roles = [...new Set(Array.isArray(settings.roles) ? settings.roles : [])].filter(role => CUSTOMER_ROLES.has(role))
  if (!settings.roles.length) bad('Выберите хотя бы одну роль')
  for (const field of ['emailEnabled', 'telegramEnabled', 'siteEnabled', 'requireEmailConsent', 'respectTelegramUnsubscribe', 'excludeClaimedAnyCampaign']) settings[field] = settings[field] === true
  if (!settings.emailEnabled && !settings.telegramEnabled && !settings.siteEnabled) bad('Выберите хотя бы один канал')
  for (const field of ['emailSubject', 'emailBody', 'telegramBody', 'claimTitle', 'claimBody', 'buttonText']) {
    settings[field] = clean(settings[field])
    if (settings[field].length < 3 || settings[field].length > 4000) bad(`Проверьте поле ${field}`)
  }
  settings.claimUntil = clean(settings.claimUntil)
  if (settings.claimUntil && (Number.isNaN(Date.parse(settings.claimUntil)) || new Date(settings.claimUntil) <= new Date())) bad('Дата окончания получения должна быть в будущем')
  settings.imageUrl = clean(settings.imageUrl)
  if (settings.imageUrl && !/^\/uploads\/[a-f\d-]+\.(png|jpg|jpeg|webp)$/i.test(settings.imageUrl)) bad('Загрузите изображение через форму кампании')
  if (settings.telegramEnabled && /\.webp$/i.test(settings.imageUrl)) bad('Для Telegram загрузите PNG или JPEG')
  return settings
}

export function renderCampaignText(template, values) {
  return clean(template).replace(/\{\{\s*(name|points|claim_url)\s*\}\}/gi, (_, key) => String(values[key.toLowerCase()] || ''))
}

export function publicCampaign(campaign) {
  return { ...campaign, settings: JSON.parse(campaign.settingsJson), settingsJson: undefined }
}

export async function previewCampaign(db, settings, now = new Date()) {
  const since = new Date(now.getTime() - settings.lookbackDays * DAY)
  const targetIds = settings.targetUserIds ? settings.targetUserIds.split(',').map(Number) : null
  const [users, orders, priorClaims] = await Promise.all([
    db.user.findMany({ where: { role: { in: settings.roles }, ...(targetIds ? { id: { in: targetIds } } : {}) }, orderBy: { id: 'asc' }, select: { id: true, name: true, role: true, email: true, emailVerified: true, marketingConsentAt: true, marketingUnsubscribedAt: true, telegramId: true } }),
    db.order.findMany({ where: { createdAt: { gte: since, lte: now }, paymentStatus: 'PAID', status: { notIn: ['CANCELLED', 'RETURNED'] } }, select: { id: true, userId: true, customerEmail: true } }),
    settings.excludeClaimedAnyCampaign ? db.pointCampaignOffer.findMany({ where: { claimedAt: { not: null } }, select: { userId: true } }) : Promise.resolve([])
  ])
  const priorClaimedIds = new Set(priorClaims.map(offer => offer.userId))
  const byUser = new Map(), byEmail = new Map()
  for (const order of orders) {
    if (order.userId != null) {
      if (!byUser.has(order.userId)) byUser.set(order.userId, new Set())
      byUser.get(order.userId).add(order.id)
    }
    const email = normalizeCampaignEmail(order.customerEmail)
    if (email) {
      if (!byEmail.has(email)) byEmail.set(email, new Set())
      byEmail.get(email).add(order.id)
    }
  }
  const selected = [], emails = new Set(), telegramIds = new Set()
  const counts = { checked: users.length, eligible: 0, excludedPurchases: 0, excludedPriorClaim: 0, excludedNoChannel: 0, email: 0, telegram: 0, site: 0, noExternalChannel: 0, pointsIfAllClaim: 0, periodStart: since.toISOString(), periodEnd: now.toISOString() }
  for (const user of users) {
    const email = normalizeCampaignEmail(user.email)
    const purchases = new Set([...(byUser.get(user.id) || []), ...(byEmail.get(email) || [])]).size
    if (purchases < settings.minPaidOrders || purchases > settings.maxPaidOrders) { counts.excludedPurchases++; continue }
    if (priorClaimedIds.has(user.id)) { counts.excludedPriorClaim++; continue }
    const canEmail = settings.emailEnabled && hasVerifiedCampaignEmail(user) && (!settings.requireEmailConsent || Boolean(user.marketingConsentAt && !user.marketingUnsubscribedAt)) && !emails.has(email)
    const telegramId = clean(user.telegramId)
    const canTelegram = settings.telegramEnabled && hasTelegramCampaignId(user) && (!settings.respectTelegramUnsubscribe || !user.marketingUnsubscribedAt) && !telegramIds.has(telegramId)
    if (!settings.siteEnabled && !canEmail && !canTelegram) { counts.excludedNoChannel++; continue }
    if (canEmail) { emails.add(email); counts.email++ }
    if (canTelegram) { telegramIds.add(telegramId); counts.telegram++ }
    if (settings.siteEnabled) counts.site++
    if (!canEmail && !canTelegram) counts.noExternalChannel++
    counts.eligible++
    selected.push({ user, emailStatus: canEmail ? 'PENDING' : 'SKIPPED', telegramStatus: canTelegram ? 'PENDING' : 'SKIPPED' })
  }
  counts.pointsIfAllClaim = counts.eligible * settings.amount
  return { counts, selected }
}

export async function campaignStatus(db, campaign) {
  const offers = await db.pointCampaignOffer.findMany({ where: { campaignKey: campaign.key }, select: { claimedAt: true, emailStatus: true, telegramStatus: true } })
  const result = { offers: offers.length, claimed: 0, email: {}, telegram: {} }
  for (const offer of offers) {
    if (offer.claimedAt) result.claimed++
    result.email[offer.emailStatus] = (result.email[offer.emailStatus] || 0) + 1
    result.telegram[offer.telegramStatus] = (result.telegram[offer.telegramStatus] || 0) + 1
  }
  return result
}

export async function prepareCampaign(db, campaign, expected) {
  if (campaign.status !== 'DRAFT') bad('Подготовить можно только черновик')
  const settings = JSON.parse(campaign.settingsJson)
  const { counts, selected } = await previewCampaign(db, settings)
  const fields = ['eligible', 'email', 'telegram', 'site', 'pointsIfAllClaim']
  if (counts.eligible < 1 || !expected || fields.some(field => counts[field] !== expected[field])) bad(`Аудитория изменилась. Новый размер: ${counts.eligible}. Обновите предпросмотр.`)
  await db.$transaction(async tx => {
    const reserved = await tx.pointsCampaign.updateMany({ where: { id: campaign.id, status: 'DRAFT' }, data: { status: 'PREPARED' } })
    if (reserved.count !== 1) bad('Кампания уже подготовлена')
    await tx.pointCampaignOffer.createMany({ data: selected.map(({ user, emailStatus, telegramStatus }) => ({ campaignKey: campaign.key, userId: user.id, amount: settings.amount, emailStatus, telegramStatus })) })
  })
  return counts
}

async function imageForCampaign(settings) {
  if (!settings.imageUrl) return null
  const filename = basename(settings.imageUrl)
  const content = await readFile(join(uploadDir, filename))
  const extension = filename.split('.').pop().toLowerCase()
  const contentType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg'
  return { filename, content, contentType, cid: `campaign-${filename}@angel-wings.ru` }
}

export async function processCampaignBatch(db, campaign, limit = 20, delivery = { sendEmail: message => emailService.sendMail(message), sendTelegram: (chatId, message) => sendPointsCampaignTelegram(chatId, message) }) {
  if (campaign.status !== 'SENDING') return 0
  const settings = JSON.parse(campaign.settingsJson)
  const offers = await db.pointCampaignOffer.findMany({ where: { campaignKey: campaign.key, OR: [{ emailStatus: 'PENDING' }, { telegramStatus: 'PENDING' }] }, include: { user: { select: { id: true, name: true, email: true, emailVerified: true, telegramId: true, marketingConsentAt: true, marketingUnsubscribedAt: true } } }, orderBy: { id: 'asc' }, take: limit })
  let processed = 0, emailFailures = 0, telegramFailures = 0
  for (const offer of offers) {
    const state = await db.pointsCampaign.findUnique({ where: { id: campaign.id }, select: { status: true } })
    if (state?.status !== 'SENDING') break
    const values = { name: offer.user.name || 'клиент', points: offer.amount.toLocaleString('ru-RU'), claim_url: `https://angel-wings.ru/?claim=${encodeURIComponent(campaign.key)}` }
    if (offer.emailStatus === 'PENDING' && emailFailures < 5) {
      const lock = await db.pointCampaignOffer.updateMany({ where: { id: offer.id, emailStatus: 'PENDING' }, data: { emailStatus: 'SENDING', emailError: null } })
      if (lock.count) {
        try {
          if (!hasVerifiedCampaignEmail(offer.user) || (settings.requireEmailConsent && (!offer.user.marketingConsentAt || offer.user.marketingUnsubscribedAt))) throw new Error('Email больше не подходит под условия')
          const text = renderCampaignText(settings.emailBody, values)
          const image = await imageForCampaign(settings)
          const escaped = text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]).replace(/\n/g, '<br>')
          const imageHtml = image ? `<img src="cid:${image.cid}" alt="" style="display:block;width:100%;height:auto;margin-bottom:20px">` : ''
          const button = renderCampaignText(settings.buttonText, values).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char])
          await delivery.sendEmail({ to: offer.user.email, subject: renderCampaignText(settings.emailSubject, values), text, html: `<div style="max-width:640px;margin:auto;padding:24px;font:16px/1.6 Arial,sans-serif;color:#16203b;background:#fff">${imageHtml}<p>${escaped}</p><a href="${values.claim_url}" style="display:inline-block;padding:14px 22px;border-radius:12px;background:#a8baff;color:#101832;text-decoration:none;font-weight:bold">${button}</a></div>`, inlineImage: image })
          await db.pointCampaignOffer.update({ where: { id: offer.id }, data: { emailStatus: 'SENT', emailSentAt: new Date() } })
          emailFailures = 0
        } catch (error) {
          await db.pointCampaignOffer.update({ where: { id: offer.id }, data: { emailStatus: 'FAILED', emailError: clean(error.message || error).slice(0, 500) } })
          emailFailures++
        }
        processed++
      }
    }
    if (offer.telegramStatus === 'PENDING' && telegramFailures < 5) {
      const lock = await db.pointCampaignOffer.updateMany({ where: { id: offer.id, telegramStatus: 'PENDING' }, data: { telegramStatus: 'SENDING', telegramError: null } })
      if (lock.count) {
        try {
          if (!hasTelegramCampaignId(offer.user) || (settings.respectTelegramUnsubscribe && offer.user.marketingUnsubscribedAt)) throw new Error('Telegram больше не подходит под условия')
          const image = await imageForCampaign(settings)
          await delivery.sendTelegram(offer.user.telegramId, { campaignKey: campaign.key, text: renderCampaignText(settings.telegramBody, values), buttonText: renderCampaignText(settings.buttonText, values), imageBase64: image?.content.toString('base64') || null, imageType: image?.contentType || null })
          await db.pointCampaignOffer.update({ where: { id: offer.id }, data: { telegramStatus: 'SENT', telegramSentAt: new Date() } })
          telegramFailures = 0
        } catch (error) {
          const unavailable = [400, 403].includes(Number(error.relayStatus)) && /bot was blocked|chat not found|user is deactivated|bot can't initiate/i.test(error.relayError || '')
          await db.pointCampaignOffer.update({ where: { id: offer.id }, data: { telegramStatus: unavailable ? 'SKIPPED' : 'FAILED', telegramError: clean(error.message || error).slice(0, 500) } })
          if (!unavailable) telegramFailures++
        }
        processed++
      }
    }
  }
  if (emailFailures >= 5 || telegramFailures >= 5) {
    await db.pointsCampaign.updateMany({ where: { id: campaign.id, status: 'SENDING' }, data: { status: 'PAUSED' } })
    console.warn('[POINTS_CAMPAIGN] Paused after five consecutive failures', campaign.key)
  }
  if (offers.length < limit && emailFailures < 5 && telegramFailures < 5) {
    const pending = await db.pointCampaignOffer.count({ where: { campaignKey: campaign.key, OR: [{ emailStatus: 'PENDING' }, { telegramStatus: 'PENDING' }] } })
    if (!pending) {
      const uncertain = await db.pointCampaignOffer.count({ where: { campaignKey: campaign.key, OR: [{ emailStatus: 'SENDING' }, { telegramStatus: 'SENDING' }] } })
      await db.pointsCampaign.updateMany({ where: { id: campaign.id, status: 'SENDING' }, data: { status: uncertain ? 'PAUSED' : 'FINISHED' } })
    }
  }
  return processed
}

let working = false
export function startCustomCampaignWorker(db) {
  const tick = async () => {
    if (working) return
    working = true
    try {
      const campaigns = await db.pointsCampaign.findMany({ where: { status: 'SENDING' }, orderBy: { id: 'asc' } })
      for (const campaign of campaigns) await processCampaignBatch(db, campaign)
    } catch (error) { console.error('[POINTS_CAMPAIGN] Worker failed:', error) }
    finally { working = false }
  }
  const timer = setInterval(tick, 15000)
  timer.unref?.()
  setTimeout(tick, 2000).unref?.()
  return () => clearInterval(timer)
}
