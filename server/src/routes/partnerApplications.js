import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { findUserByEmail, normalizeEmail } from '../utils/userEmail.js'

const router = Router()
const prisma = new PrismaClient()

function cleanText(value, maxLength = 500) {
  const text = String(value || '').trim()
  return text ? text.slice(0, maxLength) : null
}

router.post('/', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email)
    const name = cleanText(req.body.name, 120)
    const phone = cleanText(req.body.phone, 60)
    const telegram = cleanText(req.body.telegram, 80)
    const city = cleanText(req.body.city, 120)
    const audience = cleanText(req.body.audience, 700)
    const experience = cleanText(req.body.experience, 700)
    const message = cleanText(req.body.message, 1200)

    if (!name) {
      return res.status(400).json({ error: 'Укажите имя' })
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Укажите корректный email' })
    }

    if (!phone && !telegram) {
      return res.status(400).json({ error: 'Укажите телефон или Telegram для связи' })
    }

    const existingPending = await prisma.partnerApplication.findFirst({
      where: { email, status: 'PENDING' },
      select: { id: true }
    })

    if (existingPending) {
      return res.status(409).json({ error: 'Заявка с этим email уже на рассмотрении' })
    }

    const existingUser = await findUserByEmail(prisma, email)
    const application = await prisma.partnerApplication.create({
      data: {
        name,
        email,
        phone,
        telegram,
        city,
        audience,
        experience,
        message,
        userId: existingUser?.role === 'DELETED' ? null : existingUser?.id || null
      },
      select: {
        id: true,
        status: true,
        createdAt: true
      }
    })

    res.status(201).json({ application })
  } catch (error) {
    next(error)
  }
})

export default router
