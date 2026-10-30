import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'
import { claimPointsCampaignOffer, POINTS_CAMPAIGN_KEY } from '../services/pointsCampaign.js'

const router = Router()
const prisma = new PrismaClient()

router.get('/offer', authenticate, async (req, res, next) => {
  try {
    const offer = await prisma.pointCampaignOffer.findUnique({
      where: { campaignKey_userId: { campaignKey: POINTS_CAMPAIGN_KEY, userId: req.user.id } },
      select: { amount: true, claimedAt: true }
    })
    res.json({ offer: offer && !offer.claimedAt ? { amount: offer.amount } : null })
  } catch (error) {
    next(error)
  }
})

router.post('/claim', authenticate, async (req, res, next) => {
  try {
    const result = await claimPointsCampaignOffer(prisma, req.user.id)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

export default router
