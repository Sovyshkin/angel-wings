import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { enqueueOrderTelegramNotification } from '../src/services/telegramQueue.js'

const prisma = new PrismaClient()
const orderId = Number(process.argv[2])
const force = process.argv.includes('--force')

try {
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new Error('Использование: npm run telegram:enqueue -- <orderId> [--force]')
  }

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } })
  if (!order) throw new Error(`Заказ #${orderId} не найден`)

  const existing = await prisma.telegramNotification.findUnique({ where: { orderId } })
  if (existing?.status === 'SENT' && !force) {
    throw new Error(`Уведомление заказа #${orderId} уже отправлено. Для повторной отправки добавьте --force`)
  }

  let job
  if (existing) {
    job = await prisma.telegramNotification.update({
      where: { id: existing.id },
      data: {
        status: 'PENDING', attempts: 0, nextAttemptAt: new Date(), processingAt: null,
        sentAt: null, telegramMessageId: null, lastError: null
      }
    })
  } else {
    job = await enqueueOrderTelegramNotification(orderId, prisma)
  }

  console.log('[TELEGRAM_QUEUE] order enqueued', JSON.stringify({ orderId, jobId: job.id, status: job.status }))
} finally {
  await prisma.$disconnect()
}
