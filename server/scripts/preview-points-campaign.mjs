import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { buildPointsCampaignPreview } from '../src/utils/pointsCampaignPreview.js'

const prisma = new PrismaClient()
const now = new Date()
const since = new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000)

try {
  const [users, orders] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        role: true,
        email: true,
        emailVerified: true,
        marketingConsentAt: true,
        marketingUnsubscribedAt: true,
        telegramId: true
      }
    }),
    prisma.order.findMany({
      where: {
        createdAt: { gte: since, lte: now },
        paymentStatus: 'PAID',
        status: { notIn: ['CANCELLED', 'RETURNED'] }
      },
      select: {
        id: true,
        userId: true,
        customerEmail: true,
        createdAt: true,
        paymentStatus: true,
        status: true
      }
    })
  ])

  const result = buildPointsCampaignPreview(users, orders, now)
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(result, null, 2))
  } else {
    console.log(`Период: ${result.periodStart} — ${result.periodEnd}`)
    console.log('Условие: не более 1 оплаченного заказа за 45 дней; отменённые и возвращённые заказы исключены.')
    console.log('Заказы без userId учитываются по email клиента. Дата покупки — дата создания заказа (отдельной даты оплаты в БД нет).')
    console.log(`Проверено аккаунтов: ${result.accountsChecked}`)
    console.log(`Подходят: ${result.eligibleAccounts} (0 покупок: ${result.eligibleWithZeroPurchases}; 1 покупка: ${result.eligibleWithOnePurchase})`)
    console.log(`Потенциальное начисление: ${result.plannedPointsAt4000Each.toLocaleString('ru-RU')} баллов по 4 000 каждому`)
    console.log(`Не подходят: сотрудники/удалённые — ${result.excludedStaffOrDeleted}; 2+ покупки — ${result.excludedWithTwoOrMorePurchases}`)
    console.log(`На сайте после начисления: ${result.siteNotificationCandidates} потенциальных уведомлений`)
    console.log(`Email: ${result.emailCandidates} адресов (подтверждённый email + согласие на рассылку)`)
    console.log(`Telegram: ${result.telegramCandidates} ID без отписки (из них с согласием на рассылку: ${result.telegramWithMarketingConsent})`)
    console.log(`Оба внешних канала: ${result.emailAndTelegramCandidates}; только email: ${result.emailOnlyCandidates}; только Telegram: ${result.telegramOnlyCandidates}; ни одного: ${result.noOutboundChannelCandidates}`)
    console.log(`Email пропущен: нет подтверждённого реального адреса — ${result.emailSkippedInvalidOrUnverified}; нет согласия/есть отписка — ${result.emailSkippedNoConsent}`)
    console.log(`Telegram пропущен: нет ID — ${result.telegramSkippedNoId}; есть отписка — ${result.telegramSkippedUnsubscribed}`)
    console.log('Это только предварительный подсчёт. Скрипт ничего не начисляет и не отправляет. Telegram ID не гарантирует, что бот сможет доставить сообщение.')
  }
} catch (error) {
  console.error(`Не удалось посчитать аудиторию: ${error.message || error}`)
  process.exitCode = 1
} finally {
  await prisma.$disconnect()
}
