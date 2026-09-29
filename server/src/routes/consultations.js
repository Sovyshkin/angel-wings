import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import tochkaService from '../services/tochka.js'
import { normalizeEmail } from '../utils/userEmail.js'
import { authenticate } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

const CONSULTATION_PRICE = 4000
const SPECIALISTS = new Set(['OLESYA_TERENKO', 'MARINA_SHESTAKOVA'])
const CONTACT_FORMATS = new Set(['MESSAGES', 'CALL'])

function cleanText(value, maxLength) {
  const text = String(value || '').trim()
  return text ? text.slice(0, maxLength) : null
}

function normalizePaymentStatus(status) {
  const raw = String(status || '').trim().toUpperCase()
  if (['PAID', 'APPROVED', 'SUCCESS', 'SUCCEEDED', 'COMPLETED', 'AUTHORIZED', 'CAPTURED', 'EXECUTED', 'SETTLED'].some(code => raw.includes(code))) return 'PAID'
  if (['CANCEL', 'FAILED', 'ERROR', 'EXPIRED', 'REFUND', 'REJECT', 'DECLIN'].some(code => raw.includes(code))) return 'FAILED'
  return 'PENDING'
}

function getRedirectUrls(consultationId) {
  const baseUrl = process.env.TOCHKA_REDIRECT_BASE_URL || process.env.CLIENT_URL || ''
  if (!baseUrl || !baseUrl.startsWith('https://')) {
    const error = new Error('Для оплаты требуется HTTPS URL в TOCHKA_REDIRECT_BASE_URL или CLIENT_URL')
    error.status = 400
    throw error
  }

  const base = baseUrl.replace(/\/$/, '')
  return {
    redirectUrl: `${base}/consultation-success?consultationId=${consultationId}`,
    failRedirectUrl: `${base}/consultation-failed?consultationId=${consultationId}`
  }
}

function buildReceiptRequest(consultation) {
  return {
    id: `consultation-${consultation.id}`,
    total: CONSULTATION_PRICE,
    customerName: consultation.customerName,
    customerEmail: consultation.customerEmail,
    customerPhone: consultation.customerPhone,
    items: [{
      id: `consultation-${consultation.id}`,
      productId: `consultation-${consultation.id}`,
      quantity: 1,
      price: CONSULTATION_PRICE,
      product: { title: 'Экспресс-консультация специалиста по пептидам' }
    }]
  }
}

function extractUuidFromPaymentUrl(paymentUrl) {
  try {
    return new URL(String(paymentUrl)).searchParams.get('uuid') || null
  } catch {
    return null
  }
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
      data: { userId: req.user.id, customerName, customerEmail, customerPhone, specialist, contactFormat, question, amount: CONSULTATION_PRICE }
    })

    const { redirectUrl, failRedirectUrl } = getRedirectUrls(consultation.id)
    const payment = await tochkaService.createPayment(
      CONSULTATION_PRICE,
      consultation.id,
      'Экспресс-консультация специалиста Angel Wings',
      redirectUrl,
      failRedirectUrl,
      buildReceiptRequest(consultation),
      'CONSULTATION'
    )

    if (!payment.success || !payment.paymentUrl) {
      await prisma.consultationRequest.update({
        where: { id: consultation.id },
        data: { paymentStatus: 'FAILED' }
      })
      return res.status(502).json({ error: payment.error || 'Не удалось создать ссылку на оплату' })
    }

    const paymentId = payment.paymentId || extractUuidFromPaymentUrl(payment.paymentUrl)
    await prisma.consultationRequest.update({
      where: { id: consultation.id },
      data: { paymentId: paymentId ? String(paymentId) : null, paymentStatus: 'PENDING' }
    })

    res.status(201).json({
      consultationId: consultation.id,
      paymentUrl: payment.paymentUrl,
      paymentId: paymentId || null,
      amount: CONSULTATION_PRICE
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id/status', async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'Некорректный номер заявки' })

    let consultation = await prisma.consultationRequest.findUnique({ where: { id } })
    if (!consultation) return res.status(404).json({ error: 'Заявка не найдена' })

    if (consultation.paymentId && consultation.paymentStatus !== 'PAID') {
      const result = await tochkaService.getPaymentStatus(consultation.paymentId)
      if (result?.success) {
        const paymentStatus = normalizePaymentStatus(result.status)
        if (paymentStatus !== consultation.paymentStatus) {
          consultation = await prisma.consultationRequest.update({
            where: { id },
            data: {
              paymentStatus,
              ...(paymentStatus === 'PAID' && consultation.status === 'PENDING_PAYMENT' ? { status: 'NEW' } : {})
            }
          })
        }
      }
    }

    res.json({ id: consultation.id, paymentStatus: consultation.paymentStatus, status: consultation.status })
  } catch (error) {
    next(error)
  }
})

export function normalizeConsultationPaymentStatus(status) {
  return normalizePaymentStatus(status)
}

export default router
