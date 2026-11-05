import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'
import { claimPointsCampaignOffer, POINTS_CAMPAIGN_KEY } from '../services/pointsCampaign.js'
import { renderCampaignText } from '../services/customPointsCampaign.js'

const router = Router()
const prisma = new PrismaClient()

router.get('/offer', authenticate, async (req, res, next) => {
  try {
    const requestedKey = String(req.query.claim || '').trim()
    const offers = await prisma.pointCampaignOffer.findMany({ where: { userId: req.user.id, ...(requestedKey ? { campaignKey: requestedKey } : { claimedAt: null }) }, orderBy: { createdAt: 'desc' }, select: { amount: true, claimedAt: true, campaignKey: true } })
    const dynamicKeys = offers.map(item => item.campaignKey).filter(key => key !== POINTS_CAMPAIGN_KEY)
    const campaigns = dynamicKeys.length ? await prisma.pointsCampaign.findMany({ where: { key: { in: dynamicKeys } } }) : []
    const byKey = new Map(campaigns.map(campaign => [campaign.key, { ...JSON.parse(campaign.settingsJson), status: campaign.status }]))
    const now = new Date()
    const offer = offers.find(item => {
      if (item.claimedAt) return false
      if (item.campaignKey === POINTS_CAMPAIGN_KEY) return true
      const settings = byKey.get(item.campaignKey)
      return settings && ['SENDING', 'PAUSED', 'FINISHED'].includes(settings.status) && (!settings.claimUntil || new Date(settings.claimUntil) > now) && (requestedKey || settings.siteEnabled)
    })
    const settings = offer ? byKey.get(offer.campaignKey) : null
    const values = { name: req.user.name || 'клиент', points: Number(offer?.amount || 4000).toLocaleString('ru-RU'), claim_url: offer ? `https://angel-wings.ru/?claim=${encodeURIComponent(offer.campaignKey)}` : '' }
    res.set('Cache-Control', 'no-store').json({
      offer: offer ? { campaignKey: offer.campaignKey, amount: offer.amount, title: settings ? renderCampaignText(settings.claimTitle, values) : 'Ваши баллы ждут вас', body: settings ? renderCampaignText(settings.claimBody, values) : 'Получите 4 000 баллов для следующего заказа. Они появятся на балансе только после нажатия кнопки.', buttonText: settings?.buttonText || 'Получить {{points}} баллов', imageUrl: settings?.imageUrl ? `https://angel-wings.ru${settings.imageUrl}` : null, validityDays: settings?.validityDays || null } : null,
      claimed: Boolean(requestedKey && offers.some(item => item.claimedAt))
    })
  } catch (error) {
    next(error)
  }
})

router.post('/claim', authenticate, async (req, res, next) => {
  try {
    const key = String(req.body?.campaignKey || POINTS_CAMPAIGN_KEY).trim()
    const result = await claimPointsCampaignOffer(prisma, req.user.id, new Date(), key)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

export default router
