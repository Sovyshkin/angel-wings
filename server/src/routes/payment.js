import { Router } from 'express'
import { randomUUID } from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import tochkaService from '../services/tochka.js'
import { authenticate } from '../middleware/auth.js'
import { syncPartnerCommissionForOrder } from '../utils/partnerCommission.js'
import { CLOUD_KASSIR_ORDER_INCLUDE } from '../utils/cloudKassirReceipt.js'
import { queueCdekWaybillAfterPayment } from '../services/cdekWaybill.js'
import { grantConsultationRewardsForPaidOrder } from '../utils/consultationReward.js'

const router = Router()
const prisma = new PrismaClient()
const paymentCreationLocks = new Map()

async function withPaymentCreationLock(orderId, operation) {
  const previous = paymentCreationLocks.get(orderId) || Promise.resolve()
  let release
  const current = new Promise(resolve => { release = resolve })
  paymentCreationLocks.set(orderId, current)
  await previous
  const token = randomUUID()
  let acquired = false
  try {
    const deadline = Date.now() + 15000
    while (Date.now() < deadline) {
      const staleBefore = new Date(Date.now() - 120000)
      const lock = await prisma.order.updateMany({
        where: {
          id: orderId,
          OR: [
            { paymentCreationToken: null },
            { paymentCreationStartedAt: null },
            { paymentCreationStartedAt: { lt: staleBefore } }
          ]
        },
        data: { paymentCreationToken: token, paymentCreationStartedAt: new Date() }
      })
      if (lock.count) {
        acquired = true
        break
      }
      await new Promise(resolve => setTimeout(resolve, 250))
    }
    if (!acquired) return { success: false, httpStatus: 409, error: 'Ссылка на оплату создаётся. Повторите попытку через несколько секунд.' }
    return await operation()
  } finally {
    try {
      if (acquired) {
        await prisma.order.updateMany({
          where: { id: orderId, paymentCreationToken: token },
          data: { paymentCreationToken: null, paymentCreationStartedAt: null }
        })
      }
    } finally {
      release()
      if (paymentCreationLocks.get(orderId) === current) paymentCreationLocks.delete(orderId)
    }
  }
}

function amountInKopecks(value) {
  const amount = Number(value)
  return Number.isFinite(amount) ? Math.round(amount * 100) : NaN
}

const PAYMENT_SYNC_ORDER_SELECT = {
  id: true,
  userId: true,
  paymentId: true,
  paymentStatus: true,
  total: true,
  discountAmount: true,
  partnerBonusAmount: true,
  userPointsUsed: true,
  deliveryPrice: true,
  deliveryTariffName: true,
  deliveryPickupPoint: true,
  cdekOrderUuid: true,
  promoCodeId: true,
  items: {
    include: {
      product: {
        select: {
          id: true,
          title: true,
          sku: true,
          categories: {
            select: {
              name: true,
              slug: true
            }
          }
        }
      }
    }
  }
}

async function attachPromoCode(order) {
  if (!order?.promoCodeId) return { ...order, promoCode: null }

  const promoCode = await prisma.promoCode.findUnique({
    where: { id: order.promoCodeId },
    select: { code: true }
  })

  return {
    ...order,
    promoCode: promoCode ? { code: promoCode.code } : null
  }
}

function normalizePaymentStatus(status) {
  const raw = String(status || '').trim().toUpperCase()

  if (!raw) return 'PENDING'
  if (['UNPAID', 'NOT_PAID', 'NOT PAID'].includes(raw)) return 'PENDING'
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

export function getRedirectUrls(orderId, miniApp = false) {
  const baseUrl = String(
    miniApp
      ? process.env.TELEGRAM_MINI_APP_URL || ''
      : process.env.TOCHKA_REDIRECT_BASE_URL || process.env.CLIENT_URL || ''
  ).replace(/\/+$/, '')
  console.log('[PAYMENT] redirect baseUrl check', JSON.stringify({
    baseUrl,
    isHttps: baseUrl.startsWith('https://')
  }))

  if (!baseUrl || !/^https:\/\/[^/?#]+$/.test(baseUrl)) {
    const error = new Error(miniApp
      ? 'Для оплаты в Telegram укажите TELEGRAM_MINI_APP_URL=https://app.angel-wings.ru в .env'
      : 'Для интеграции Точка требуется HTTPS URL для редиректов. Укажите TOCHKA_REDIRECT_BASE_URL=https://... в .env')
    error.status = 400
    throw error
  }

  return {
    redirectUrl: `${baseUrl}/order-success?orderId=${orderId}`,
    failRedirectUrl: `${baseUrl}/order-failed?orderId=${orderId}`
  }
}

async function createPaymentForOrder(orderId, amount, description, miniApp = false) {
  return withPaymentCreationLock(orderId, async () => {
    // Re-read under the lock: two clicks must not both create a bank invoice.
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: CLOUD_KASSIR_ORDER_INCLUDE
    })
    if (!order) return { success: false, error: 'Заказ не найден' }

    const requestedKopecks = amountInKopecks(amount)
    if (!Number.isSafeInteger(requestedKopecks) || requestedKopecks <= 0) {
      return { success: false, error: 'Некорректная сумма платежа' }
    }
    if (normalizePaymentStatus(order.paymentStatus) === 'PAID') {
      return { success: true, alreadyPaid: true, paymentStatus: 'PAID' }
    }
    if (String(order.paymentStatus || '').toUpperCase() === 'CASH_ON_DELIVERY') {
      return { success: false, error: 'Этот заказ оплачивается при получении' }
    }
    const expectedKopecks = amountInKopecks(order.paymentAmount ?? order.total)
    if (requestedKopecks !== expectedKopecks) {
      return { success: false, error: 'Сумма платежа не совпадает с неоплаченной суммой заказа' }
    }

    const sameAmount = amountInKopecks(order.paymentAmount) === requestedKopecks
    if (sameAmount && order.paymentUrl && !order.paymentId) {
      return { success: true, reused: true, paymentUrl: order.paymentUrl, paymentId: null }
    }
    if (order.paymentId && (sameAmount || order.paymentAmount == null)) {
      const statusResult = await tochkaService.getPaymentStatus(order.paymentId)
      if (statusResult.success) {
        const status = normalizePaymentStatus(statusResult.status)
        if (status === 'PAID') {
          const updated = await prisma.order.update({
            where: { id: orderId },
            data: { paymentStatus: 'PAID' }
          })
          await syncPartnerCommissionForOrder(prisma, orderId)
          queueCdekWaybillAfterPayment(updated, order.paymentStatus)
          await grantConsultationRewardsForPaidOrder(prisma, updated)
          return { success: true, alreadyPaid: true, paymentStatus: 'PAID' }
        }
        const bankAmountMatches = statusResult.amount == null || amountInKopecks(statusResult.amount) === requestedKopecks
        const reusableUrl = order.paymentUrl || statusResult.paymentUrl
        if (status === 'PENDING' && bankAmountMatches && reusableUrl) {
          if (!order.paymentUrl) {
            await prisma.order.update({
              where: { id: orderId },
              data: { paymentUrl: reusableUrl, paymentAmount: requestedKopecks / 100 }
            })
          }
          return { success: true, reused: true, paymentUrl: reusableUrl, paymentId: order.paymentId }
        }
      } else if (order.paymentUrl && sameAmount) {
        // A temporary status API failure is not a reason to mint a duplicate invoice.
        return { success: true, reused: true, paymentUrl: order.paymentUrl, paymentId: order.paymentId }
      }
    }

    const { redirectUrl, failRedirectUrl } = getRedirectUrls(orderId, miniApp)
    const result = await tochkaService.createPayment(
      requestedKopecks / 100,
      orderId,
      description || `Оплата заказа #${orderId}`,
      redirectUrl,
      failRedirectUrl,
      order
    )
    if (!result.success || !result.paymentUrl) return result

    const paymentId = result.paymentId || extractUuidFromPaymentUrl(result.paymentUrl)
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentId: paymentId ? String(paymentId) : null,
        paymentUrl: result.paymentUrl,
        paymentAmount: requestedKopecks / 100,
        paymentLinkId: result.paymentLinkId || null,
        paymentStatus: 'PENDING'
      }
    })
    return { success: true, paymentUrl: result.paymentUrl, paymentId: paymentId ? String(paymentId) : null, reused: false }
  })
}

// Create payment link
router.post('/create', authenticate, async (req, res, next) => {
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

    const parsedOrderId = parseInt(orderId, 10)
    if (!Number.isFinite(parsedOrderId)) {
      return res.status(400).json({ error: 'Некорректный ID заказа' })
    }

    const order = await prisma.order.findUnique({
      where: { id: parsedOrderId },
      include: CLOUD_KASSIR_ORDER_INCLUDE
    })
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' })
    }
    if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Доступ запрещён' })
    }

    const result = await createPaymentForOrder(parsedOrderId, amount, description, req.body?.miniApp === true)

    if (result.success && result.paymentUrl) {
      console.log('[PAYMENT] /create success', JSON.stringify({
        orderId,
        paymentId: result.paymentId,
        reused: result.reused
      }))
      res.json(result)
    } else if (result.alreadyPaid) {
      res.json(result)
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
      res.status(result.httpStatus || 500).json(response)
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
      include: CLOUD_KASSIR_ORDER_INCLUDE
    })

    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' })
    }

    if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
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
    if (Number(order.total) <= 0) {
      return res.json({ success: true, alreadyPaid: true, paymentStatus: 'PAID' })
    }

    const result = await createPaymentForOrder(orderId, order.paymentAmount ?? order.total, req.body?.description, req.body?.miniApp === true)

    if (result.success && result.paymentUrl) {
      return res.json({
        success: true,
        paymentUrl: result.paymentUrl,
        paymentId: result.paymentId || null,
        reused: result.reused
      })
    }

    if (result.alreadyPaid) {
      return res.json(result)
    }

    res.status(result.httpStatus || 500).json({ error: result.error || 'Ошибка создания платежа' })
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
      const matchedOrders = await prisma.order.findMany({
        where: { paymentId: String(paymentId) },
        select: { id: true, userId: true, paymentStatus: true, cdekOrderUuid: true }
      })
      const updateResult = await prisma.order.updateMany({
        where: {
          paymentId: String(paymentId),
          ...(paymentStatus !== 'PAID' ? { paymentStatus: { not: 'PAID' } } : {})
        },
        data: { paymentStatus }
      })
      if (updateResult.count > 0) {
        await Promise.all(matchedOrders.map(async (order) => {
          await syncPartnerCommissionForOrder(prisma, order.id)
          queueCdekWaybillAfterPayment({ ...order, paymentStatus }, order.paymentStatus)
          if (paymentStatus === 'PAID') await grantConsultationRewardsForPaidOrder(prisma, { ...order, paymentStatus })
        }))
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
      select: PAYMENT_SYNC_ORDER_SELECT
    })

    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' })
    }

    if (order.userId && order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Доступ запрещён' })
    }

    if (!order.paymentId) {
      const orderForResponse = await attachPromoCode(order)
      return res.json({
        success: true,
        paymentStatus: order.paymentStatus || 'PENDING',
        status: null,
        order: orderForResponse
      })
    }

    const result = await tochkaService.getPaymentStatus(order.paymentId)
    if (!result.success) {
      return res.status(500).json({ error: result.error || 'Ошибка проверки статуса' })
    }

    const paymentStatus = normalizePaymentStatus(result.status)
    const effectiveStatus = normalizePaymentStatus(order.paymentStatus) === 'PAID' ? 'PAID' : paymentStatus
    console.log('[PAYMENT] /sync-order status resolved', JSON.stringify({
      orderId: order.id,
      paymentId: order.paymentId,
      rawStatus: result.status,
      paymentStatus
    }))
    const updatedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { paymentStatus: effectiveStatus },
      select: PAYMENT_SYNC_ORDER_SELECT
    })
    await syncPartnerCommissionForOrder(prisma, order.id)
    queueCdekWaybillAfterPayment(updatedOrder, order.paymentStatus)
    if (effectiveStatus === 'PAID') await grantConsultationRewardsForPaidOrder(prisma, updatedOrder)

    const orderForResponse = await attachPromoCode(updatedOrder)

    res.json({
      success: true,
      paymentStatus: effectiveStatus,
      status: result.status,
      order: orderForResponse
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
        const existingOrder = await prisma.order.findUnique({
          where: { id: orderId },
          select: { paymentId: true, paymentLinkId: true, paymentStatus: true, cdekOrderUuid: true }
        })
        if (existingOrder) {
          const currentLink = !existingOrder.paymentLinkId || !paymentLinkId || existingOrder.paymentLinkId === paymentLinkId
          const currentPayment = !existingOrder.paymentId || !paymentId || existingOrder.paymentId === String(paymentId)
          // Only the active attempt can change the order. A late success from
          // an old invoice needs manual reconciliation, not automatic marking
          // of a different (possibly larger) payment as complete.
          if (currentLink && currentPayment) {
            const effectiveStatus = normalizePaymentStatus(existingOrder.paymentStatus) === 'PAID' ? 'PAID' : normalized
            updatedOrder = await prisma.order.update({
              where: { id: orderId },
              data: {
                paymentStatus: effectiveStatus,
                ...(paymentId && !existingOrder.paymentId ? { paymentId: String(paymentId) } : {})
              }
            })
            updatedOrder.previousPaymentStatus = existingOrder.paymentStatus
          } else if (normalized === 'PAID') {
            console.error('[PAYMENT] Paid superseded invoice requires reconciliation', { orderId, paymentLinkId, paymentId })
          }
        }
      }
    }

    if (!updatedOrder && paymentId) {
      const found = await prisma.order.findFirst({
        where: { paymentId: String(paymentId) },
        select: { id: true, paymentStatus: true, cdekOrderUuid: true }
      })
      if (found) {
        updatedOrder = await prisma.order.update({
          where: { id: found.id },
          data: { paymentStatus: normalizePaymentStatus(found.paymentStatus) === 'PAID' ? 'PAID' : normalized }
        })
        updatedOrder.previousPaymentStatus = found.paymentStatus
      }
    }

    if (updatedOrder) {
      await syncPartnerCommissionForOrder(prisma, updatedOrder.id)
      queueCdekWaybillAfterPayment(updatedOrder, updatedOrder.previousPaymentStatus)
      if (normalized === 'PAID') await grantConsultationRewardsForPaidOrder(prisma, updatedOrder)
      console.log(`[PAYMENT] Webhook updated order ${updatedOrder.id} paymentStatus=${normalized}`)
    } else {
      console.warn('[PAYMENT] Webhook did not match any order', { paymentLinkId, paymentId, normalized })
    }
  } catch (error) {
    next(error)
  }
})

export default router
