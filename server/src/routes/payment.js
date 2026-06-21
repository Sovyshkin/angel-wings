import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import tochkaService from '../services/tochka.js'
import { authenticate } from '../middleware/auth.js'
import { syncPartnerCommissionForOrder } from '../utils/partnerCommission.js'

const router = Router()
const prisma = new PrismaClient()

function normalizePaymentStatus(status) {
  const raw = String(status || '').trim().toUpperCase()

  if (!raw) return 'PENDING'
  if (['PAID', 'APPROVED', 'SUCCESS', 'SUCCEEDED', 'COMPLETED', 'AUTHORIZED', 'CAPTURED', 'EXECUTED', 'SETTLED'].some(code => raw.includes(code))) {
    return 'PAID'
  }
  if (['CANCEL', 'FAILED', 'ERROR', 'EXPIRED', 'REFUND', 'REJECT', 'DECLIN'].some(code => raw.includes(code))) {
    return 'FAILED'
  }

  return 'PENDING'
}

function extractUuidFromPaymentUrl(paymentUrl) {
  if (!paymentUrl || typeof paymentUrl !== 'string') return null
  try {
    const parsed = new URL(paymentUrl)
    return parsed.searchParams.get('uuid') || null
  } catch {
    return null
  }
}

function pickFirstString(values = []) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return null
}

function extractWebhookFields(payload) {
  const root = payload || {}
  const data = root?.Data || root?.data || {}

  const paymentLinkId = pickFirstString([
    root?.paymentLinkId,
    root?.PaymentLinkId,
    data?.paymentLinkId,
    data?.PaymentLinkId
  ])

  const paymentId = pickFirstString([
    root?.paymentId,
    root?.PaymentId,
    root?.operationId,
    root?.OperationId,
    data?.paymentId,
    data?.PaymentId,
    data?.operationId,
    data?.OperationId
  ])

  const status = pickFirstString([
    root?.status,
    root?.Status,
    root?.paymentStatus,
    root?.PaymentStatus,
    data?.status,
    data?.Status,
    data?.paymentStatus,
    data?.PaymentStatus
  ])

  return { paymentLinkId, paymentId, status }
}

function getRedirectUrls(orderId) {
  const baseUrl = process.env.TOCHKA_REDIRECT_BASE_URL || process.env.CLIENT_URL || ''
  console.log('[PAYMENT] redirect baseUrl check', JSON.stringify({
    baseUrl,
    isHttps: baseUrl.startsWith('https://')
  }))

  if (!baseUrl || !baseUrl.startsWith('https://')) {
    const error = new Error('Для интеграции Точка требуется HTTPS URL для редиректов. Укажите TOCHKA_REDIRECT_BASE_URL=https://... в .env')
    error.status = 400
    throw error
  }

  return {
    redirectUrl: `${baseUrl}/order-success?orderId=${orderId}`,
    failRedirectUrl: `${baseUrl}/order-failed?orderId=${orderId}`
  }
}

async function createPaymentForOrder(order, description) {
  const amount = Math.max(0, Number(order.total || 0))

  if (amount <= 0) {
    return {
      success: true,
      alreadyPaid: true,
      paymentStatus: order.paymentStatus || 'PAID'
    }
  }

  const { redirectUrl, failRedirectUrl } = getRedirectUrls(order.id)
  const result = await tochkaService.createPayment(
    amount,
    order.id,
    description || `Оплата заказа #${order.id}`,
    redirectUrl,
    failRedirectUrl
  )

  if (!result.success || !result.paymentUrl) {
    return result
  }

  const resolvedPaymentId = result.paymentId || extractUuidFromPaymentUrl(result.paymentUrl)
  if (resolvedPaymentId) {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentId: String(resolvedPaymentId),
        paymentStatus: 'PENDING'
      }
    })
  }

  return {
    ...result,
    paymentId: resolvedPaymentId || null
  }
}

// Create payment link
router.post('/create', async (req, res, next) => {
  try {
    const { orderId, amount, description } = req.body
    console.log('[PAYMENT] /create request', JSON.stringify({
      orderId,
      amount,
      hasDescription: Boolean(description)
    }))

    if (!orderId || !amount) {
      console.warn('[PAYMENT] /create validation failed: missing orderId or amount')
      return res.status(400).json({ error: 'Не указан ID заказа или сумма' })
    }

    const { redirectUrl, failRedirectUrl } = getRedirectUrls(orderId)

    const result = await tochkaService.createPayment(
      amount,
      orderId,
      description || `Оплата заказа #${orderId}`,
      redirectUrl,
      failRedirectUrl
    )

    if (result.success && result.paymentUrl) {
      const resolvedPaymentId = result.paymentId || extractUuidFromPaymentUrl(result.paymentUrl)
      if (resolvedPaymentId && Number.isFinite(Number(orderId))) {
        await prisma.order.update({
          where: { id: parseInt(orderId, 10) },
          data: {
            paymentId: String(resolvedPaymentId),
            paymentStatus: 'PENDING'
          }
        })
      }

      console.log('[PAYMENT] /create success', JSON.stringify({
        orderId,
        paymentId: resolvedPaymentId || null
      }))
      res.json({ 
        success: true, 
        paymentUrl: result.paymentUrl,
        paymentId: resolvedPaymentId || null
      })
    } else {
      console.error('[PAYMENT] /create failed', JSON.stringify({
        orderId,
        error: result.error,
        debug: result.debug || null
      }))
      const response = { error: result.error || 'Ошибка создания платежа' }
      if (process.env.NODE_ENV !== 'production' && result.debug) {
        response.details = result.debug
      }
      res.status(500).json(response)
    }
  } catch (error) {
    next(error)
  }
})

router.post('/create-for-order/:orderId', authenticate, async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.orderId, 10)
    if (!Number.isFinite(orderId)) {
      return res.status(400).json({ error: 'Некорректный orderId' })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        userId: true,
        total: true,
        paymentStatus: true
      }
    })

    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' })
    }

    if (order.userId && order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Доступ запрещён' })
    }

    if (normalizePaymentStatus(order.paymentStatus) === 'PAID') {
      return res.json({
        success: true,
        alreadyPaid: true,
        paymentStatus: 'PAID'
      })
    }

    if (String(order.paymentStatus || '').toUpperCase() === 'CASH_ON_DELIVERY') {
      return res.status(400).json({ error: 'Этот заказ оплачивается наличными при получении' })
    }

    const result = await createPaymentForOrder(order, req.body?.description)

    if (result.success && result.paymentUrl) {
      return res.json({
        success: true,
        paymentUrl: result.paymentUrl,
        paymentId: result.paymentId || null
      })
    }

    if (result.alreadyPaid) {
      return res.json(result)
    }

    res.status(500).json({ error: result.error || 'Ошибка создания платежа' })
  } catch (error) {
    next(error)
  }
})

// Check payment status
router.get('/status/:paymentId', async (req, res, next) => {
  try {
    const { paymentId } = req.params
    const result = await tochkaService.getPaymentStatus(paymentId)
    
    if (result.success) {
      const paymentStatus = normalizePaymentStatus(result.status)
      const updateResult = await prisma.order.updateMany({
        where: { paymentId: String(paymentId) },
        data: { paymentStatus }
      })
      if (updateResult.count > 0) {
        const updatedOrders = await prisma.order.findMany({
          where: { paymentId: String(paymentId) },
          select: { id: true }
        })
        await Promise.all(updatedOrders.map(order => syncPartnerCommissionForOrder(prisma, order.id)))
      }
      res.json({ success: true, status: result.status, paymentStatus })
    } else {
      res.status(500).json({ error: result.error })
    }
  } catch (error) {
    next(error)
  }
})

router.post('/sync-order/:orderId', authenticate, async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.orderId, 10)
    if (!Number.isFinite(orderId)) {
      return res.status(400).json({ error: 'Некорректный orderId' })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, paymentId: true, paymentStatus: true }
    })

    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' })
    }

    if (order.userId && order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Доступ запрещён' })
    }

    if (!order.paymentId) {
      return res.json({
        success: true,
        paymentStatus: order.paymentStatus || 'PENDING',
        status: null
      })
    }

    const result = await tochkaService.getPaymentStatus(order.paymentId)
    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Ошибка проверки статуса' })
    }

    const paymentStatus = normalizePaymentStatus(result.status)
    console.log('[PAYMENT] /sync-order status resolved', JSON.stringify({
      orderId: order.id,
      paymentId: order.paymentId,
      rawStatus: result.status,
      paymentStatus
    }))
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus }
    })
    await syncPartnerCommissionForOrder(prisma, order.id)

    res.json({
      success: true,
      paymentStatus,
      status: result.status
    })
  } catch (error) {
    next(error)
  }
})

// Webhook for Tochka notifications
router.post('/webhook', async (req, res, next) => {
  try {
    const { paymentLinkId, paymentId, status } = extractWebhookFields(req.body)
    console.log('Tochka webhook received:', {
      paymentLinkId,
      paymentId,
      status,
      body: req.body
    })
    
    // Respond OK immediately
    res.status(200).send('OK')
    
    // Process asynchronously
    const normalized = normalizePaymentStatus(status)

    let updatedOrder = null
    const orderIdMatch = String(paymentLinkId || '').match(/order-(\d+)/i)
    if (orderIdMatch) {
      const orderId = parseInt(orderIdMatch[1], 10)
      if (Number.isFinite(orderId)) {
        updatedOrder = await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: normalized }
        })
      }
    }

    if (!updatedOrder && paymentId) {
      const found = await prisma.order.findFirst({
        where: { paymentId: String(paymentId) },
        select: { id: true }
      })
      if (found) {
        updatedOrder = await prisma.order.update({
          where: { id: found.id },
          data: { paymentStatus: normalized }
        })
      }
    }

    if (updatedOrder) {
      await syncPartnerCommissionForOrder(prisma, updatedOrder.id)
      console.log(`[PAYMENT] Webhook updated order ${updatedOrder.id} paymentStatus=${normalized}`)
    } else {
      console.warn('[PAYMENT] Webhook did not match any order', { paymentLinkId, paymentId, normalized })
    }
  } catch (error) {
    next(error)
  }
})

export default router
