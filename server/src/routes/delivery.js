import express from 'express'
import { PrismaClient } from '@prisma/client'
import cdek from '../services/cdek.js'
import yandexGeocoder from '../services/yandexGeocoder.js'
import { extractLatestCdekStatus, mapCdekStatusToLocal } from '../utils/cdekStatus.js'

const router = express.Router()
const prisma = new PrismaClient()

function normalizeRussianPhone(value) {
  const digits = String(value || '').replace(/\D/g, '')

  if (digits.length === 11 && digits.startsWith('8')) {
    return `+7${digits.slice(1)}`
  }

  if (digits.length === 11 && digits.startsWith('7')) {
    return `+${digits}`
  }

  if (digits.length === 10 && digits.startsWith('9')) {
    return `+7${digits}`
  }

  return null
}

// ==================== КАЛЬКУЛЯТОР ====================

// POST /api/delivery/calculate-by-tariff
// Расчёт стоимости доставки по конкретному тарифу
router.post('/calculate-by-tariff', async (req, res) => {
  try {
    const { tariff_code, from_code, to_code, weight, length, width, height } = req.body

    if (!to_code || !weight) {
      return res.status(400).json({ error: 'Необходимо указать to_code и weight' })
    }

    const result = await cdek.calculateDeliveryByTariff({
      tariff_code: tariff_code || 136,
      from_code,
      to_code,
      weight,
      length,
      width,
      height
    })

    res.json(result)
  } catch (error) {
    console.error('[CDEK] Calculate by tariff error:', error)
    res.status(400).json(error.data || { error: error.message })
  }
})

// POST /api/delivery/calculate
// Расчёт стоимости доставки (автоматический выбор тарифа)
router.post('/calculate', async (req, res) => {
  try {
    const { from_code, to_code, weight, length, width, height } = req.body

    if (!to_code || !weight) {
      return res.status(400).json({ error: 'Необходимо указать to_code и weight' })
    }

    const result = await cdek.calculateDelivery({
      from_code,
      to_code,
      weight,
      length,
      width,
      height
    })

    res.json(result)
  } catch (error) {
    console.error('[CDEK] Calculate error:', error)
    res.status(400).json(error.data || { error: error.message })
  }
})

// GET /api/delivery/tariffs
// Получить список доступных тарифов
router.get('/tariffs', async (req, res) => {
  try {
    const result = await cdek.getTariffs()
    res.json(result)
  } catch (error) {
    console.error('[CDEK] Get tariffs error:', error)
    res.status(400).json(error.data || { error: error.message })
  }
})

// ==================== ПВЗ ====================

// GET /api/delivery/pickup-points
// Получить список ПВЗ
router.get('/pickup-points', async (req, res) => {
  try {
    const { city_code, postcode, limit } = req.query

    const result = await cdek.getPickupPoints({
      city_code,
      postcode,
      limit: limit ? parseInt(limit) : 50
    })

    res.json(result)
  } catch (error) {
    console.error('[CDEK] Get pickup points error:', error)
    res.status(400).json(error.data || { error: error.message })
  }
})

// GET /api/delivery/pickup-point/:code
// Получить информацию о конкретном ПВЗ
router.get('/pickup-point/:code', async (req, res) => {
  try {
    const { code } = req.params
    const result = await cdek.getPickupPoint(code)
    res.json(result)
  } catch (error) {
    console.error('[CDEK] Get pickup point error:', error)
    res.status(400).json(error.data || { error: error.message })
  }
})

// ==================== ЛОКАЦИИ ====================

// POST /api/delivery/find-city
// Найти город по названию
router.post('/find-city', async (req, res) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Необходимо указать name' })
    }

    const result = await cdek.findCity(name)
    res.json(result)
  } catch (error) {
    console.error('[CDEK] Find city error:', error)
    res.status(400).json(error.data || { error: error.message })
  }
})

// GET /api/delivery/city/:code
// Получить информацию о городе по коду
router.get('/city/:code', async (req, res) => {
  try {
    const { code } = req.params
    const result = await cdek.getCityInfo(code)
    res.json(result)
  } catch (error) {
    console.error('[CDEK] Get city info error:', error)
    res.status(400).json(error.data || { error: error.message })
  }
})

// POST /api/delivery/validate-courier-address
// Проверить адрес курьерской доставки по Москве через Яндекс Геокодер
router.post('/validate-courier-address', async (req, res) => {
  try {
    const { address } = req.body

    if (!String(address || '').trim()) {
      return res.status(400).json({
        valid: false,
        error: 'Укажите адрес доставки'
      })
    }

    const result = await yandexGeocoder.validateMoscowCourierAddress(address)
    const status = result.valid ? 200 : 400
    res.status(status).json(result)
  } catch (error) {
    console.error('[YANDEX] Validate courier address error:', error)
    res.status(500).json({
      valid: false,
      error: 'Не удалось проверить адрес. Попробуйте ещё раз.'
    })
  }
})

// ==================== ЗАКАЗЫ ====================

// POST /api/delivery/orders
// Создать заказ на доставку
router.post('/orders', async (req, res) => {
  try {
    const { 
      number, 
      tariff_code, 
      comment,
      recipient_name,
      recipient_phone,
      recipient_email,
      delivery_point,
      to_location,
      packages,
      from_contact,
      address
    } = req.body

    if (!number || !recipient_name || !recipient_phone || !packages || !packages.length) {
      return res.status(400).json({ 
        error: 'Необходимо указать number, recipient_name, recipient_phone и packages' 
      })
    }

    const normalizedRecipientPhone = normalizeRussianPhone(recipient_phone)
    if (!normalizedRecipientPhone) {
      return res.status(400).json({
        error: 'Укажите корректный телефон получателя в формате +7 999 999-99-99'
      })
    }

    const result = await cdek.createOrder({
      number,
      tariff_code,
      comment,
      recipient_name,
      recipient_phone: normalizedRecipientPhone,
      recipient_email,
      delivery_point,
      to_location,
      packages,
      from_contact,
      address
    })

    res.json(result)
  } catch (error) {
    console.error('[CDEK] Create order error:', error)
    res.status(400).json(error.data || { error: error.message })
  }
})

// GET /api/delivery/orders (without params - list orders)
// Получить список заказов
router.get('/orders', async (req, res) => {
  try {
    const { order_number, date_from, date_to } = req.query

    // CDEK API requires order_number/order_uuid for this endpoint.
    // For admin list page without filters, return recent linked orders from local DB.
    if (!order_number && !date_from && !date_to) {
      const recentOrders = await prisma.order.findMany({
        where: { cdekOrderUuid: { not: null } },
        orderBy: { createdAt: 'desc' },
        take: 100
      })

      const mapped = recentOrders.map((order) => ({
        uuid: order.cdekOrderUuid,
        number: `order-${order.id}`,
        status: order.status,
        tariff_code: order.deliveryTariffCode,
        created_at: order.createdAt,
        entity: {
          recipient: {
            name: order.customerName,
            phones: order.customerPhone ? [{ number: order.customerPhone }] : [],
            email: order.customerEmail
          }
        }
      }))

      return res.json(mapped)
    }

    const result = await cdek.getOrders({ order_number, date_from, date_to })
    res.json(result)
  } catch (error) {
    console.error('[CDEK] Get orders error:', error)
    res.status(400).json(error.data || { error: error.message })
  }
})

// GET /api/delivery/orders/:uuid (with uuid param - get single order)
// Получить информацию о заказе
router.get('/orders/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params
    const result = await cdek.getOrder(uuid)
    res.json(result)
  } catch (error) {
    console.error('[CDEK] Get order error:', error)
    res.status(400).json(error.data || { error: error.message })
  }
})

// POST /api/delivery/orders/:uuid/sync-status
// Синхронизировать локальный статус заказа со статусом в СДЭК
router.post('/orders/:uuid/sync-status', async (req, res) => {
  try {
    const { uuid } = req.params

    const cdekOrder = await cdek.getOrder(uuid)
    const latestStatus = extractLatestCdekStatus(cdekOrder)
    const cdekStatusCode = latestStatus?.code || null
    const nextLocalStatus = mapCdekStatusToLocal(cdekStatusCode)

    const order = await prisma.order.findFirst({
      where: { cdekOrderUuid: uuid }
    })

    if (!order) {
      return res.status(404).json({
        error: 'Локальный заказ с таким CDEK UUID не найден',
        cdekStatusCode,
        mappedStatus: nextLocalStatus
      })
    }

    let updated = false
    let currentStatus = order.status

    if (nextLocalStatus && nextLocalStatus !== order.status) {
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: { status: nextLocalStatus }
      })
      currentStatus = updatedOrder.status
      updated = true
    }

    res.json({
      success: true,
      updated,
      orderId: order.id,
      cdekOrderUuid: uuid,
      cdekStatusCode,
      localStatus: currentStatus,
      mappedStatus: nextLocalStatus
    })
  } catch (error) {
    console.error('[CDEK] Sync order status error:', error)
    res.status(400).json(error.data || { error: error.message })
  }
})

// DELETE /api/delivery/orders/:uuid
// Удалить заказ
router.delete('/orders/:uuid', async (req, res) => {
  try {
    const { uuid } = req.params
    const result = await cdek.deleteOrder(uuid)
    res.json(result)
  } catch (error) {
    console.error('[CDEK] Delete order error:', error)
    res.status(400).json(error.data || { error: error.message })
  }
})

// POST /api/delivery/orders/:uuid/cancel
// Отменить заказ
router.post('/orders/:uuid/cancel', async (req, res) => {
  try {
    const { uuid } = req.params
    const result = await cdek.cancelOrder(uuid)
    res.json(result)
  } catch (error) {
    console.error('[CDEK] Cancel order error:', error)
    res.status(400).json(error.data || { error: error.message })
  }
})

// ==================== КУРЬЕР ====================

// POST /api/delivery/courier
// Вызвать курьера
router.post('/courier', async (req, res) => {
  try {
    const { date, time_from, time_to, lunch_from, lunch_to, contact, address } = req.body

    if (!date || !time_from || !time_to) {
      return res.status(400).json({ error: 'Необходимо указать date, time_from и time_to' })
    }

    const result = await cdek.callCourier({
      date,
      time_from,
      time_to,
      lunch_from,
      lunch_to,
      contact,
      address
    })

    res.json(result)
  } catch (error) {
    console.error('[CDEK] Call courier error:', error)
    res.status(400).json(error.data || { error: error.message })
  }
})

// ==================== ПЕЧАТЬ ====================

// POST /api/delivery/orders/:uuid/print
// Получить UUID печатной формы
router.post('/orders/:uuid/print', async (req, res) => {
  try {
    const { uuid } = req.params
    const result = await cdek.getPrintForm(uuid)
    res.json(result)
  } catch (error) {
    console.error('[CDEK] Get print form error:', error)
    res.status(400).json(error.data || { error: error.message })
  }
})

// ==================== БАЛАНС ====================

// GET /api/delivery/balance
// Получить информацию о балансе
router.get('/balance', async (req, res) => {
  try {
    const result = await cdek.getBalance()
    res.json(result)
  } catch (error) {
    console.error('[CDEK] Get balance error:', error)
    res.status(400).json(error.data || { error: error.message })
  }
})

export default router
