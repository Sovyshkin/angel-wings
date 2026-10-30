import dotenv from 'dotenv'
import { recoveryPrisma, startRecoveryWorker } from './services/recovery.js'
import { expireDuePointsCampaignOffers } from './services/pointsCampaign.js'

dotenv.config()

startRecoveryWorker({ force: true })
console.log('[RECOVERY] dedicated worker started')

async function expireCampaignPoints() {
  try {
    const count = await expireDuePointsCampaignOffers(recoveryPrisma)
    if (count) console.log('[POINTS_CAMPAIGN] expired offers', count)
  } catch (error) {
    console.error('[POINTS_CAMPAIGN] expiration failed', error)
  }
}

expireCampaignPoints()
const campaignExpirationTimer = setInterval(expireCampaignPoints, 60 * 60 * 1000)

async function shutdown(signal) {
  console.log(`[RECOVERY] ${signal}, stopping worker`)
  clearInterval(campaignExpirationTimer)
  await recoveryPrisma.$disconnect()
  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
