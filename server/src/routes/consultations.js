import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { normalizeEmail } from '../utils/userEmail.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

const CONSULTATION_AMOUNT = 4000
const SPECIALISTS = new Set(['OLESYA_TERENKO', 'MARINA_SHESTAKOVA'])
const CONTACT_FORMATS = new Set(['MESSAGES', 'CALL'])

function cleanText(value, maxLength) {
  const text = String(value || '').trim()
  return text ? text.slice(0, maxLength) : null
}

router.post('/', authenticate, async (req, res, next) => {
  try {
    const customerName = cleanText(req.body?.name, 120)
    const customerEmail = normalizeEmail(req.user?.email || req.body?.email)
    const customerPhone = cleanText(req.body?.phone, 60)
    const specialist = String(req.body?.specialist || '').trim().toUpperCase()
    const contactFormat = String(req.body?.contactFormat || '').trim().toUpperCase()
    const question = cleanText(req.body?.question, 2000)
    const consent = req.body?.consent === true

    if (!customerName) return res.status(400).json({ error: 'Укажите имя' })
    if (!customerEmail || !customerEmail.includes('@')) return res.status(400).json({ error: 'Укажите корректный email' })
    if (!customerPhone) return res.status(400).json({ error: 'Укажите телефон или Telegram для связи' })
    if (!SPECIALISTS.has(specialist)) return res.status(400).json({ error: 'Выберите специалиста' })
    if (!CONTACT_FORMATS.has(contactFormat)) return res.status(400).json({ error: 'Выберите формат консультации' })
    if (!question) return res.status(400).json({ error: 'Опишите ваш вопрос' })
    if (!consent) return res.status(400).json({ error: 'Необходимо согласие на обработку персональных данных' })

    const consultation = await prisma.consultationRequest.create({
      data: {
        userId: req.user.id,
        customerName,
        customerEmail,
        customerPhone,
        specialist,
        contactFormat,
        question,
        amount: CONSULTATION_AMOUNT,
        paymentStatus: 'EXTERNAL',
        status: 'NEW'
      }
    })

    res.status(201).json({
      consultationId: consultation.id,
      amount: CONSULTATION_AMOUNT,
      status: consultation.status
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id/status', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Некорректный номер заявки' })

    const consultation = await prisma.consultationRequest.findUnique({ where: { id } })
    if (!consultation) return res.status(404).json({ error: 'Заявка не найдена' })

    res.json({ id: consultation.id, paymentStatus: consultation.paymentStatus, status: consultation.status })
  } catch (error) {
    next(error)
  }
})

export default router
