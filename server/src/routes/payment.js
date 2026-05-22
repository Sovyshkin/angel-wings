import { Router } from 'express'
import tochkaService from '../services/tochka.js'

const router = Router()

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

    const baseUrl = process.env.TOCHKA_REDIRECT_BASE_URL || process.env.CLIENT_URL || ''
    console.log('[PAYMENT] /create redirect baseUrl check', JSON.stringify({
      baseUrl,
      isHttps: baseUrl.startsWith('https://')
    }))
    if (!baseUrl || !baseUrl.startsWith('https://')) {
      return res.status(400).json({
        error: 'Для интеграции Точка требуется HTTPS URL для редиректов. Укажите TOCHKA_REDIRECT_BASE_URL=https://... в .env'
      })
    }
    const redirectUrl = `${baseUrl}/order-success?orderId=${orderId}`
    const failRedirectUrl = `${baseUrl}/order-failed?orderId=${orderId}`

    const result = await tochkaService.createPayment(
      amount,
      orderId,
      description || `Оплата заказа #${orderId}`,
      redirectUrl,
      failRedirectUrl
    )

    if (result.success && result.paymentUrl) {
      console.log('[PAYMENT] /create success', JSON.stringify({
        orderId,
        paymentId: result.paymentId
      }))
      res.json({ 
        success: true, 
        paymentUrl: result.paymentUrl,
        paymentId: result.paymentId
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
      const orderId = String(paymentLinkId || '').replace(/^order-/i, '')
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
