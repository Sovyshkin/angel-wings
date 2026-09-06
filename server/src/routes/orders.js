import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import cdek from '../services/cdek.js'
import { extractLatestCdekStatus, mapCdekStatusToLocal } from '../utils/cdekStatus.js'
import { notifyOrderToTelegram } from '../services/telegram.js'
import yandexGeocoder from '../services/yandexGeocoder.js'
import { calculatePartnerBalance } from '../utils/partnerBalance.js'
import { decryptMarketingPayload } from '../utils/marketingToken.js'
import { syncPartnerCommissionForOrder } from '../utils/partnerCommission.js'
import { normalizePointAmount, spendUserPoints } from '../utils/userPoints.js'

const router = Router()
const prisma = new PrismaClient()
const VALID_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'RETURNED', 'CANCELLED']
const ADDABLE_ORDER_STATUSES = ['PENDING', 'PROCESSING']
const INTERNAL_COURIER_MIN_ORDER_AMOUNT = 5000
let clientRequestIdPersistenceAvailable = true
const ORDER_INCLUDE = {
  items: {
    include: {
      product: {
        select: { title: true, image: true }
      }
    }
  }
}

function getDosagePriceFromSpecs(product, selectedDosage) {
  if (!selectedDosage || !product?.specs) return null

  try {
    const specs = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs
    const dosages = Array.isArray(specs?.dosages) ? specs.dosages : []
    const matched = dosages.find(d => typeof d?.dosage === 'string' && d.dosage.trim() === selectedDosage.trim())
    if (!matched) return null
    if (matched.price === undefined || matched.price === null || matched.price === '') return null
    return Math.max(0, parseFloat(matched.price) || 0)
  } catch {
    return null
  }
}

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

function normalizePromoCodeValue(code) {
  return String(code || '').trim().toUpperCase()
}

async function findPromoCodeByCode(code) {
  const rawCode = String(code || '').trim()
  const normalizedCode = normalizePromoCodeValue(rawCode)

  if (!normalizedCode) return null

  const candidateCodes = [...new Set([
    rawCode,
    normalizedCode,
    rawCode.toLowerCase()
  ].filter(Boolean))]

  const directMatch = await prisma.promoCode.findFirst({
    where: {
      OR: candidateCodes.map(candidate => ({ code: candidate }))
    }
  })

  if (directMatch) return directMatch

  // Legacy safety: older promo codes could be saved with mixed case or stray spaces.
  const allPromoCodes = await prisma.promoCode.findMany()
  return allPromoCodes.find(promoCode => normalizePromoCodeValue(promoCode.code) === normalizedCode) || null
}

function logPromoCheck(reason, details = {}) {
  console.log('[PROMO] validate', JSON.stringify({ reason, ...details }))
}

async function applyPromoCode(code, userId) {
  const normalizedCode = normalizePromoCodeValue(code)
  const promoCode = await findPromoCodeByCode(code)

  if (!promoCode || !promoCode.isActive) {
    logPromoCheck(!promoCode ? 'not_found' : 'inactive', {
      requestedCode: normalizedCode,
      userId: userId || null,
      promoCodeId: promoCode?.id || null
    })
    return { error: 'Промокод не найден или неактивен' }
  }

  if (promoCode.startDate && new Date() < promoCode.startDate) {
    logPromoCheck('not_started', { requestedCode: normalizedCode, promoCodeId: promoCode.id, startDate: promoCode.startDate })
    return { error: 'Промокод ещё не активен' }
  }

  if (promoCode.endDate && new Date() > promoCode.endDate) {
    logPromoCheck('expired', { requestedCode: normalizedCode, promoCodeId: promoCode.id, endDate: promoCode.endDate })
    return { error: 'Срок действия промокода истёк' }
  }

  if (promoCode.usageType === 'single' && promoCode.activationCount >= 1) {
    logPromoCheck('single_limit_reached', { requestedCode: normalizedCode, promoCodeId: promoCode.id, activationCount: promoCode.activationCount })
    return { error: 'Промокод достиг лимита использований' }
  }

  // maxActivations = 0 means unlimited activations for multi-use coupons
  if (
    promoCode.usageType === 'multi' &&
    Number(promoCode.maxActivations) > 0 &&
    promoCode.activationCount >= promoCode.maxActivations
  ) {
    logPromoCheck('multi_limit_reached', {
      requestedCode: normalizedCode,
      promoCodeId: promoCode.id,
      activationCount: promoCode.activationCount,
      maxActivations: promoCode.maxActivations
    })
    return { error: 'Промокод достиг лимита использований' }
  }

  if (promoCode.isFirstPurchase) {
    const hasExistingOrders = await prisma.order.count({ where: { userId } }) > 0
    if (hasExistingOrders) {
      logPromoCheck('first_purchase_only_rejected', { requestedCode: normalizedCode, promoCodeId: promoCode.id, userId: userId || null })
      return { error: 'Этот промокод только для первого заказа' }
    }
  }

  logPromoCheck('accepted', {
    requestedCode: normalizedCode,
    storedCode: promoCode.code,
    promoCodeId: promoCode.id,
    userId: userId || null
  })

  if (promoCode.minOrderAmount) {
    return { minOrderAmount: promoCode.minOrderAmount, code: promoCode }
  }

  return { promoCode }
}

function calculatePromoDiscount(amount, promoCode) {
  const normalizedAmount = Math.max(0, Number(amount) || 0)
  if (!promoCode || normalizedAmount <= 0) return 0

  if (promoCode.discountType === 'percentage') {
    return normalizedAmount * (promoCode.discountValue / 100)
  }
  return Math.min(promoCode.discountValue, normalizedAmount)
}

function isCdekDeliveryType(deliveryType) {
  const normalized = String(deliveryType || '').trim().toLowerCase()
  return normalized === 'pvz_cdek' || normalized === 'pvz'
}

function createClientError(message, status = 400) {
  const error = new Error(message)
  error.status = status
  return error
}

function isClientRequestIdSchemaError(error) {
  const message = String(error?.message || '')
  return (
    error?.name === 'PrismaClientValidationError' && message.includes('clientRequestId')
  ) || (
    error?.code === 'P2022' && message.includes('clientRequestId')
  )
}

function normalizePaymentStatusValue(status) {
  return String(status || '').trim().toUpperCase()
}

function isPaidStatus(status) {
  return ['PAID', 'APPROVED', 'SUCCESS', 'SUCCEEDED', 'COMPLETED'].some(code =>
    normalizePaymentStatusValue(status).includes(code)
  )
}

function normalizeAdditionItems(rawItems) {
  if (!Array.isArray(rawItems)) return []

  return rawItems
    .map((item) => ({
      productId: parseInt(item?.productId, 10),
      quantity: Math.max(1, parseInt(item?.quantity, 10) || 1),
      selectedDosage: item?.selectedDosage ? String(item.selectedDosage).trim() : null
    }))
    .filter(item => Number.isFinite(item.productId) && item.productId > 0)
}

function getOrderItemsWeight(items = []) {
  return items.reduce((sum, item) => {
    const weight = Math.max(0, parseInt(item?.product?.weight, 10) || 0)
    const quantity = Math.max(0, parseInt(item?.quantity, 10) || 0)
    return sum + weight * quantity
  }, 0)
}

function getPickupPointCityCode(pickupPoint) {
  return pickupPoint?.location?.city_code ||
    pickupPoint?.location?.cityCode ||
    pickupPoint?.city_code ||
    pickupPoint?.cityCode ||
    null
}

async function calculateUpdatedDeliveryPrice(order, totalWeight, declaredValue) {
  const currentDeliveryPrice = Math.max(0, Number(order?.deliveryPrice || 0))
  const isCdekPickup = Boolean(order?.deliveryPickupPoint && order?.deliveryTariffCode)
  const isInternalCourier = String(order?.deliveryTariffName || '').toLowerCase().includes('курьер по москве')

  if (isInternalCourier || !isCdekPickup) {
    return {
      deliveryPrice: currentDeliveryPrice,
      recalculated: false,
      warning: null
    }
  }

  try {
    const pickupPoint = await cdek.getPickupPoint(order.deliveryPickupPoint)
    const toCode = getPickupPointCityCode(pickupPoint)

    if (!toCode) {
      return {
        deliveryPrice: currentDeliveryPrice,
        recalculated: false,
        warning: 'Не удалось определить город ПВЗ СДЭК для пересчёта доставки'
      }
    }

    const calculated = await cdek.calculateDeliveryByTariff({
      tariff_code: order.deliveryTariffCode,
      to_code: toCode,
      weight: Math.max(1, totalWeight),
      length: 10,
      width: 10,
      height: 10
    })

    const baseDeliveryPrice = Number(calculated?.delivery_sum || calculated?.total_sum || calculated?.price || 0) || 0
    const insurancePrice = Math.round(Math.max(0, Number(declaredValue) || 0) * 0.0075 * 100) / 100
    const nextDeliveryPrice = Math.max(
      currentDeliveryPrice,
      Math.round((baseDeliveryPrice + insurancePrice) * 100) / 100
    )

    return {
      deliveryPrice: nextDeliveryPrice,
      recalculated: true,
      warning: order.cdekOrderUuid
        ? 'Доставка пересчитана локально. Если заказ уже создан в СДЭК, состав отправления нужно проверить в кабинете СДЭК.'
        : null
    }
  } catch (error) {
    console.error('[ORDER_ADD_ITEMS] CDEK delivery recalculation failed:', error?.message || error)
    return {
      deliveryPrice: currentDeliveryPrice,
      recalculated: false,
      warning: 'СДЭК временно не ответил на пересчёт доставки, поэтому стоимость доставки оставлена без изменений'
    }
  }
}

async function buildOrderAdditionQuote(orderId, user, rawItems) {
  if (!Number.isFinite(orderId)) {
    throw createClientError('Некорректный ID заказа')
  }

  const additionItems = normalizeAdditionItems(rawItems)
  if (!additionItems.length) {
    throw createClientError('Выберите товары для добавления')
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: {
            select: { id: true, title: true, image: true, price: true, stock: true, weight: true, specs: true, active: true }
          }
        }
      }
    }
  })

  if (!order) {
    throw createClientError('Заказ не найден', 404)
  }

  if (order.userId && order.userId !== user.id && user.role !== 'ADMIN') {
    throw createClientError('Доступ запрещён', 403)
  }

  if (!ADDABLE_ORDER_STATUSES.includes(String(order.status || '').toUpperCase())) {
    throw createClientError('Добавить товары можно только в заказ, который ещё не отправлен')
  }

  const productIds = [...new Set(additionItems.map(item => item.productId))]
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      active: true
    },
    select: { id: true, title: true, image: true, price: true, stock: true, weight: true, specs: true }
  })
  const productMap = new Map(products.map(product => [product.id, product]))

  const normalizedItems = []
  let itemsSubtotal = 0
  let addedWeight = 0

  for (const item of additionItems) {
    const product = productMap.get(item.productId)
    if (!product) {
      throw createClientError(`Товар ${item.productId} не найден или скрыт`)
    }
    if (product.stock < item.quantity) {
      throw createClientError(`Недостаточно товара "${product.title}"`)
    }

    const dosagePrice = getDosagePriceFromSpecs(product, item.selectedDosage)
    const price = dosagePrice !== null ? dosagePrice : Math.max(0, Number(product.price) || 0)
    const weight = Math.max(0, parseInt(product.weight, 10) || 0)
    const lineTotal = price * item.quantity

    itemsSubtotal += lineTotal
    addedWeight += weight * item.quantity
    normalizedItems.push({
      productId: product.id,
      title: product.title,
      image: product.image,
      selectedDosage: item.selectedDosage,
      quantity: item.quantity,
      price,
      lineTotal,
      weight
    })
  }

  const currentDeliveryPrice = Math.max(0, Number(order.deliveryPrice || 0))
  const isCdekPickup = Boolean(order.deliveryPickupPoint && order.deliveryTariffCode)
  const currentWeight = getOrderItemsWeight(order.items)
  const nextWeight = Math.max(1, currentWeight + addedWeight)
  const currentItemsValue = order.items.reduce((sum, item) => (
    sum + Math.max(0, Number(item.price) || 0) * Math.max(0, Number(item.quantity) || 0)
  ), 0)
  const deliveryQuote = await calculateUpdatedDeliveryPrice(order, nextWeight, currentItemsValue + itemsSubtotal)
  const deliveryAdjustment = Math.max(0, Number(deliveryQuote.deliveryPrice || 0) - currentDeliveryPrice)
  const sitePaidDeliveryAdjustment = isCdekPickup ? 0 : deliveryAdjustment
  const oldOrderTotal = Math.max(0, Number(order.total || 0))
  const newOrderTotal = oldOrderTotal + itemsSubtotal + sitePaidDeliveryAdjustment
  const isCashOnDelivery = normalizePaymentStatusValue(order.paymentStatus) === 'CASH_ON_DELIVERY'
  const requiresOnlinePayment = !isCashOnDelivery && (isPaidStatus(order.paymentStatus) ? itemsSubtotal + sitePaidDeliveryAdjustment : newOrderTotal) > 0
  const paymentAmount = isCashOnDelivery
    ? 0
    : (isPaidStatus(order.paymentStatus) ? itemsSubtotal + sitePaidDeliveryAdjustment : newOrderTotal)

  return {
    order,
    items: normalizedItems,
    itemsSubtotal,
    currentDeliveryPrice,
    nextDeliveryPrice: deliveryQuote.deliveryPrice,
    deliveryAdjustment,
    sitePaidDeliveryAdjustment,
    deliveryPaidByRecipient: isCdekPickup,
    oldOrderTotal,
    newOrderTotal,
    paymentAmount,
    requiresOnlinePayment,
    paymentMode: isCashOnDelivery ? 'cash_on_delivery' : 'online',
    totalWeight: nextWeight,
    deliveryRecalculated: deliveryQuote.recalculated,
    warning: deliveryQuote.warning
  }
}

async function bindUserToPartner(userId, partnerId, promoCodeId = null, source = 'link') {
  const existing = await prisma.partnerUser.findUnique({
    where: { userId }
  })

  if (existing) {
    return { bound: false, reason: 'already_bound' }
  }

  const partner = await prisma.partner.findUnique({
    where: { id: partnerId }
  })

  if (!partner || !partner.isActive) {
    return { bound: false, reason: 'partner_not_found_or_inactive' }
  }

  await prisma.partnerUser.create({
    data: {
      userId,
      partnerId,
      promoCodeId,
      referralSource: source
    }
  })

  return { bound: true }
}

// Создание заказа - требуется авторизация
router.post('/promo/validate', authenticate, async (req, res, next) => {
  try {
    const code = String(req.body?.code || '').trim().toUpperCase()
    const amount = Math.max(0, Number(req.body?.amount || 0))

    if (!code) {
      return res.status(400).json({ error: 'Укажите промокод' })
    }

    const promoResult = await applyPromoCode(code, req.user?.id)
    if (promoResult.error) {
      return res.status(400).json({ error: promoResult.error })
    }

    const appliedPromoCode = promoResult.code || promoResult.promoCode
    const minOrderAmount = promoResult.minOrderAmount || appliedPromoCode?.minOrderAmount || 0
    if (minOrderAmount > 0 && amount < minOrderAmount) {
      logPromoCheck('min_order_amount_rejected', {
        requestedCode: code,
        promoCodeId: appliedPromoCode?.id || null,
        amount,
        minOrderAmount
      })
      return res.status(400).json({
        error: `Минимальная сумма заказа для этого промокода: ${minOrderAmount}`
      })
    }

    const discountAmount = calculatePromoDiscount(amount, appliedPromoCode)
    return res.json({
      valid: true,
      code: appliedPromoCode.code,
      discountType: appliedPromoCode.discountType,
      discountValue: appliedPromoCode.discountValue,
      discountAmount,
      finalAmount: Math.max(0, amount - discountAmount)
    })
  } catch (error) {
    next(error)
  }
})

router.get('/partner-balance', authenticate, async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({
      where: { userId: req.user.id },
      select: { id: true, isActive: true }
    })

    if (!partner || !partner.isActive) {
      return res.json({
        hasPartnerAccess: false,
        availableBalance: 0
      })
    }

    const balance = await calculatePartnerBalance(prisma, partner.id)
    return res.json({
      hasPartnerAccess: true,
      partnerId: partner.id,
      ...balance
    })
  } catch (error) {
    next(error)
  }
})

// Создание заказа - требуется авторизация
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { 
      items, 
      customerName, 
      customerEmail, 
      customerPhone, 
      shippingAddress, 
      notes, 
      userId, 
      promoCode,
      delivery,
      paymentMethod,
      partnerBonusAmount,
      userPointsAmount,
      clientRequestId,
      attribution,
      utm
    } = req.body

    const normalizedClientRequestId = String(clientRequestId || '').trim()
    if (normalizedClientRequestId && clientRequestIdPersistenceAvailable) {
      let existingOrder = null

      try {
        existingOrder = await prisma.order.findUnique({
          where: { clientRequestId: normalizedClientRequestId },
          include: ORDER_INCLUDE
        })
      } catch (error) {
        if (!isClientRequestIdSchemaError(error)) {
          throw error
        }

        clientRequestIdPersistenceAvailable = false
        console.warn('[ORDER] clientRequestId is not available in Prisma/DB schema. Run prisma generate and prisma db push to enable duplicate checkout protection.')
      }

      if (existingOrder) {
        const isOwner = !existingOrder.userId || existingOrder.userId === req.user.id || req.user.role === 'ADMIN'
        if (!isOwner) {
          return res.status(403).json({ error: 'Доступ запрещён' })
        }

        console.log('[ORDER] Duplicate checkout request detected, returning existing order', JSON.stringify({
          orderId: existingOrder.id,
          clientRequestId: normalizedClientRequestId
        }))

        return res.status(200).json({
          order: existingOrder,
          meta: {
            duplicate: true,
            userPointsUsed: Math.max(0, Number(existingOrder.userPointsUsed || 0)),
            partnerBonusUsed: Math.max(0, Number(existingOrder.partnerBonusAmount || 0))
          }
        })
      }
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Корзина пуста' })
    }

    const normalizedCustomerPhone = normalizeRussianPhone(customerPhone)
    if (!normalizedCustomerPhone) {
      return res.status(400).json({ error: 'Укажите корректный номер телефона в формате +7 999 999-99-99' })
    }

    const normalizedDeliveryType = String(delivery?.type || '').trim()
    const rawAttribution = attribution && typeof attribution === 'object'
      ? attribution
      : (utm && typeof utm === 'object' ? utm : {})
    const marketingToken = rawAttribution.aw_m || rawAttribution.awM || rawAttribution.marketingToken || rawAttribution.marketing_token
    const decryptedAttribution = marketingToken ? decryptMarketingPayload(marketingToken) : null
    const attributionWithToken = decryptedAttribution && typeof decryptedAttribution === 'object'
      ? { ...decryptedAttribution, ...rawAttribution }
      : rawAttribution
    const normalizeAttributionField = (...keys) => {
      for (const key of keys) {
        const value = String(attributionWithToken?.[key] || '').trim()
        if (value) return value.slice(0, 160)
      }
      return null
    }
    const orderAttribution = {
      utmSource: normalizeAttributionField('utm_source', 'utmSource', 'source'),
      utmMedium: normalizeAttributionField('utm_medium', 'utmMedium', 'medium'),
      utmCampaign: normalizeAttributionField('utm_campaign', 'utmCampaign', 'campaign'),
      utmContent: normalizeAttributionField('utm_content', 'utmContent', 'content'),
      utmTerm: normalizeAttributionField('utm_term', 'utmTerm', 'term')
    }
    const isInternalMoscowCourier =
      normalizedDeliveryType === 'courier_internal_moscow' ||
      normalizedDeliveryType === 'courier'
    const normalizedPaymentMethod = String(paymentMethod || 'online').trim().toLowerCase()
    const isCashOnDelivery = normalizedPaymentMethod === 'cash_on_delivery'
    let validatedCourierAddress = null

    if (isCashOnDelivery && !isInternalMoscowCourier) {
      return res.status(400).json({
        error: 'Оплата наличными доступна только для курьерской доставки по Москве'
      })
    }

    if (isInternalMoscowCourier) {
      const courierAddress = String(delivery?.address || shippingAddress || '').trim()
      if (!courierAddress) {
        return res.status(400).json({ error: 'Для курьерской доставки по Москве укажите адрес' })
      }

      const addressValidation = await yandexGeocoder.validateMoscowCourierAddress(courierAddress)
      if (!addressValidation.valid) {
        return res.status(400).json({
          error: addressValidation.message || 'Адрес курьерской доставки не прошёл проверку',
          code: addressValidation.code || 'INVALID_COURIER_ADDRESS'
        })
      }

      validatedCourierAddress = addressValidation.normalizedAddress || courierAddress
    }

    const productIds = items.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    })

    const productMap = new Map(products.map(p => [p.id, p]))

    let total = 0
    const orderItems = []

    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return res.status(400).json({ error: `Товар ${item.productId} не найден` })
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Недостаточно товара "${product.title}"` })
      }

      const dosagePrice = getDosagePriceFromSpecs(product, item.selectedDosage)
      const price = dosagePrice !== null ? dosagePrice : parseFloat(product.price)
      total += price * item.quantity
      orderItems.push({
        productId: item.productId,
        dosage: item.selectedDosage || null,
        quantity: item.quantity,
        price
      })
    }

    // total = sum of products in cart (without delivery)
    const itemsSubtotal = total
    if (isInternalMoscowCourier && itemsSubtotal < INTERNAL_COURIER_MIN_ORDER_AMOUNT) {
      return res.status(400).json({
        error: `Курьер по Москве доступен от ${INTERNAL_COURIER_MIN_ORDER_AMOUNT.toLocaleString('ru-RU')} ₽`
      })
    }

    const submittedDeliveryPrice = Math.max(0, Number(delivery?.price) || 0)
    const isCdekDelivery = isCdekDeliveryType(normalizedDeliveryType)
    const submittedCdekBasePrice = Number(delivery?.base_price)
    let cdekInsurancePrice = isCdekDelivery
      ? Math.round(itemsSubtotal * 0.0075 * 100) / 100
      : 0
    let deliveryPrice = isCdekDelivery && Number.isFinite(submittedCdekBasePrice)
      ? Math.round((Math.max(0, submittedCdekBasePrice) + cdekInsurancePrice) * 100) / 100
      : submittedDeliveryPrice

    let discountAmount = 0
    const requestedPartnerBonusAmount = Math.max(0, Number(partnerBonusAmount) || 0)
    const requestedUserPointsAmount = normalizePointAmount(userPointsAmount)
    let partnerBonusUsed = 0
    let userPointsUsed = 0
    let appliedPromoCode = null
    let promoCodeId = null
    let partnerId = null
    let partnerLockNotice = null

    const actualUserId = req.user?.id || userId || null

    const existingBinding = actualUserId
      ? await prisma.partnerUser.findUnique({
          where: { userId: actualUserId }
        })
      : null

    // Best-effort lifetime protection for re-registrations:
    // if user has no direct binding, try to restore partner by historical email/phone orders.
    let historicalPartnerId = null
    if (!existingBinding && req.user) {
      const historicalOr = [{ customerEmail: req.user.email }]
      if (req.user.phone) {
        historicalOr.push({ customerPhone: req.user.phone })
      }

      const historicalOrder = await prisma.order.findFirst({
        where: {
          partnerId: { not: null },
          OR: historicalOr
        },
        orderBy: { createdAt: 'desc' },
        select: { partnerId: true }
      })

      historicalPartnerId = historicalOrder?.partnerId || null
    }

    if (promoCode) {
      const promoResult = await applyPromoCode(promoCode, req.user?.id || userId)

      if (promoResult.error) {
        return res.status(400).json({ error: promoResult.error })
      }

      if (promoResult.minOrderAmount) {
        if (itemsSubtotal < promoResult.minOrderAmount) {
          logPromoCheck('min_order_amount_rejected_on_order', {
            requestedCode: String(promoCode || '').trim().toUpperCase(),
            amount: itemsSubtotal,
            minOrderAmount: promoResult.minOrderAmount
          })
          return res.status(400).json({
            error: `Минимальная сумма заказа для этого промокода: ${promoResult.minOrderAmount}`
          })
        }
        appliedPromoCode = promoResult.code
      } else if (promoResult.promoCode) {
        appliedPromoCode = promoResult.promoCode
      }

      if (appliedPromoCode) {
        promoCodeId = appliedPromoCode.id

        discountAmount = calculatePromoDiscount(itemsSubtotal, appliedPromoCode)

        if (appliedPromoCode.partnerId) {
          const existingPartnerId = existingBinding?.partnerId || historicalPartnerId
          const promoPartnerId = appliedPromoCode.partnerId

          // Lifetime single-partner rule: never rebind user to another partner automatically.
          if (existingPartnerId && existingPartnerId !== promoPartnerId) {
            if (appliedPromoCode.isFirstPurchase) {
              return res.status(400).json({
                error: 'Вы уже закреплены за другим партнёром'
              })
            }

            partnerId = existingPartnerId
            partnerLockNotice = 'Вы уже закреплены за другим партнёром'
          } else {
            partnerId = promoPartnerId
          }
        }
      }
    }

    if (!partnerId && existingBinding) {
      partnerId = existingBinding.partnerId
    }
    if (!partnerId && historicalPartnerId) {
      partnerId = historicalPartnerId
    }

    const order = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        })
      }

      if (appliedPromoCode) {
        await tx.promoCode.update({
          where: { id: appliedPromoCode.id },
          data: { activationCount: { increment: 1 } }
        })
      }

      const promoDiscountAmount = Math.min(itemsSubtotal, Math.max(0, Number(discountAmount || 0)))
      if (isCdekDelivery && Number.isFinite(submittedCdekBasePrice)) {
        const declaredValueAfterPromo = Math.max(0, itemsSubtotal - promoDiscountAmount)
        cdekInsurancePrice = Math.round(declaredValueAfterPromo * 0.0075 * 100) / 100
        deliveryPrice = Math.round((Math.max(0, submittedCdekBasePrice) + cdekInsurancePrice) * 100) / 100
      }
      const sitePaidDeliveryPrice = isCdekDelivery ? 0 : deliveryPrice
      const subtotalAfterPromo = Math.max(0, itemsSubtotal - promoDiscountAmount) + sitePaidDeliveryPrice

      if (requestedPartnerBonusAmount > 0) {
        if (!actualUserId) {
          throw createClientError('Для списания партнёрского баланса требуется авторизация')
        }

        const userPartner = await tx.partner.findUnique({
          where: { userId: actualUserId },
          select: { id: true, isActive: true }
        })

        if (!userPartner || !userPartner.isActive) {
          throw createClientError('Партнёрский баланс недоступен для этого аккаунта')
        }

        const partnerBalance = await calculatePartnerBalance(tx, userPartner.id)
        partnerBonusUsed = Math.min(
          requestedPartnerBonusAmount,
          subtotalAfterPromo,
          Math.max(0, Number(partnerBalance.availableBalance || 0))
        )

        if (partnerBonusUsed <= 0) {
          throw createClientError('Недостаточно партнёрского баланса для списания')
        }

        await tx.partnerPayment.create({
          data: {
            partnerId: userPartner.id,
            amount: partnerBonusUsed,
            type: 'ORDER_SPEND',
            status: 'SPENT_ON_ORDER',
            paidAt: new Date()
          }
        })
      }

      const subtotalAfterPartnerBonus = Math.max(0, subtotalAfterPromo - partnerBonusUsed)
      if (requestedUserPointsAmount > 0) {
        userPointsUsed = Math.min(requestedUserPointsAmount, subtotalAfterPartnerBonus)
        if (userPointsUsed <= 0) {
          throw createClientError('Баллы нельзя списать на этот заказ')
        }
      }

      const totalDiscountAmount = promoDiscountAmount + partnerBonusUsed + userPointsUsed
      const finalOrderTotal = Math.max(0, itemsSubtotal + sitePaidDeliveryPrice - totalDiscountAmount)
      const orderCreateData = {
        customerName,
        customerEmail,
        customerPhone: normalizedCustomerPhone,
        shippingAddress: validatedCourierAddress || shippingAddress || delivery?.address || null,
        notes,
        total: finalOrderTotal,
        paymentStatus: finalOrderTotal <= 0 ? 'PAID' : (isCashOnDelivery ? 'CASH_ON_DELIVERY' : 'PENDING'),
        userId: actualUserId,
        promoCodeId,
        discountAmount: totalDiscountAmount,
        partnerBonusAmount: partnerBonusUsed,
        userPointsUsed,
        partnerId,
        ...orderAttribution,
        clientRequestId: normalizedClientRequestId && clientRequestIdPersistenceAvailable
          ? normalizedClientRequestId
          : undefined,
        // Delivery info
        deliveryTariffCode: isInternalMoscowCourier ? null : delivery?.tariff_code,
        deliveryTariffName: delivery?.tariff_name || (isInternalMoscowCourier ? 'Курьер по Москве (внутренняя доставка)' : null),
        deliveryPrice: deliveryPrice,
        deliveryCity: delivery?.city || (isInternalMoscowCourier ? 'Москва' : null),
        deliveryPickupPoint: isInternalMoscowCourier ? null : delivery?.pickup_point,
        deliveryPickupName: isInternalMoscowCourier ? (validatedCourierAddress || delivery?.address || shippingAddress || null) : delivery?.pickup_point_name,
        items: {
          create: orderItems
        }
      }

      let createdOrder
      try {
        createdOrder = await tx.order.create({
          data: orderCreateData,
          include: ORDER_INCLUDE
        })
      } catch (error) {
        if (!isClientRequestIdSchemaError(error) || !orderCreateData.clientRequestId) {
          throw error
        }

        clientRequestIdPersistenceAvailable = false
        delete orderCreateData.clientRequestId
        console.warn('[ORDER] clientRequestId column is missing during order creation. Retrying without duplicate checkout key.')

        createdOrder = await tx.order.create({
          data: orderCreateData,
          include: ORDER_INCLUDE
        })
      }

      if (partnerId && actualUserId) {
        const existingBindingInTx = await tx.partnerUser.findUnique({
          where: { userId: actualUserId }
        })

        if (!existingBindingInTx) {
          const promoCodeForBinding = appliedPromoCode ? promoCodeId : null
          await tx.partnerUser.create({
            data: {
              userId: actualUserId,
              partnerId,
              promoCodeId: promoCodeForBinding,
              referralSource: promoCode ? 'promo_code' : 'link'
            }
          })
        }
      }

      if (userPointsUsed > 0) {
        await spendUserPoints(tx, {
          userId: actualUserId,
          amount: userPointsUsed,
          orderId: createdOrder.id
        })
      }

      return createdOrder
    })

    if (partnerBonusUsed > 0 && order.userId) {
      const buyerPartner = await prisma.partner.findUnique({
        where: { userId: order.userId },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      })

      if (buyerPartner) {
        order.partnerBonusInfo = {
          amount: partnerBonusUsed,
          partnerId: buyerPartner.id,
          partnerName: buyerPartner.user?.name || null,
          partnerEmail: buyerPartner.user?.email || null,
          balance: await calculatePartnerBalance(prisma, buyerPartner.id)
        }
      }
    }

    await syncPartnerCommissionForOrder(prisma, order.id)

    console.log('[TELEGRAM] Order detected, preparing notification', JSON.stringify({
      orderId: order.id,
      deliveryType: normalizedDeliveryType || null,
      paymentMethod: isCashOnDelivery ? 'cash_on_delivery' : 'online',
      hasAddress: Boolean(order.shippingAddress || order.deliveryPickupName)
    }))
    notifyOrderToTelegram(order).catch((error) => {
      console.error('[TELEGRAM] Order notification error:', error?.message || error, error?.stack || '')
    })

    res.status(201).json({
      order,
      meta: {
        ...(partnerLockNotice ? { partnerNotice: partnerLockNotice } : {}),
        partnerBonusUsed,
        userPointsUsed,
        paymentMethod: isCashOnDelivery ? 'cash_on_delivery' : 'online'
      }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/my', authenticate, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: {
              select: { title: true, image: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const statusMetaByOrderId = new Map()
    const ordersWithCdek = orders.filter(order => Boolean(order.cdekOrderUuid))

    if (ordersWithCdek.length) {
      const cdekResults = await Promise.allSettled(
        ordersWithCdek.map(async (order) => {
          const cdekOrder = await cdek.getOrder(order.cdekOrderUuid)
          const latestStatus = extractLatestCdekStatus(cdekOrder)
          const mappedLocalStatus = mapCdekStatusToLocal(latestStatus?.code)

          if (mappedLocalStatus && mappedLocalStatus !== order.status) {
            await prisma.order.update({
              where: { id: order.id },
              data: { status: mappedLocalStatus }
            })
          }

          return {
            orderId: order.id,
            source: 'cdek',
            cdekStatusCode: latestStatus?.code || null,
            cdekStatusName: latestStatus?.name || null,
            cdekStatusDate: latestStatus?.dateTime || null,
            mappedLocalStatus
          }
        })
      )

      for (const result of cdekResults) {
        if (result.status !== 'fulfilled') continue
        statusMetaByOrderId.set(result.value.orderId, result.value)
      }
    }

    const buyerPartner = orders.some(order => Math.max(0, Number(order.partnerBonusAmount || 0)) > 0)
      ? await prisma.partner.findUnique({
          where: { userId: req.user.id },
          include: {
            user: {
              select: {
                name: true,
                email: true
              }
            }
          }
        })
      : null
    const buyerPartnerBalance = buyerPartner
      ? await calculatePartnerBalance(prisma, buyerPartner.id)
      : null

    const responseOrders = orders.map((order) => {
      const meta = statusMetaByOrderId.get(order.id)
      const effectiveStatus = meta?.mappedLocalStatus || order.status
      const partnerBonusAmount = Math.max(0, Number(order.partnerBonusAmount || 0))
      return {
        ...order,
        status: effectiveStatus,
        partnerBonusInfo: partnerBonusAmount > 0 && buyerPartner
          ? {
              amount: partnerBonusAmount,
              partnerId: buyerPartner.id,
              partnerName: buyerPartner.user?.name || null,
              partnerEmail: buyerPartner.user?.email || null,
              balance: buyerPartnerBalance
            }
          : null,
        deliveryStatusSource: meta?.source || 'local',
        cdekStatusCode: meta?.cdekStatusCode || null,
        cdekStatusName: meta?.cdekStatusName || null,
        cdekStatusDate: meta?.cdekStatusDate || null
      }
    })

    res.json({ orders: responseOrders })
  } catch (error) {
    next(error)
  }
})

router.post('/:id/add-items/preview', authenticate, async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id, 10)
    const quote = await buildOrderAdditionQuote(orderId, req.user, req.body?.items)

    res.json({
      success: true,
      quote: {
        items: quote.items,
        itemsSubtotal: quote.itemsSubtotal,
        currentDeliveryPrice: quote.currentDeliveryPrice,
        nextDeliveryPrice: quote.nextDeliveryPrice,
        deliveryAdjustment: quote.deliveryAdjustment,
        sitePaidDeliveryAdjustment: quote.sitePaidDeliveryAdjustment,
        deliveryPaidByRecipient: quote.deliveryPaidByRecipient,
        oldOrderTotal: quote.oldOrderTotal,
        newOrderTotal: quote.newOrderTotal,
        paymentAmount: quote.paymentAmount,
        requiresOnlinePayment: quote.requiresOnlinePayment,
        paymentMode: quote.paymentMode,
        totalWeight: quote.totalWeight,
        deliveryRecalculated: quote.deliveryRecalculated,
        warning: quote.warning
      }
    })
  } catch (error) {
    next(error)
  }
})

router.post('/:id/add-items', authenticate, async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id, 10)
    const quote = await buildOrderAdditionQuote(orderId, req.user, req.body?.items)

    const updatedOrder = await prisma.$transaction(async (tx) => {
      for (const item of quote.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        })

        const existingItem = quote.order.items.find(orderItem =>
          orderItem.productId === item.productId &&
          String(orderItem.dosage || '') === String(item.selectedDosage || '')
        )

        if (existingItem) {
          await tx.orderItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: { increment: item.quantity },
              price: item.price
            }
          })
        } else {
          await tx.orderItem.create({
            data: {
              orderId: quote.order.id,
              productId: item.productId,
              dosage: item.selectedDosage || null,
              quantity: item.quantity,
              price: item.price
            }
          })
        }
      }

      const paymentStatus = quote.paymentMode === 'cash_on_delivery'
        ? 'CASH_ON_DELIVERY'
        : (quote.paymentAmount > 0 ? 'PENDING' : quote.order.paymentStatus)

      const order = await tx.order.update({
        where: { id: quote.order.id },
        data: {
          total: quote.newOrderTotal,
          deliveryPrice: quote.nextDeliveryPrice,
          paymentStatus,
          paymentId: quote.paymentAmount > 0 && quote.paymentMode !== 'cash_on_delivery' ? null : quote.order.paymentId
        },
        include: {
          items: {
            include: {
              product: {
                select: { title: true, image: true }
              }
            }
          }
        }
      })

      return order
    })

    await syncPartnerCommissionForOrder(prisma, updatedOrder.id)

    res.json({
      success: true,
      order: updatedOrder,
      meta: {
        addedItems: quote.items,
        itemsSubtotal: quote.itemsSubtotal,
        deliveryAdjustment: quote.deliveryAdjustment,
        sitePaidDeliveryAdjustment: quote.sitePaidDeliveryAdjustment,
        deliveryPaidByRecipient: quote.deliveryPaidByRecipient,
        oldOrderTotal: quote.oldOrderTotal,
        newOrderTotal: quote.newOrderTotal,
        paymentAmount: quote.paymentAmount,
        requiresOnlinePayment: quote.requiresOnlinePayment,
        paymentMode: quote.paymentMode,
        deliveryRecalculated: quote.deliveryRecalculated,
        warning: quote.warning
      }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        items: {
          include: {
            product: {
              select: { title: true, image: true, price: true }
            }
          }
        },
        user: {
          select: { email: true, name: true }
        }
      }
    })
    
    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' })
    }
    
    if (order.userId && order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Доступ запрещён' })
    }
    
    res.json({ order })
  } catch (error) {
    next(error)
  }
})

// Привязка CDEK UUID к заказу (для заказов пользователя/админа)
router.put('/:id/cdek-link', authenticate, async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id)
    const { cdekOrderUuid } = req.body

    if (!cdekOrderUuid || typeof cdekOrderUuid !== 'string') {
      return res.status(400).json({ error: 'Необходимо указать cdekOrderUuid' })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, cdekOrderUuid: true }
    })

    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' })
    }

    if (order.userId && order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Доступ запрещён' })
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { cdekOrderUuid: cdekOrderUuid.trim() }
    })

    res.json({ order: updatedOrder })
  } catch (error) {
    next(error)
  }
})

router.put('/:id/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body
    
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' })
    }
    
    const order = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: { status }
    })
    
    res.json({ order })
  } catch (error) {
    next(error)
  }
})

export default router
