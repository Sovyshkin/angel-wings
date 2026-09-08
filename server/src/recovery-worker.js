import dotenv from 'dotenv'
import { recoveryPrisma, startRecoveryWorker } from './services/recovery.js'

dotenv.config()

startRecoveryWorker({ force: true })
console.log('[RECOVERY] dedicated worker started')

async function shutdown(signal) {
  console.log(`[RECOVERY] ${signal}, stopping worker`)
  await recoveryPrisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
