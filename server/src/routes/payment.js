import { Router } from 'express'
import tochkaService from '../services/tochka.js'

const router = Router()

// Create payment link
router.post('/create', async (req, res, next) => {
  try {
    const { orderId, amount, description } = req.body

    if (!orderId || !amount) {
      return res.status(400).json({ error: 'Не указан ID заказа или сумма' })
    }

    const baseUrl = process.env.CLIENT_URL || 'http://localhost:5173'
    const redirectUrl = `${baseUrl}/order-success?orderId=${orderId}`
    const failRedirectUrl = `${baseUrl}/order-fail?orderId=${orderId}`

    const result = await tochkaService.createPayment(
      amount,
      orderId,
      description || `Оплата заказа #${orderId}`,
      redirectUrl,
      failRedirectUrl
    )

    if (result.success && result.paymentUrl) {
      res.json({ 
        success: true, 
        paymentUrl: result.paymentUrl,
        paymentId: result.paymentId
      })
    } else {
      res.status(500).json({ error: result.error || 'Ошибка создания платежа' })
    }
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
      res.json({ success: true, status: result.status })
    } else {
      res.status(500).json({ error: result.error })
    }
  } catch (error) {
    next(error)
  }
})

// Webhook for Tochka notifications
router.post('/webhook', async (req, res, next) => {
  try {
    // Handle webhook notifications from Tochka
    const { paymentLinkId, status } = req.body
    
    console.log('Tochka webhook received:', { paymentLinkId, status })
    
    // Respond OK immediately
    res.status(200).send('OK')
    
    // Process asynchronously
    if (status === 'paid' || status === 'success') {
      // Update order payment status
      const orderId = paymentLinkId?.replace('order-', '')
      if (orderId) {
        // You can emit an event or call order update here
        console.log(`Payment confirmed for order ${orderId}`)
      }
    }
  } catch (error) {
    next(error)
  }
})

export default router