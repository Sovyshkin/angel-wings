import { PrismaClient } from '@prisma/client'
import { notifyOrderToTelegram } from './telegram.js'

const prisma = new PrismaClient()
const DEFAULT_RETRY_DELAYS_SECONDS = [30, 120, 300, 900, 1800, 3600, 7200, 14400, 28800, 43200, 86400]

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function retryDelaysSeconds() {
  const configured = String(process.env.TELEGRAM_QUEUE_RETRY_DELAYS_SECONDS || '')
    .split(',')
    .map(value => Number.parseInt(value.trim(), 10))
    .filter(value => Number.isFinite(value) && value > 0)
  return configured.length ? configured : DEFAULT_RETRY_DELAYS_SECONDS
}

function nextAttemptDate(attempts) {
  const delays = retryDelaysSeconds()
  const index = Math.min(Math.max(0, attempts - 1), delays.length - 1)
  return new Date(Date.now() + delays[index] * 1000)
}

function errorText(error) {
  const responseData = error?.response?.data
  const responseSuffix = responseData
    ? ` | response=${typeof responseData === 'string' ? responseData : JSON.stringify(responseData)}`
    : ''
  return `${error?.message || String(error)}${responseSuffix}`.slice(0, 2000)
}

export async function enqueueOrderTelegramNotification(orderId, db = prisma) {
  const normalizedOrderId = Number(orderId)
  if (!Number.isInteger(normalizedOrderId) || normalizedOrderId <= 0) {
    throw new Error('Некорректный ID заказа для Telegram-очереди')
  }

  return db.telegramNotification.upsert({
    where: { orderId: normalizedOrderId },
    create: {
      orderId: normalizedOrderId,
      maxAttempts: positiveInt(process.env.TELEGRAM_QUEUE_MAX_ATTEMPTS, 12)
    },
    update: {}
  })
}

async function recoverStaleJobs(now) {
  const staleBefore = new Date(now.getTime() - positiveInt(process.env.TELEGRAM_QUEUE_STALE_MS, 5 * 60 * 1000))
  const result = await prisma.telegramNotification.updateMany({
    where: { status: 'SENDING', processingAt: { lt: staleBefore } },
    data: { status: 'PENDING', processingAt: null, nextAttemptAt: now }
  })
  if (result.count) {
    console.warn('[TELEGRAM_QUEUE] recovered stale jobs', JSON.stringify({ count: result.count }))
  }
}

async function sendJob(job) {
  const order = await prisma.order.findUnique({
    where: { id: job.orderId },
    include: {
      items: {
        include: {
          product: { select: { title: true, image: true } }
        }
      }
    }
  })

  if (!order) {
    throw new Error(`Заказ #${job.orderId} не найден`)
  }

  return notifyOrderToTelegram(order)
}

export async function runTelegramQueueSweep() {
  const now = new Date()
  await recoverStaleJobs(now)

  const jobs = await prisma.telegramNotification.findMany({
    where: { status: 'PENDING', nextAttemptAt: { lte: now } },
    orderBy: [{ nextAttemptAt: 'asc' }, { id: 'asc' }],
    take: positiveInt(process.env.TELEGRAM_QUEUE_BATCH_SIZE, 10)
  })

  let sent = 0
  let retried = 0
  let failed = 0

  for (const job of jobs) {
    const claimedAt = new Date()
    const claimed = await prisma.telegramNotification.updateMany({
      where: { id: job.id, status: 'PENDING', processingAt: null },
      data: { status: 'SENDING', processingAt: claimedAt, lastError: null }
    })
    if (!claimed.count) continue

    const attempts = job.attempts + 1
    try {
      console.log('[TELEGRAM_QUEUE] sending', JSON.stringify({ jobId: job.id, orderId: job.orderId, attempt: attempts, maxAttempts: job.maxAttempts }))
      const result = await sendJob(job)
      if (!result?.ok) {
        throw new Error(result?.skipped ? 'Отправка Telegram пропущена из-за отсутствующей конфигурации' : 'Telegram не подтвердил отправку')
      }
      await prisma.telegramNotification.update({
        where: { id: job.id },
        data: {
          status: 'SENT', attempts, processingAt: null, sentAt: new Date(),
          telegramMessageId: Number(result.messageId) || null, lastError: null
        }
      })
      sent += 1
      console.log('[TELEGRAM_QUEUE] sent', JSON.stringify({ jobId: job.id, orderId: job.orderId, attempts, messageId: result.messageId || null }))
    } catch (error) {
      const exhausted = attempts >= job.maxAttempts
      const nextAttemptAt = exhausted ? job.nextAttemptAt : nextAttemptDate(attempts)
      const lastError = errorText(error)
      await prisma.telegramNotification.update({
        where: { id: job.id },
        data: {
          status: exhausted ? 'FAILED' : 'PENDING', attempts, processingAt: null,
          nextAttemptAt, lastError
        }
      })
      if (exhausted) failed += 1
      else retried += 1
      console.error('[TELEGRAM_QUEUE] send failed', JSON.stringify({
        jobId: job.id, orderId: job.orderId, attempts, exhausted,
        nextAttemptAt: exhausted ? null : nextAttemptAt.toISOString(), error: lastError
      }))
    }
  }

  return { selected: jobs.length, sent, retried, failed }
}

let sweepTimer = null
let sweepRunning = false

export function startTelegramQueueWorker() {
  if (sweepTimer) return

  const run = async () => {
    if (sweepRunning) return
    sweepRunning = true
    try {
      await runTelegramQueueSweep()
    } catch (error) {
      console.error('[TELEGRAM_QUEUE] sweep failed', error)
    } finally {
      sweepRunning = false
    }
  }

  setTimeout(run, 1000)
  sweepTimer = setInterval(run, positiveInt(process.env.TELEGRAM_QUEUE_POLL_MS, 5000))
}

export { prisma as telegramQueuePrisma }
