import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { copyFile, mkdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import emailService from '../src/services/email.js'
import { sendPointsCampaignTelegram } from '../src/services/telegram.js'
import { uploadDir } from '../src/utils/fileUpload.js'
import { POINTS_CAMPAIGN_AMOUNT, POINTS_CAMPAIGN_KEY } from '../src/services/pointsCampaign.js'
import { buildPointsCampaignPreview, hasTelegramCampaignId, hasVerifiedCampaignEmail } from '../src/utils/pointsCampaignPreview.js'

const db = new PrismaClient()
const args = process.argv.slice(2)
const modeFlags = args.filter(arg => ['--preview', '--prepare', '--send', '--status'].includes(arg))
if (modeFlags.length > 1) throw new Error('Укажите только один режим: --preview, --prepare, --send или --status')
const mode = args.find(arg => ['--preview', '--prepare', '--send', '--status'].includes(arg)) || '--preview'
const expectedArg = args.find(arg => arg.startsWith('--expect='))
const expected = expectedArg ? Number(expectedArg.slice('--expect='.length)) : null
const retryFailed = args.includes('--retry-failed')
const assetName = 'points-campaign-offer.png'
const assetUrl = `https://angel-wings.ru/uploads/${assetName}`

function requireExpectedCount(actual) {
  if (!Number.isInteger(expected) || expected <= 0 || expected !== actual) {
    throw new Error(`Ожидалось --expect=${actual}. Проверьте аудиторию перед запуском.`)
  }
}

function emailMessage(user, photo) {
  const name = String(user.name || 'клиент').replace(/[<>&"']/g, '')
  return {
    to: user.email,
    subject: 'Для вас доступны 4 000 баллов Angel Wings',
    text: `Здравствуйте, ${user.name || 'клиент'}!\n\nДля вас доступны 4 000 баллов Angel Wings. Чтобы начислить их, войдите на сайт и нажмите «Получить». До нажатия баллы не находятся на вашем балансе.\n\n1 балл = 1 ₽. Неиспользованные баллы сгорят через 1 месяц после получения.\n\nПолучить баллы: https://angel-wings.ru/?claim=points-4000-2026-10-30`,
    html: `<div style="margin:0;padding:24px;background:#f3f5fb;font-family:Arial,sans-serif;color:#171a27"><div style="max-width:620px;margin:auto;background:#fff;border-radius:20px;overflow:hidden"><img src="cid:points-offer@angel-wings.ru" alt="Вам доступны 4 000 баллов Angel Wings" width="620" style="display:block;width:100%;height:auto"><div style="padding:28px 36px 36px"><h1 style="font-size:30px;line-height:1.2">Для вас доступны 4 000 баллов</h1><p>Здравствуйте, ${name}!</p><p>Войдите в аккаунт и нажмите <strong>«Получить»</strong>. Только после этого баллы появятся на вашем балансе.</p><p><strong>1 балл = 1 ₽.</strong> Неиспользованные баллы сгорят через 1 месяц после получения.</p><a href="https://angel-wings.ru/?claim=points-4000-2026-10-30" style="display:inline-block;margin-top:16px;padding:16px 24px;border-radius:12px;background:#a6b8ff;color:#111827;text-decoration:none;font-weight:bold">Получить 4 000 баллов</a></div></div></div>`,
    inlineImage: { filename: assetName, cid: 'points-offer@angel-wings.ru', content: photo }
  }
}

async function getPreview() {
  const now = new Date()
  const since = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)
  const [users, orders] = await Promise.all([
    db.user.findMany({ orderBy: { id: 'asc' }, select: { id: true, role: true, email: true, emailVerified: true, marketingConsentAt: true, marketingUnsubscribedAt: true, telegramId: true } }),
    db.order.findMany({
      where: { createdAt: { gte: since, lte: now }, paymentStatus: 'PAID', status: { notIn: ['CANCELLED', 'RETURNED'] } },
      select: { id: true, userId: true, customerEmail: true, createdAt: true, paymentStatus: true, status: true }
    })
  ])
  return buildPointsCampaignPreview(users, orders, now)
}

async function status() {
  const offers = await db.pointCampaignOffer.findMany({
    where: { campaignKey: POINTS_CAMPAIGN_KEY },
    select: { claimedAt: true, emailStatus: true, telegramStatus: true }
  })
  const counts = {
    offers: offers.length,
    claimed: offers.filter(offer => offer.claimedAt).length,
    email: {},
    telegram: {}
  }
  for (const offer of offers) {
    counts.email[offer.emailStatus] = (counts.email[offer.emailStatus] || 0) + 1
    counts.telegram[offer.telegramStatus] = (counts.telegram[offer.telegramStatus] || 0) + 1
  }
  console.log(JSON.stringify(counts, null, 2))
}

async function prepare() {
  const existing = await db.pointCampaignOffer.count({ where: { campaignKey: POINTS_CAMPAIGN_KEY } })
  if (existing) throw new Error(`Кампания уже подготовлена для ${existing} аккаунтов. Используйте --status.`)
  const preview = await getPreview()
  requireExpectedCount(preview.eligibleAccounts)
  const serverRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
  await mkdir(uploadDir, { recursive: true })
  await copyFile(join(serverRoot, 'assets', assetName), join(uploadDir, assetName))
  const users = await db.user.findMany({ where: { id: { in: preview.eligibleUserIds } }, orderBy: { id: 'asc' }, select: { id: true, email: true, emailVerified: true, telegramId: true, marketingUnsubscribedAt: true } })
  const usedEmails = new Set()
  const usedTelegramIds = new Set()
  await db.pointCampaignOffer.createMany({
    data: users.map(user => {
      const email = String(user.email || '').trim().toLowerCase()
      const telegramId = String(user.telegramId || '').trim()
      const emailPending = hasVerifiedCampaignEmail(user) && !usedEmails.has(email)
      const telegramPending = hasTelegramCampaignId(user) && !user.marketingUnsubscribedAt && !usedTelegramIds.has(telegramId)
      if (emailPending) usedEmails.add(email)
      if (telegramPending) usedTelegramIds.add(telegramId)
      return {
        campaignKey: POINTS_CAMPAIGN_KEY,
        userId: user.id,
        amount: POINTS_CAMPAIGN_AMOUNT,
        emailStatus: emailPending ? 'PENDING' : 'SKIPPED',
        telegramStatus: telegramPending ? 'PENDING' : 'SKIPPED'
      }
    })
  })
  console.log(`Создано ${users.length} предложений. Картинка размещена: ${assetUrl}. Баллы не начислены, сообщения не отправлены.`)
  await status()
}

async function send() {
  const count = await db.pointCampaignOffer.count({ where: { campaignKey: POINTS_CAMPAIGN_KEY } })
  requireExpectedCount(count)
  const states = retryFailed ? ['PENDING', 'FAILED'] : ['PENDING']
  const offers = await db.pointCampaignOffer.findMany({
    where: { campaignKey: POINTS_CAMPAIGN_KEY, OR: [{ emailStatus: { in: states } }, { telegramStatus: { in: states } }] },
    include: { user: { select: { id: true, name: true, email: true, emailVerified: true, telegramId: true } } },
    orderBy: { id: 'asc' }
  })
  const photo = await readFile(join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', assetName))
  let consecutiveEmailFailures = 0
  let consecutiveTelegramFailures = 0

  for (const offer of offers) {
    if (states.includes(offer.emailStatus) && consecutiveEmailFailures < 5) {
      const locked = await db.pointCampaignOffer.updateMany({
        where: { id: offer.id, emailStatus: { in: states } }, data: { emailStatus: 'SENDING', emailError: null }
      })
      if (locked.count) {
        try {
          if (!hasVerifiedCampaignEmail(offer.user)) throw new Error('Email больше не подтверждён или недействителен')
          await emailService.sendMail(emailMessage(offer.user, photo))
          await db.pointCampaignOffer.update({ where: { id: offer.id }, data: { emailStatus: 'SENT', emailSentAt: new Date() } })
          console.log(`Email отправлен: пользователь #${offer.userId}`)
          consecutiveEmailFailures = 0
          await new Promise(resolve => setTimeout(resolve, 500))
        } catch (error) {
          await db.pointCampaignOffer.update({ where: { id: offer.id }, data: { emailStatus: 'FAILED', emailError: String(error.message || error).slice(0, 500) } })
          console.error(`Email не отправлен: пользователь #${offer.userId}: ${error.message || error}`)
          consecutiveEmailFailures += 1
        }
      }
    }
    if (states.includes(offer.telegramStatus) && consecutiveTelegramFailures < 5) {
      const locked = await db.pointCampaignOffer.updateMany({
        where: { id: offer.id, telegramStatus: { in: states } }, data: { telegramStatus: 'SENDING', telegramError: null }
      })
      if (locked.count) {
        try {
          if (!hasTelegramCampaignId(offer.user)) throw new Error('Telegram ID больше недействителен')
          await sendPointsCampaignTelegram(offer.user.telegramId)
          await db.pointCampaignOffer.update({ where: { id: offer.id }, data: { telegramStatus: 'SENT', telegramSentAt: new Date() } })
          console.log(`Telegram отправлен: пользователь #${offer.userId}`)
          consecutiveTelegramFailures = 0
          await new Promise(resolve => setTimeout(resolve, 250))
        } catch (error) {
          const recipientUnavailable = [400, 403].includes(Number(error.relayStatus)) &&
            /bot was blocked|chat not found|user is deactivated|bot can't initiate/i.test(error.relayError || '')
          await db.pointCampaignOffer.update({
            where: { id: offer.id },
            data: { telegramStatus: recipientUnavailable ? 'SKIPPED' : 'FAILED', telegramError: String(error.message || error).slice(0, 500) }
          })
          console.error(`Telegram не отправлен: пользователь #${offer.userId}: ${error.message || error}`)
          if (!recipientUnavailable) consecutiveTelegramFailures += 1
        }
      }
    }
  }
  if (consecutiveEmailFailures >= 5) console.warn('Email остановлен после 5 ошибок подряд; оставшиеся адреса сохранены в PENDING.')
  if (consecutiveTelegramFailures >= 5) console.warn('Telegram остановлен после 5 ошибок подряд; оставшиеся ID сохранены в PENDING.')
  await status()
}

try {
  if (mode === '--preview') {
    const preview = await getPreview()
    console.log(JSON.stringify({
      campaignKey: POINTS_CAMPAIGN_KEY,
      eligibleAccounts: preview.eligibleAccounts,
      emailWithVerifiedAddressRegardlessOfConsent: preview.emailCandidates,
      emailWithoutConsentOrUnsubscribedIncluded: preview.emailSkippedNoConsent,
      telegramIds: preview.telegramCandidates,
      pointsIfEveryoneClaims: preview.plannedPointsAt4000Each,
      note: 'Только подсчёт; ничего не создано и не отправлено'
    }, null, 2))
  } else if (mode === '--prepare') await prepare()
  else if (mode === '--send') await send()
  else await status()
} catch (error) {
  console.error(error.message || error)
  process.exitCode = 1
} finally {
  await db.$disconnect()
}
