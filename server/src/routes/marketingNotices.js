import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.get('/unseen', authenticate, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { marketingConsentAt: true, marketingUnsubscribedAt: true } })
    if (!user?.marketingConsentAt || user.marketingUnsubscribedAt) return res.set('Cache-Control', 'no-store').json({ notice: null })
    const notice = await prisma.marketingNotice.findFirst({
      where: { userId: req.user.id, siteEnabled: true, seenAt: null },
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, body: true, buttonText: true, buttonUrl: true, imageUrl: true }
    })
    res.set('Cache-Control', 'no-store').json({ notice })
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
