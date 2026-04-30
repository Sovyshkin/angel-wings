import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { initPayment, getPaymentState, verifyCallback, cancelPayment } from '../services/tinkoff.js'

const router = Router()
const prisma = new PrismaClient()

router.post('/init', authenticate, async (req, res, next) => {
  console.log('[PAYMENT ROUTE] POST /api/payment/init')
  console.log('[PAYMENT ROUTE] User:', req.user)
  console.log('[PAYMENT ROUTE] Body:', req.body)

  try {
    const { orderId } = req.body
    console.log('[PAYMENT ROUTE] OrderId:', orderId)

    if (!process.env.TINKOFF_TERMINAL_KEY || !process.env.TINKOFF_SECRET_KEY) {
      console.log('[PAYMENT ROUTE] Ошибка: Tinkoff не настроен')
      return res.status(503).json({ error: 'Платёжная система не настроена. Обратитесь к администратору.' })
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(orderId) },
      include: { items: { include: { product: true } } }
    })

    console.log('[PAYMENT ROUTE] Найденный заказ:', order)

    if (!order) {
      console.log('[PAYMENT ROUTE] Ошибка: Заказ не найден')
      return res.status(404).json({ error: 'Order not found' })
    }

    if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      console.log('[PAYMENT ROUTE] Ошибка: Access denied')
      return res.status(403).json({ error: 'Access denied' })
    }

    const amount = Math.round(parseFloat(order.total) * 100)
    const description = `Заказ #${order.id}`

    console.log('[PAYMENT ROUTE] Вызов initPayment:', { orderId: order.id.toString(), amount, description })

    const result = await initPayment(
      order.id.toString(),
      amount,
      description,
      order.customerEmail,
      order.customerPhone
    )

    console.log('[PAYMENT ROUTE] Результат initPayment:', result)

    if (result.Success) {
      console.log('[PAYMENT ROUTE] Обновляем order paymentId:', result.PaymentId)
      await prisma.order.update({
        where: { id: order.id },
        data: { paymentId: result.PaymentId }
      })
    }

    res.json(result)
  } catch (error) {
    console.log('[PAYMENT ROUTE] Ошибка:', error.message)
    next(error)
  }
})

router.post('/callback', async (req, res, next) => {
  try {
    const data = req.body

    if (!verifyCallback(data)) {
      return res.status(400).json({ error: 'Invalid callback signature' })
    }

    const orderId = parseInt(data.OrderId)
    const success = data.Success === 'true' || data.Success === true

    if (success) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PROCESSING', paymentStatus: 'PAID' }
      })
    } else {
      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: 'FAILED' }
      })
    }

    res.json({ Success: true })
  } catch (error) {
    next(error)
  }
})

router.get('/status/:orderId', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.orderId) }
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (order.paymentId) {
      const state = await getPaymentState(order.paymentId)
      return res.json({ paymentStatus: order.paymentStatus, paymentState: state })
    }

    res.json({ paymentStatus: order.paymentStatus || 'PENDING' })
  } catch (error) {
    next(error)
  }
})

router.post('/cancel/:orderId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.orderId) }
    })

    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }

    if (!order.paymentId) {
      return res.status(400).json({ error: 'No payment initiated for this order' })
    }

    const result = await cancelPayment(order.paymentId, req.body.reason || 'Cancelled by admin')

    res.json(result)
  } catch (error) {
    next(error)
  }
})

export default router
