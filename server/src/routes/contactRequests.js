import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { normalizeEmail } from '../utils/userEmail.js'

const router = Router()
const prisma = new PrismaClient()

function cleanText(value, maxLength = 500) {
  const text = String(value || '').trim()
  return text ? text.slice(0, maxLength) : null
}

router.post('/', async (req, res, next) => {
  try {
    const name = cleanText(req.body?.name, 120)
    const email = normalizeEmail(req.body?.email)
    const phone = cleanText(req.body?.phone, 60)
    const goal = cleanText(req.body?.goal, 80)
    const message = cleanText(req.body?.message, 1600)

    if (!name) {
      return res.status(400).json({ error: 'Укажите имя' })
    }

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Укажите корректный email' })
    }

    if (!message) {
      return res.status(400).json({ error: 'Напишите сообщение' })
    }

    const request = await prisma.contactRequest.create({
      data: {
        name,
        email,
        phone,
        goal,
        message
      },
      select: {
        id: true,
        status: true,
        createdAt: true
      }
    })

    res.status(201).json({ request })
  } catch (error) {
    next(error)
  }
})

export default router
