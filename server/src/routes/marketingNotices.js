import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'
import { campaignClickUrl, validCampaignClickToken } from '../utils/campaignTracking.js'

const router = Router()
const prisma = new PrismaClient()

router.get('/click/:token', async (req, res, next) => {
  try {
    const id = validCampaignClickToken(req.params.token)
    if (!id) return res.status(404).send('Ссылка недействительна')
    const notice = await prisma.marketingNotice.findUnique({ where: { id }, select: { buttonUrl: true } })
    if (!notice) return res.status(404).send('Ссылка недействительна')
    const destination = new URL(notice.buttonUrl)
    if (destination.origin !== 'https://angel-wings.ru') return res.status(400).send('Ссылка недействительна')
    await prisma.marketingNotice.updateMany({ where: { id, clickedAt: null }, data: { clickedAt: new Date() } })
    await prisma.marketingNotice.update({ where: { id }, data: { clickCount: { increment: 1 } } })
    res.set('Cache-Control', 'no-store').redirect(302, destination.href)
  } catch (error) { next(error) }
})

router.get('/unseen', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { marketingUnsubscribedAt: true } })
    if (!user || user.marketingUnsubscribedAt) return res.set('Cache-Control', 'no-store').json({ notice: null })
    const notice = await prisma.marketingNotice.findFirst({
      where: { userId: req.user.id, siteEnabled: true, seenAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, body: true, buttonText: true, buttonUrl: true, imageUrl: true }
    })
    res.set('Cache-Control', 'no-store').json({ notice: notice ? { ...notice, buttonUrl: campaignClickUrl(notice.id) } : null })
  } catch (error) { next(error) }
})

router.post('/:id/seen', authenticate, async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Некорректное сообщение' })
    const result = await prisma.marketingNotice.updateMany({ where: { id, userId: req.user.id, siteEnabled: true, seenAt: null }, data: { seenAt: new Date() } })
    res.json({ seen: result.count > 0 })
  } catch (error) { next(error) }
})

export default router
