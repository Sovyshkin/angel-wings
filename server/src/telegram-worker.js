import 'dotenv/config'
import { startTelegramQueueWorker, telegramQueuePrisma } from './services/telegramQueue.js'

startTelegramQueueWorker()
console.log('[TELEGRAM_QUEUE] dedicated worker started')

async function shutdown(signal) {
  console.log(`[TELEGRAM_QUEUE] ${signal}, stopping worker`)
  await telegramQueuePrisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
