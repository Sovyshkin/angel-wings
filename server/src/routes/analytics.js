import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { encryptMarketingPayload } from '../utils/marketingToken.js'

const router = Router()
const prisma = new PrismaClient()
const TRACKABLE_EVENTS = new Set(['view', 'add_to_cart'])
const SUCCESS_PAYMENT_STATUSES = new Set(['PAID', 'CASH_ON_DELIVERY'])
const DEFAULT_REPEAT_CYCLE_DAYS = 30
const CANCEL_REASON_META = {
  high_price: {
    label: 'Высокая цена',
    action: 'Проверить маржу, запустить акцию или точечный промокод.'
  },
  long_delivery: {
    label: 'Долгая доставка',
    action: 'Проверить тарифы, ПВЗ и SLA логистики по проблемным городам.'
  },
  scheme_mismatch: {
    label: 'Не подошел по схеме приема',
    action: 'Добавить понятное описание курса, длительности и перерывов в карточку.'
  },
  changed_mind: {
    label: 'Передумал принимать пептиды',
    action: 'Запустить ремаркетинг с объяснением, почему стоит продолжить.'
  },
  other: {
    label: 'Другое',
    action: 'Разобрать вручную и уточнить причину у клиента.'
  },
  unknown: {
    label: 'Причина не указана',
    action: 'При отмене заказа обязательно выбирать причину, чтобы отчет был точным.'
  }
}

function parseDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function startOfDaysAgo(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date, count) {
  return new Date(date.getFullYear(), date.getMonth() + count, 1)
}

function getMonthKey(date) {
  const parsed = new Date(date)
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`
}

function getDayKey(date) {
  const parsed = new Date(date)
  return parsed.toISOString().slice(0, 10)
}

function getMonthName(monthIndex) {
  return new Intl.DateTimeFormat('ru-RU', { month: 'long' }).format(new Date(2026, monthIndex, 1))
}

function toMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100
}

function normalizeRepeatCycleDays(value) {
  const days = Number.parseInt(value, 10)
  return Number.isFinite(days) && days > 0 ? days : DEFAULT_REPEAT_CYCLE_DAYS
}

function slugifyMarketingValue(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'e')
    .replace(/[^a-z0-9а-я]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'event'
}

function buildMarketingCampaign({ title, channel }) {
  const base = slugifyMarketingValue(`${channel || 'marketing'}-${title}`)
  const suffix = Date.now().toString(36)
  return `aw-${base}-${suffix}`.slice(0, 160)
}

function getMarketingSiteBaseUrl() {
  return (process.env.CLIENT_URL || process.env.TOCHKA_REDIRECT_BASE_URL || 'https://angel-wings.ru').replace(/\/$/, '')
}

function buildMarketingLink(event) {
  const baseUrl = getMarketingSiteBaseUrl()
  const url = new URL(baseUrl)
  url.searchParams.set('aw_m', encryptMarketingPayload({
    utm_source: event.utmSource || event.channel || 'angel_wings',
    utm_medium: event.type || 'campaign',
    utm_campaign: event.utmCampaign,
    utm_content: `event_${event.id}`
  }))
  return url.toString()
}

function getOrderItemRevenue(item) {
  return Number(item.price || 0) * Number(item.quantity || 0)
}

function normalizeOrderStatus(status) {
  return String(status || '').trim().toUpperCase()
}

function daysBetween(from, to = new Date()) {
  const fromDate = new Date(from || 0)
  if (Number.isNaN(fromDate.getTime())) return 0
  return Math.floor((to.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))
}

function getCustomerKey(order) {
  return order.userId ? `user:${order.userId}` : `email:${String(order.customerEmail || '').toLowerCase()}`
}

function getCustomerLabel(order) {
  return order.customerName || order.user?.name || 'Клиент без имени'
}

function getCoefficientOfVariation(values) {
  const nonEmpty = values.map(value => Number(value || 0))
  if (!nonEmpty.length) return 0
  const mean = nonEmpty.reduce((sum, value) => sum + value, 0) / nonEmpty.length
  if (mean === 0) return null
  const variance = nonEmpty.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / nonEmpty.length
  return Math.sqrt(variance) / mean
}

function getXyzClass(coefficient, activeMonths) {
  if (coefficient === null || activeMonths <= 1) return 'Z'
  if (coefficient <= 0.5) return 'X'
  if (coefficient <= 1) return 'Y'
  return 'Z'
}

function getXyzMeaning(xyzClass) {
  if (xyzClass === 'X') return 'стабильный спрос, закупать ритмично'
  if (xyzClass === 'Y') return 'умеренно плавающий спрос, закупать осторожно'
  return 'непредсказуемый спрос, лучше под предзаказ'
}

function normalizeCancelReason(reason) {
  const key = String(reason || '').trim()
  return CANCEL_REASON_META[key] ? key : (key ? 'other' : 'unknown')
}

function emptyMoneyMetric(key, label = key) {
  return { key, label, revenue: 0, orders: 0, units: 0 }
}

function getAcquiringFee(order) {
  if (Number.isFinite(Number(order?.acquiringFee))) {
    return Math.max(0, Number(order.acquiringFee))
  }

  const paymentStatus = normalizeOrderStatus(order?.paymentStatus)
  if (!SUCCESS_PAYMENT_STATUSES.has(paymentStatus) || paymentStatus === 'CASH_ON_DELIVERY') {
    return 0
  }

  const percent = Math.max(0, Number.parseFloat(process.env.ACQUIRING_FEE_PERCENT || '2.7') || 0)
  const fixed = Math.max(0, Number.parseFloat(process.env.ACQUIRING_FEE_FIXED || '0') || 0)
  return toMoney((Number(order?.total || 0) * percent) / 100 + fixed)
}

function getSellerDeliveryCost(order) {
  if (Number.isFinite(Number(order?.deliveryCost))) {
    return Math.max(0, Number(order.deliveryCost))
  }

  const sellerPaysDelivery = String(process.env.ANALYTICS_SELLER_PAYS_DELIVERY || '').toLowerCase() === 'true'
  return sellerPaysDelivery ? Math.max(0, Number(order?.deliveryPrice || 0)) : 0
}

function getAttributionChannel(order) {
  return String(order?.utmSource || order?.utmCampaign || 'Прямые / без UTM').trim() || 'Прямые / без UTM'
}

function calculateOrderMargin(order) {
  const productCost = (order.items || []).reduce((sum, item) => {
    const unitCost = Math.max(0, Number(item.product?.costPrice || 0))
    return sum + unitCost * Math.max(0, Number(item.quantity || 0))
  }, 0)
  const acquiringFee = getAcquiringFee(order)
  const deliveryCost = getSellerDeliveryCost(order)
  const partnerBonus = Math.max(0, Number(order.partnerBonusAmount || 0))
  const partnerCommission = Math.max(0, Number(order.commission?.amount || 0))
  const bonuses = partnerBonus + partnerCommission
  const revenue = Math.max(0, Number(order.total || 0))
  const netProfit = revenue - productCost - acquiringFee - deliveryCost - bonuses

  return {
    revenue: toMoney(revenue),
    productCost: toMoney(productCost),
    acquiringFee: toMoney(acquiringFee),
    deliveryCost: toMoney(deliveryCost),
    bonuses: toMoney(bonuses),
    partnerBonus: toMoney(partnerBonus),
    partnerCommission: toMoney(partnerCommission),
    netProfit: toMoney(netProfit),
    marginRate: revenue > 0 ? toMoney((netProfit / revenue) * 100) : 0
  }
}

function startOfDayOffset(daysOffset = 0) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + daysOffset)
  return date
}

function addDays(date, days) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function addDaysToNow(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date
}

function getActionPriorityScore(action) {
  const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 }
  return priorityWeight[action.priority] || 0
}

function buildActionId(type, payload = {}) {
  const parts = [type, payload.productId, payload.customerKey, payload.orderId]
    .filter(value => value !== undefined && value !== null && value !== '')
  return parts.join(':')
}

function buildSupplierOrderText(action) {
  const payload = action.payload || {}
  return [
    `Заявка поставщику: ${action.title}`,
    `Текущий остаток: ${payload.currentStock || 0} шт.`,
    `Продажи за 14 дней: ${payload.units14 || 0} шт.`,
    `Сезонный коэффициент: ${payload.seasonalityFactor || 1}`,
    `Рекомендуемый заказ: ${payload.suggestedQuantity || 0} шт.`
  ].join('\n')
}

function buildReviewRequestText(action) {
  const payload = action.payload || {}
  return [
    `Здравствуйте! Поделитесь, пожалуйста, отзывом о препарате ${payload.productTitle || ''}.`,
    'Ваш опыт поможет нам точнее подбирать продукты и улучшать описания курсов.',
    'Спасибо, команда Angel Wings.'
  ].join('\n')
}

router.post('/product-event', async (req, res, next) => {
  try {
    const productId = Number.parseInt(req.body?.productId, 10)
    const event = String(req.body?.event || '').trim()

    if (!Number.isFinite(productId) || productId <= 0) {
      return res.status(400).json({ error: 'Некорректный товар' })
    }

    if (!TRACKABLE_EVENTS.has(event)) {
      return res.status(400).json({ error: 'Некорректное событие аналитики' })
    }

    const quantity = req.body?.quantity !== undefined
      ? Math.max(1, Number.parseInt(req.body.quantity, 10) || 1)
      : null

    await prisma.productAnalyticsEvent.create({
      data: {
        productId,
        event,
        sessionId: String(req.body?.sessionId || '').slice(0, 128) || null,
        source: String(req.body?.source || '').slice(0, 80) || null,
        quantity,
        userId: req.user?.id || null
      }
    })

    res.status(202).json({ ok: true })
  } catch (error) {
    // Analytics must never break the storefront.
    console.error('[ANALYTICS] product-event failed:', error?.message || error)
    res.status(202).json({ ok: false, skipped: true })
  }
})

router.get('/products', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const days = Math.max(7, Math.min(365, Number.parseInt(req.query.days, 10) || 30))
    const periodStart = startOfDaysAgo(days)
    const previousStart = startOfDaysAgo(days * 2)
    const from = parseDate(req.query.from) || null
    const to = parseDate(req.query.to) || null
    const orderDateFilter = {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {})
    }

    const products = await prisma.product.findMany({
      include: {
        categories: { select: { name: true, slug: true } }
      },
      orderBy: { title: 'asc' }
    })

    const [orderItems, periodEvents] = await Promise.all([
      prisma.orderItem.findMany({
        where: Object.keys(orderDateFilter).length
          ? { order: { createdAt: orderDateFilter } }
          : {},
        include: {
          product: { select: { id: true, title: true } },
          order: {
            select: {
              id: true,
              total: true,
              status: true,
              paymentStatus: true,
              createdAt: true,
              items: {
                include: { product: { select: { id: true, title: true } } }
              }
            }
          }
        }
      }),
      prisma.productAnalyticsEvent.findMany({
        where: {
          createdAt: { gte: periodStart },
          event: { in: ['view', 'add_to_cart'] }
        },
        select: {
          productId: true,
          event: true,
          quantity: true,
          createdAt: true
        }
      })
    ])

    const metricsByProduct = new Map(products.map(product => [product.id, {
      productId: product.id,
      title: product.title,
      sku: product.sku,
      stock: product.stock,
      active: product.active,
      categories: product.categories,
      views: 0,
      cartAdds: 0,
      orderedUnits: 0,
      successfulUnits: 0,
      cancelledUnits: 0,
      ordersCount: 0,
      successfulOrders: 0,
      cancelledOrders: 0,
      ltv: 0,
      revenue: 0,
      periodUnits: 0,
      previousPeriodUnits: 0,
      orderTotals: [],
      successfulOrderTotals: [],
      combos: new Map()
    }]))

    for (const event of periodEvents) {
      const metric = metricsByProduct.get(event.productId)
      if (!metric) continue
      if (event.event === 'view') metric.views += 1
      if (event.event === 'add_to_cart') metric.cartAdds += Math.max(1, Number(event.quantity || 1))
    }

    const seenOrderProduct = new Set()
    for (const item of orderItems) {
      const productId = item.productId
      const metric = metricsByProduct.get(productId)
      if (!metric) continue

      const orderStatus = normalizeOrderStatus(item.order?.status)
      const paymentStatus = normalizeOrderStatus(item.order?.paymentStatus)
      const isCancelled = orderStatus === 'CANCELLED'
      const isSuccessful = !isCancelled && SUCCESS_PAYMENT_STATUSES.has(paymentStatus)
      const quantity = Number(item.quantity || 0)
      const revenue = getOrderItemRevenue(item)
      const orderKey = `${item.orderId}:${productId}`

      metric.orderedUnits += quantity
      if (!seenOrderProduct.has(orderKey)) {
        metric.ordersCount += 1
        metric.orderTotals.push(Number(item.order?.total || 0))
        seenOrderProduct.add(orderKey)
      }

      if (isCancelled) {
        metric.cancelledUnits += quantity
        metric.cancelledOrders += 1
      }

      if (isSuccessful) {
        metric.ltv += revenue
        metric.revenue += revenue
        metric.successfulUnits += quantity
        metric.successfulOrders += 1
        metric.successfulOrderTotals.push(Number(item.order?.total || 0))
      }

      const createdAt = new Date(item.order?.createdAt || 0)
      if (isSuccessful && createdAt >= periodStart) metric.periodUnits += quantity
      if (isSuccessful && createdAt >= previousStart && createdAt < periodStart) metric.previousPeriodUnits += quantity

      const relatedItems = Array.isArray(item.order?.items) ? item.order.items : []
      for (const related of relatedItems) {
        if (related.productId === productId) continue
        const relatedTitle = related.product?.title || `Товар #${related.productId}`
        metric.combos.set(relatedTitle, (metric.combos.get(relatedTitle) || 0) + 1)
      }
    }

    const rows = [...metricsByProduct.values()].map(metric => {
      const velocityPerDay = metric.periodUnits / days
      const velocityPerWeek = velocityPerDay * 7
      const previousVelocityPerDay = metric.previousPeriodUnits / days
      const velocityDelta = previousVelocityPerDay > 0
        ? ((velocityPerDay - previousVelocityPerDay) / previousVelocityPerDay) * 100
        : (velocityPerDay > 0 ? 100 : 0)
      const daysLeft = velocityPerDay > 0 ? metric.stock / velocityPerDay : null
      const avgCheck = metric.successfulOrderTotals.length
        ? metric.successfulOrderTotals.reduce((sum, value) => sum + value, 0) / metric.successfulOrderTotals.length
        : 0
      const viewToCart = metric.views > 0 ? (metric.cartAdds / metric.views) * 100 : null
      const cartToOrder = metric.cartAdds > 0 ? (metric.ordersCount / metric.cartAdds) * 100 : null
      const orderCancelRate = metric.ordersCount > 0 ? (metric.cancelledOrders / metric.ordersCount) * 100 : 0
      const topCombos = [...metric.combos.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([title, count]) => ({ title, count }))

      return {
        productId: metric.productId,
        title: metric.title,
        sku: metric.sku,
        stock: metric.stock,
        active: metric.active,
        categories: metric.categories,
        views: metric.views,
        cartAdds: metric.cartAdds,
        orderedUnits: metric.orderedUnits,
        successfulUnits: metric.successfulUnits,
        cancelledUnits: metric.cancelledUnits,
        ordersCount: metric.ordersCount,
        successfulOrders: metric.successfulOrders,
        cancelledOrders: metric.cancelledOrders,
        velocityPerDay: toMoney(velocityPerDay),
        velocityPerWeek: toMoney(velocityPerWeek),
        velocityDelta: toMoney(velocityDelta),
        daysLeft: daysLeft === null ? null : toMoney(daysLeft),
        reorderSignal: daysLeft !== null && daysLeft <= 14,
        avgCheck: toMoney(avgCheck),
        ltv: toMoney(metric.ltv),
        revenue: toMoney(metric.revenue),
        funnel: {
          views: metric.views,
          cartAdds: metric.cartAdds,
          successfulOrders: metric.successfulOrders,
          cancelledOrders: metric.cancelledOrders,
          viewToCart: viewToCart === null ? null : toMoney(viewToCart),
          cartToOrder: cartToOrder === null ? null : toMoney(cartToOrder),
          orderCancelRate: toMoney(orderCancelRate)
        },
        topCombos
      }
    }).sort((a, b) => b.ltv - a.ltv)

    const summary = rows.reduce((acc, row) => {
      acc.ltv += row.ltv
      acc.units += row.successfulUnits
      acc.orders += row.successfulOrders
      if (row.reorderSignal) acc.reorderSignals += 1
      return acc
    }, { ltv: 0, units: 0, orders: 0, reorderSignals: 0 })

    res.json({
      days,
      summary: {
        ...summary,
        ltv: toMoney(summary.ltv)
      },
      products: rows
    })
  } catch (error) {
    next(error)
  }
})

router.get('/stock', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const now = new Date()
    const velocityDays = 30
    const xyzDays = 180
    const velocityStart = startOfDaysAgo(velocityDays)
    const xyzStart = startOfDaysAgo(xyzDays)

    const products = await prisma.product.findMany({
      select: {
        id: true,
        title: true,
        sku: true,
        price: true,
        comparePrice: true,
        stock: true,
        active: true,
        updatedAt: true,
        categories: { select: { name: true } }
      },
      orderBy: { title: 'asc' }
    })

    const orderItems = await prisma.orderItem.findMany({
      where: {
        order: {
          status: { not: 'CANCELLED' },
          paymentStatus: { in: [...SUCCESS_PAYMENT_STATUSES] }
        }
      },
      include: {
        order: { select: { id: true, createdAt: true } },
        product: { select: { id: true, title: true } }
      }
    })

    const metrics = new Map(products.map(product => [product.id, {
      productId: product.id,
      title: product.title,
      sku: product.sku,
      price: Number(product.price || 0),
      comparePrice: product.comparePrice,
      stock: Number(product.stock || 0),
      active: product.active,
      categories: product.categories,
      revenue: 0,
      units: 0,
      periodUnits: 0,
      lastSoldAt: null,
      monthlyUnits: new Array(6).fill(0)
    }]))

    for (const item of orderItems) {
      const metric = metrics.get(item.productId)
      if (!metric) continue

      const quantity = Number(item.quantity || 0)
      const revenue = getOrderItemRevenue(item)
      const soldAt = new Date(item.order?.createdAt || 0)

      metric.revenue += revenue
      metric.units += quantity
      if (!metric.lastSoldAt || soldAt > metric.lastSoldAt) metric.lastSoldAt = soldAt
      if (soldAt >= velocityStart) metric.periodUnits += quantity

      if (soldAt >= xyzStart) {
        const monthIndex = Math.min(5, Math.floor(daysBetween(soldAt, now) / 30))
        metric.monthlyUnits[5 - monthIndex] += quantity
      }
    }

    const rowsBase = [...metrics.values()].sort((a, b) => b.revenue - a.revenue)
    const totalRevenue = rowsBase.reduce((sum, item) => sum + item.revenue, 0)
    let cumulativeRevenue = 0

    const rows = rowsBase.map(item => {
      cumulativeRevenue += item.revenue
      const revenueShare = totalRevenue > 0 ? (item.revenue / totalRevenue) * 100 : 0
      const cumulativeShare = totalRevenue > 0 ? (cumulativeRevenue / totalRevenue) * 100 : 0
      const abcClass = cumulativeShare <= 80 ? 'A' : (cumulativeShare <= 95 ? 'B' : 'C')
      const coefficient = getCoefficientOfVariation(item.monthlyUnits)
      const activeMonths = item.monthlyUnits.filter(value => value > 0).length
      const xyzClass = getXyzClass(coefficient, activeMonths)
      const velocityPerDay = item.periodUnits / velocityDays
      const daysLeft = velocityPerDay > 0 ? item.stock / velocityPerDay : null
      const daysSinceLastSale = item.lastSoldAt ? daysBetween(item.lastSoldAt, now) : null
      const isDeadStock = !item.lastSoldAt || daysSinceLastSale > 90
      const recommendation = abcClass === 'A' && xyzClass === 'X'
        ? 'купить много и заранее'
        : abcClass === 'A'
          ? 'держать высокий остаток, но проверять спрос'
          : abcClass === 'C' && xyzClass === 'Z'
            ? 'минимальная закупка или под предзаказ'
            : xyzClass === 'X'
              ? 'закупать ритмично'
              : 'закупать малыми партиями'

      return {
        productId: item.productId,
        title: item.title,
        sku: item.sku,
        price: toMoney(item.price),
        comparePrice: item.comparePrice === null ? null : toMoney(item.comparePrice),
        stock: item.stock,
        active: item.active,
        categories: item.categories,
        revenue: toMoney(item.revenue),
        revenueShare: toMoney(revenueShare),
        cumulativeShare: toMoney(cumulativeShare),
        units: item.units,
        periodUnits: item.periodUnits,
        velocityPerDay: toMoney(velocityPerDay),
        daysLeft: daysLeft === null ? null : toMoney(daysLeft),
        lastSoldAt: item.lastSoldAt,
        daysSinceLastSale,
        abcClass,
        xyzClass,
        abcXyz: `${abcClass}+${xyzClass}`,
        xyzCoefficient: coefficient === null ? null : toMoney(coefficient),
        xyzMeaning: getXyzMeaning(xyzClass),
        recommendation,
        isDeadStock,
        reorderSignal: daysLeft !== null && daysLeft <= 14,
        monthlyUnits: item.monthlyUnits
      }
    })

    const goldenShelf = rows
      .filter(item => item.revenue > 0)
      .sort((a, b) => {
        if (a.abcClass !== b.abcClass) return a.abcClass.localeCompare(b.abcClass)
        return b.velocityPerDay - a.velocityPerDay
      })
      .slice(0, 12)

    const deadStock = rows
      .filter(item => item.isDeadStock)
      .sort((a, b) => (b.daysSinceLastSale ?? 9999) - (a.daysSinceLastSale ?? 9999))

    res.json({
      summary: {
        totalProducts: rows.length,
        stockUnits: rows.reduce((sum, item) => sum + item.stock, 0),
        goldenShelf: goldenShelf.length,
        deadStock: deadStock.length,
        reorderSignals: rows.filter(item => item.reorderSignal).length,
        aProducts: rows.filter(item => item.abcClass === 'A').length,
        xProducts: rows.filter(item => item.xyzClass === 'X').length
      },
      goldenShelf,
      abcXyz: rows,
      deadStock
    })
  } catch (error) {
    next(error)
  }
})

router.get('/cancellations', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const days = Math.max(7, Math.min(365, Number.parseInt(req.query.days, 10) || 90))
    const periodStart = startOfDaysAgo(days)

    const orders = await prisma.order.findMany({
      where: {
        status: 'CANCELLED',
        createdAt: { gte: periodStart }
      },
      include: {
        items: {
          include: {
            product: { select: { id: true, title: true } }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })

    const reasonMap = new Map(Object.entries(CANCEL_REASON_META).map(([key, meta]) => [key, {
      key,
      ...meta,
      orders: 0,
      lostRevenue: 0,
      units: 0,
      products: new Map()
    }]))

    for (const order of orders) {
      const key = normalizeCancelReason(order.cancelReason)
      const item = reasonMap.get(key) || reasonMap.get('other')
      item.orders += 1
      item.lostRevenue += Number(order.total || 0)

      for (const orderItem of order.items || []) {
        const quantity = Number(orderItem.quantity || 0)
        item.units += quantity
        const title = orderItem.product?.title || `Товар #${orderItem.productId}`
        item.products.set(title, (item.products.get(title) || 0) + quantity)
      }
    }

    const reasons = [...reasonMap.values()]
      .map(reason => ({
        key: reason.key,
        label: reason.label,
        action: reason.action,
        orders: reason.orders,
        units: reason.units,
        lostRevenue: toMoney(reason.lostRevenue),
        share: orders.length ? toMoney((reason.orders / orders.length) * 100) : 0,
        topProducts: [...reason.products.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([title, count]) => ({ title, count }))
      }))
      .sort((a, b) => b.orders - a.orders)

    res.json({
      summary: {
        days,
        cancelledOrders: orders.length,
        lostRevenue: toMoney(orders.reduce((sum, order) => sum + Number(order.total || 0), 0)),
        topReason: reasons.find(reason => reason.orders > 0) || null
      },
      reasons,
      recentOrders: orders.slice(0, 50).map(order => ({
        id: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        total: toMoney(order.total),
        cancelReason: normalizeCancelReason(order.cancelReason),
        cancelReasonLabel: CANCEL_REASON_META[normalizeCancelReason(order.cancelReason)].label,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items: (order.items || []).map(item => ({
          title: item.product?.title || `Товар #${item.productId}`,
          quantity: item.quantity
        }))
      }))
    })
  } catch (error) {
    next(error)
  }
})

router.get('/trends', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const now = new Date()
    const currentMonthStart = startOfMonth(now)
    const rangeStart = addMonths(currentMonthStart, -23)
    const eventRangeStart = addMonths(currentMonthStart, -12)

    const [orders, marketingEvents] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: { not: 'CANCELLED' },
          paymentStatus: { in: [...SUCCESS_PAYMENT_STATUSES] },
          createdAt: { gte: rangeStart }
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  categories: { select: { id: true, name: true, slug: true } }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' }
      }),
      prisma.marketingEvent.findMany({
        where: { eventDate: { gte: eventRangeStart } },
        orderBy: { eventDate: 'desc' }
      })
    ])

    const monthlyMap = new Map()
    const dayMap = new Map()
    const categoryMonthMap = new Map()

    for (let i = 0; i < 24; i += 1) {
      const date = addMonths(rangeStart, i)
      monthlyMap.set(getMonthKey(date), emptyMoneyMetric(getMonthKey(date), getMonthName(date.getMonth())))
    }

    for (const order of orders) {
      const monthKey = getMonthKey(order.createdAt)
      const dayKey = getDayKey(order.createdAt)
      const monthly = monthlyMap.get(monthKey) || emptyMoneyMetric(monthKey)
      monthly.revenue += Number(order.total || 0)
      monthly.orders += 1
      monthlyMap.set(monthKey, monthly)

      const day = dayMap.get(dayKey) || emptyMoneyMetric(dayKey)
      day.revenue += Number(order.total || 0)
      day.orders += 1
      dayMap.set(dayKey, day)

      for (const item of order.items || []) {
        const quantity = Number(item.quantity || 0)
        const revenue = getOrderItemRevenue(item)
        monthly.units += quantity
        day.units += quantity

        const categories = item.product?.categories?.length
          ? item.product.categories
          : [{ id: 0, name: 'Без категории', slug: 'uncategorized' }]

        for (const category of categories) {
          const key = `${category.id}:${new Date(order.createdAt).getMonth()}`
          const metric = categoryMonthMap.get(key) || {
            categoryId: category.id,
            categoryName: category.name,
            categorySlug: category.slug,
            month: new Date(order.createdAt).getMonth(),
            revenue: 0,
            units: 0,
            orders: new Set()
          }
          metric.revenue += revenue
          metric.units += quantity
          metric.orders.add(order.id)
          categoryMonthMap.set(key, metric)
        }
      }
    }

    const monthly = [...monthlyMap.values()].map(item => ({
      ...item,
      revenue: toMoney(item.revenue)
    }))

    const currentYear = now.getFullYear()
    const monthComparison = Array.from({ length: 12 }, (_, monthIndex) => {
      const currentKey = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}`
      const previousKey = `${currentYear - 1}-${String(monthIndex + 1).padStart(2, '0')}`
      const current = monthlyMap.get(currentKey) || emptyMoneyMetric(currentKey)
      const previous = monthlyMap.get(previousKey) || emptyMoneyMetric(previousKey)
      const yoy = previous.revenue > 0 ? ((current.revenue - previous.revenue) / previous.revenue) * 100 : (current.revenue > 0 ? 100 : 0)

      return {
        month: monthIndex + 1,
        label: getMonthName(monthIndex),
        currentRevenue: toMoney(current.revenue),
        previousRevenue: toMoney(previous.revenue),
        currentOrders: current.orders,
        previousOrders: previous.orders,
        yoy: toMoney(yoy)
      }
    })

    const recentMonths = monthly.slice(-6)
    const last3 = recentMonths.slice(-3)
    const avgRevenue = last3.length
      ? last3.reduce((sum, item) => sum + item.revenue, 0) / last3.length
      : 0
    const previous3 = recentMonths.slice(0, 3)
    const prevAvgRevenue = previous3.length
      ? previous3.reduce((sum, item) => sum + item.revenue, 0) / previous3.length
      : 0
    const growthRate = prevAvgRevenue > 0 ? Math.max(-0.4, Math.min(0.6, (avgRevenue - prevAvgRevenue) / prevAvgRevenue)) : 0
    const forecast = Array.from({ length: 3 }, (_, index) => {
      const date = addMonths(currentMonthStart, index + 1)
      const predictedRevenue = avgRevenue * Math.pow(1 + growthRate, index + 1)
      const predictedOrders = last3.length
        ? last3.reduce((sum, item) => sum + item.orders, 0) / last3.length
        : 0

      return {
        key: getMonthKey(date),
        label: `${getMonthName(date.getMonth())} ${date.getFullYear()}`,
        predictedRevenue: toMoney(predictedRevenue),
        predictedOrders: Math.round(predictedOrders * Math.pow(1 + growthRate, index + 1)),
        growthRate: toMoney(growthRate * 100)
      }
    })

    const categoryTotals = new Map()
    for (const metric of categoryMonthMap.values()) {
      const total = categoryTotals.get(metric.categoryId) || { revenue: 0, units: 0 }
      total.revenue += metric.revenue
      total.units += metric.units
      categoryTotals.set(metric.categoryId, total)
    }

    const nextMonths = Array.from({ length: 4 }, (_, index) => addMonths(currentMonthStart, index).getMonth())
    const seasonalHighlights = [...categoryMonthMap.values()]
      .map(metric => {
        const total = categoryTotals.get(metric.categoryId) || { revenue: 0, units: 0 }
        const avgMonthRevenue = total.revenue / 12
        const lift = avgMonthRevenue > 0 ? ((metric.revenue - avgMonthRevenue) / avgMonthRevenue) * 100 : 0
        return {
          categoryId: metric.categoryId,
          categoryName: metric.categoryName,
          categorySlug: metric.categorySlug,
          month: metric.month + 1,
          monthName: getMonthName(metric.month),
          revenue: toMoney(metric.revenue),
          units: metric.units,
          orders: metric.orders.size,
          lift: toMoney(lift),
          upcoming: nextMonths.includes(metric.month)
        }
      })
      .filter(item => item.revenue > 0 && item.lift >= 25)
      .sort((a, b) => Number(b.upcoming) - Number(a.upcoming) || b.lift - a.lift)
      .slice(0, 12)

    const eventImpacts = marketingEvents.map(event => {
      const eventDate = new Date(event.eventDate)
      const previousDays = [1, 2, 3, 4, 5, 6, 7].map(offset => {
        const date = new Date(eventDate)
        date.setDate(date.getDate() - offset)
        return dayMap.get(getDayKey(date)) || emptyMoneyMetric(getDayKey(date))
      })
      const avgBefore = previousDays.reduce((sum, item) => sum + item.revenue, 0) / previousDays.length
      const attributedOrders = event.utmCampaign
        ? orders.filter(order =>
            String(order.utmCampaign || '').trim().toLowerCase() === String(event.utmCampaign || '').trim().toLowerCase()
          )
        : []
      const attributedRevenue = attributedOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)
      const attributedUnits = attributedOrders.reduce((sum, order) => {
        return sum + (order.items || []).reduce((itemSum, item) => itemSum + Number(item.quantity || 0), 0)
      }, 0)
      const uplift = avgBefore > 0 ? ((attributedRevenue - avgBefore) / avgBefore) * 100 : (attributedRevenue > 0 ? 100 : 0)

      return {
        id: event.id,
        title: event.title,
        type: event.type,
        channel: event.channel,
        cost: toMoney(event.cost),
        utmSource: event.utmSource,
        utmCampaign: event.utmCampaign,
        description: event.description,
        eventDate: event.eventDate,
        link: event.utmCampaign ? buildMarketingLink(event) : null,
        revenue: toMoney(attributedRevenue),
        orders: attributedOrders.length,
        units: attributedUnits,
        avgRevenueBefore: toMoney(avgBefore),
        uplift: toMoney(uplift)
      }
    })

    res.json({
      summary: {
        currentMonthRevenue: toMoney(monthlyMap.get(getMonthKey(now))?.revenue || 0),
        forecastNextMonth: forecast[0]?.predictedRevenue || 0,
        seasonalSignals: seasonalHighlights.length,
        marketingEvents: marketingEvents.length
      },
      monthly,
      monthComparison,
      forecast,
      seasonalHighlights,
      marketingEvents: eventImpacts
    })
  } catch (error) {
    next(error)
  }
})

router.post('/marketing-events', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const title = String(req.body?.title || '').trim()
    const type = String(req.body?.type || 'campaign').trim() || 'campaign'
    const channel = String(req.body?.channel || '').trim().slice(0, 120) || null
    const utmSource = String(req.body?.utmSource || req.body?.utm_source || channel || 'angel_wings').trim().slice(0, 160) || 'angel_wings'
    const requestedCampaign = String(req.body?.utmCampaign || req.body?.utm_campaign || '').trim().slice(0, 160)
    const utmCampaign = requestedCampaign || buildMarketingCampaign({ title, channel })
    const cost = Math.max(0, Number.parseFloat(req.body?.cost) || 0)
    const description = String(req.body?.description || '').trim() || null
    const eventDate = parseDate(req.body?.eventDate)

    if (!title) {
      return res.status(400).json({ error: 'Укажите название события' })
    }

    if (!eventDate) {
      return res.status(400).json({ error: 'Укажите корректную дату события' })
    }

    const event = await prisma.marketingEvent.create({
      data: { title, type, channel, cost, utmSource, utmCampaign, description, eventDate }
    })

    res.status(201).json({ event: { ...event, link: buildMarketingLink(event) } })
  } catch (error) {
    next(error)
  }
})

router.delete('/marketing-events/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const eventId = Number.parseInt(req.params.id, 10)
    if (!Number.isFinite(eventId) || eventId <= 0) {
      return res.status(400).json({ error: 'Некорректное событие' })
    }

    await prisma.marketingEvent.delete({ where: { id: eventId } })
    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

router.patch('/products/:id/price', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const productId = Number.parseInt(req.params.id, 10)
    const nextPrice = Number.parseFloat(req.body?.price)

    if (!Number.isFinite(productId) || productId <= 0) {
      return res.status(400).json({ error: 'Некорректный товар' })
    }

    if (!Number.isFinite(nextPrice) || nextPrice <= 0) {
      return res.status(400).json({ error: 'Укажите корректную цену больше 0' })
    }

    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, price: true, comparePrice: true }
    })

    if (!currentProduct) {
      return res.status(404).json({ error: 'Товар не найден' })
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: {
        price: nextPrice,
        comparePrice: currentProduct.comparePrice || currentProduct.price
      },
      select: {
        id: true,
        title: true,
        price: true,
        comparePrice: true,
        stock: true
      }
    })

    res.json({ product })
  } catch (error) {
    next(error)
  }
})

router.get('/margin', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const days = Math.max(7, Math.min(365, Number.parseInt(req.query.days, 10) || 30))
    const periodStart = startOfDaysAgo(days)

    const [orders, marketingEvents] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: { not: 'CANCELLED' },
          paymentStatus: { in: [...SUCCESS_PAYMENT_STATUSES] },
          createdAt: { gte: periodStart }
        },
        include: {
          commission: { select: { amount: true, percentage: true } },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  sku: true,
                  costPrice: true,
                  categories: { select: { id: true, name: true, slug: true } }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.marketingEvent.findMany({
        where: { eventDate: { gte: periodStart } },
        orderBy: { eventDate: 'desc' }
      })
    ])

    const summary = {
      revenue: 0,
      netProfit: 0,
      productCost: 0,
      acquiringFees: 0,
      deliveryCost: 0,
      bonuses: 0,
      orders: orders.length,
      adSpend: 0
    }
    const channelMap = new Map()
    const productMap = new Map()

    const spendByChannel = new Map()
    for (const event of marketingEvents) {
      const channel = String(event.channel || event.utmSource || event.utmCampaign || 'Без канала').trim()
      const spend = Math.max(0, Number(event.cost || 0))
      spendByChannel.set(channel, (spendByChannel.get(channel) || 0) + spend)
      summary.adSpend += spend
    }

    const orderRows = orders.map(order => {
      const margin = calculateOrderMargin(order)
      const channel = getAttributionChannel(order)
      const channelMetric = channelMap.get(channel) || {
        channel,
        revenue: 0,
        netProfit: 0,
        orders: 0,
        customers: new Set(),
        adSpend: 0
      }

      channelMetric.revenue += margin.revenue
      channelMetric.netProfit += margin.netProfit
      channelMetric.orders += 1
      channelMetric.customers.add(getCustomerKey(order))
      channelMap.set(channel, channelMetric)

      summary.revenue += margin.revenue
      summary.netProfit += margin.netProfit
      summary.productCost += margin.productCost
      summary.acquiringFees += margin.acquiringFee
      summary.deliveryCost += margin.deliveryCost
      summary.bonuses += margin.bonuses

      for (const item of order.items || []) {
        const productId = item.productId
        const quantity = Math.max(0, Number(item.quantity || 0))
        const itemRevenue = getOrderItemRevenue(item)
        const itemCost = Math.max(0, Number(item.product?.costPrice || 0)) * quantity
        const metric = productMap.get(productId) || {
          productId,
          title: item.product?.title || `Товар #${productId}`,
          sku: item.product?.sku || null,
          revenue: 0,
          productCost: 0,
          grossProfit: 0,
          units: 0,
          orders: new Set(),
          customers: new Set()
        }
        metric.revenue += itemRevenue
        metric.productCost += itemCost
        metric.grossProfit += itemRevenue - itemCost
        metric.units += quantity
        metric.orders.add(order.id)
        metric.customers.add(getCustomerKey(order))
        productMap.set(productId, metric)
      }

      return {
        id: order.id,
        createdAt: order.createdAt,
        customerName: order.customerName,
        paymentStatus: order.paymentStatus,
        deliveryName: order.deliveryTariffName,
        channel,
        utm: {
          source: order.utmSource,
          medium: order.utmMedium,
          campaign: order.utmCampaign
        },
        items: (order.items || []).map(item => ({
          productId: item.productId,
          title: item.product?.title || `Товар #${item.productId}`,
          quantity: item.quantity,
          revenue: toMoney(getOrderItemRevenue(item)),
          cost: toMoney(Math.max(0, Number(item.product?.costPrice || 0)) * Math.max(0, Number(item.quantity || 0)))
        })),
        ...margin
      }
    })

    for (const [channel, spend] of spendByChannel.entries()) {
      const metric = channelMap.get(channel) || {
        channel,
        revenue: 0,
        netProfit: 0,
        orders: 0,
        customers: new Set(),
        adSpend: 0
      }
      metric.adSpend = spend
      channelMap.set(channel, metric)
    }

    const channels = [...channelMap.values()]
      .map(metric => ({
        channel: metric.channel,
        revenue: toMoney(metric.revenue),
        netProfit: toMoney(metric.netProfit),
        orders: metric.orders,
        customers: metric.customers.size,
        adSpend: toMoney(metric.adSpend),
        romi: metric.adSpend > 0 ? toMoney(metric.netProfit / metric.adSpend) : null,
        cac: metric.customers.size > 0 ? toMoney(metric.adSpend / metric.customers.size) : null
      }))
      .sort((a, b) => b.netProfit - a.netProfit)

    const totalProductRevenue = [...productMap.values()].reduce((sum, product) => sum + product.revenue, 0)
    const products = [...productMap.values()]
      .map(product => {
        const allocatedSpend = totalProductRevenue > 0 ? summary.adSpend * (product.revenue / totalProductRevenue) : 0
        const customers = product.customers.size
        return {
          productId: product.productId,
          title: product.title,
          sku: product.sku,
          revenue: toMoney(product.revenue),
          productCost: toMoney(product.productCost),
          grossProfit: toMoney(product.grossProfit),
          grossMargin: product.revenue > 0 ? toMoney((product.grossProfit / product.revenue) * 100) : 0,
          units: product.units,
          orders: product.orders.size,
          customers,
          allocatedAdSpend: toMoney(allocatedSpend),
          cac: customers > 0 ? toMoney(allocatedSpend / customers) : null
        }
      })
      .sort((a, b) => b.grossProfit - a.grossProfit)

    res.json({
      summary: {
        ...Object.fromEntries(Object.entries(summary).map(([key, value]) => [key, key === 'orders' ? value : toMoney(value)])),
        marginRate: summary.revenue > 0 ? toMoney((summary.netProfit / summary.revenue) * 100) : 0,
        avgProfitPerOrder: orders.length ? toMoney(summary.netProfit / orders.length) : 0
      },
      channels,
      products,
      orders: orderRows.slice(0, 100),
      assumptions: {
        acquiringFeePercent: Math.max(0, Number.parseFloat(process.env.ACQUIRING_FEE_PERCENT || '2.7') || 0),
        sellerPaysDelivery: String(process.env.ANALYTICS_SELLER_PAYS_DELIVERY || '').toLowerCase() === 'true'
      }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/actions', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const yesterdayStart = startOfDayOffset(-1)
    const todayStart = startOfDayOffset(0)
    const dayBeforeStart = startOfDayOffset(-2)
    const lastMonthSameDayStart = new Date(yesterdayStart)
    lastMonthSameDayStart.setMonth(lastMonthSameDayStart.getMonth() - 1)
    const lastMonthSameDayEnd = addDays(lastMonthSameDayStart, 1)
    const twoWeeksAgo = startOfDaysAgo(14)
    const sixtyDaysAgo = startOfDaysAgo(60)
    const ninetyDaysAgo = startOfDaysAgo(90)

    const [orders, products, events] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: { not: 'CANCELLED' },
          paymentStatus: { in: [...SUCCESS_PAYMENT_STATUSES] },
          createdAt: { gte: ninetyDaysAgo }
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true } },
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  title: true,
                  sku: true,
                  stock: true,
                  price: true,
                  repeatCycleDays: true,
                  categories: { select: { id: true, name: true, slug: true } }
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.findMany({
        where: { active: true },
        include: { categories: { select: { id: true, name: true, slug: true } } },
        orderBy: { stock: 'asc' }
      }),
      prisma.productAnalyticsEvent.findMany({
        where: { createdAt: { gte: ninetyDaysAgo } },
        select: { productId: true, event: true, userId: true, sessionId: true, createdAt: true }
      })
    ])

    const getDayRevenue = (from, to) => {
      const dayOrders = orders.filter(order => {
        const createdAt = new Date(order.createdAt)
        return createdAt >= from && createdAt < to
      })
      return {
        revenue: toMoney(dayOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)),
        orders: dayOrders.length
      }
    }

    const yesterday = getDayRevenue(yesterdayStart, todayStart)
    const dayBefore = getDayRevenue(dayBeforeStart, yesterdayStart)
    const lastMonthSameDay = getDayRevenue(lastMonthSameDayStart, lastMonthSameDayEnd)
    const revenueDelta = dayBefore.revenue > 0
      ? toMoney(((yesterday.revenue - dayBefore.revenue) / dayBefore.revenue) * 100)
      : (yesterday.revenue > 0 ? 100 : 0)

    const productMetrics = new Map(products.map(product => [product.id, {
      productId: product.id,
      title: product.title,
      sku: product.sku,
      stock: product.stock,
      price: product.price,
      repeatCycleDays: normalizeRepeatCycleDays(product.repeatCycleDays),
      categories: product.categories,
      revenue: 0,
      units: 0,
      units14: 0,
      orders: new Set(),
      comboPartners: new Map(),
      buyers: new Set(),
      reviewSignals: 0
    }]))
    const customerMap = new Map()

    for (const order of orders) {
      const customerKey = getCustomerKey(order)
      if (!customerMap.has(customerKey)) {
        customerMap.set(customerKey, {
          customerKey,
          userId: order.userId,
          name: getCustomerLabel(order),
          email: order.customerEmail || order.user?.email || null,
          phone: order.customerPhone || order.user?.phone || null,
          orders: [],
          totalRevenue: 0,
          lastOrderAt: order.createdAt,
          products: new Map()
        })
      }

      const customer = customerMap.get(customerKey)
      customer.orders.push(order)
      customer.totalRevenue += Number(order.total || 0)
      if (new Date(order.createdAt) > new Date(customer.lastOrderAt)) {
        customer.lastOrderAt = order.createdAt
      }

      const orderProducts = (order.items || []).map(item => item.product).filter(Boolean)
      for (const item of order.items || []) {
        const metric = productMetrics.get(item.productId)
        if (!metric) continue
        const quantity = Number(item.quantity || 0)
        const revenue = getOrderItemRevenue(item)
        const orderDate = new Date(order.createdAt)

        metric.revenue += revenue
        metric.units += quantity
        if (orderDate >= twoWeeksAgo) metric.units14 += quantity
        metric.orders.add(order.id)
        metric.buyers.add(customerKey)

        const customerProduct = customer.products.get(item.productId) || {
          productId: item.productId,
          title: item.product?.title || `Товар #${item.productId}`,
          units: 0,
          revenue: 0,
          repeatCycleDays: normalizeRepeatCycleDays(item.product?.repeatCycleDays),
          lastPurchaseAt: order.createdAt
        }
        customerProduct.units += quantity
        customerProduct.revenue += revenue
        if (orderDate > new Date(customerProduct.lastPurchaseAt)) {
          customerProduct.lastPurchaseAt = order.createdAt
        }
        customer.products.set(item.productId, customerProduct)

        for (const partner of orderProducts) {
          if (!partner || partner.id === item.productId) continue
          const combo = metric.comboPartners.get(partner.id) || { productId: partner.id, title: partner.title, count: 0 }
          combo.count += 1
          metric.comboPartners.set(partner.id, combo)
        }
      }
    }

    for (const event of events) {
      if (event.event !== 'review_request') continue
      const metric = productMetrics.get(event.productId)
      if (metric) metric.reviewSignals += 1
    }

    const topProducts = [...productMetrics.values()]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)
      .map(product => ({
        productId: product.productId,
        title: product.title,
        revenue: toMoney(product.revenue),
        units: product.units,
        stock: product.stock
      }))

    const criticalStock = [...productMetrics.values()]
      .filter(product => product.stock < 20)
      .sort((a, b) => a.stock - b.stock || b.units14 - a.units14)
      .slice(0, 10)
      .map(product => ({
        productId: product.productId,
        title: product.title,
        stock: product.stock,
        units14: product.units14,
        daysLeft: product.units14 > 0 ? Math.max(1, Math.floor(product.stock / (product.units14 / 14))) : null
      }))

    const actions = []
    for (const product of productMetrics.values()) {
      const dailyVelocity = product.units14 / 14
      const seasonalityFactor = product.categories?.some(category => /иммун|стресс|мозг/i.test(category.name)) ? 1.2 : 1
      const suggestedQuantity = Math.max(0, Math.ceil((dailyVelocity * 14 * seasonalityFactor) + 20 - product.stock))

      if (product.stock < 20 || (dailyVelocity > 0 && product.stock / dailyVelocity <= 14)) {
        actions.push({
          id: buildActionId('supplier_order', { productId: product.productId }),
          type: 'supplier_order',
          priority: product.stock < 10 ? 'critical' : 'high',
          title: `Закупить ${product.title}`,
          description: `Остаток ${product.stock} шт., продажи за 14 дней: ${product.units14} шт. Рекомендуемый заказ: ${suggestedQuantity} шт.`,
          buttonLabel: 'Сформировать заказ поставщику',
          payload: {
            productId: product.productId,
            productTitle: product.title,
            currentStock: product.stock,
            units14: product.units14,
            seasonalityFactor,
            suggestedQuantity
          }
        })
      }

      const topCombo = [...product.comboPartners.values()].sort((a, b) => b.count - a.count)[0]
      if (topCombo && topCombo.count >= 2) {
        actions.push({
          id: buildActionId('course_combo', { productId: product.productId, orderId: topCombo.productId }),
          type: 'course_combo',
          priority: 'medium',
          title: `Проверить схему ${product.title} + ${topCombo.title}`,
          description: `Набор встречался ${topCombo.count} раз. Можно добавить блок “следующий шаг курса” и отслеживать докупку капсул.`,
          buttonLabel: 'Сформировать гипотезу курса',
          payload: {
            productId: product.productId,
            productTitle: product.title,
            comboProductId: topCombo.productId,
            comboProductTitle: topCombo.title,
            count: topCombo.count
          }
        })
      }

      const reviewRate = product.buyers.size > 0 ? (product.reviewSignals / product.buyers.size) * 100 : 0
      if (product.buyers.size >= 3 && reviewRate < 15) {
        actions.push({
          id: buildActionId('review_request', { productId: product.productId }),
          type: 'review_request',
          priority: 'medium',
          title: `Запросить отзывы по ${product.title}`,
          description: `Купили ${product.buyers.size} клиентов, сигналов отзывов мало. Запустите запрос через 10 дней после получения.`,
          buttonLabel: 'Подготовить запрос отзыва',
          payload: {
            productId: product.productId,
            productTitle: product.title,
            buyers: product.buyers.size,
            reviewRate: toMoney(reviewRate)
          }
        })
      }
    }

    const repeatCandidates = [...customerMap.values()]
      .map(customer => {
        const lastOrder = customer.orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
        const daysSinceLastOrder = daysBetween(customer.lastOrderAt)
        const bestProduct = [...customer.products.values()].sort((a, b) => b.revenue - a.revenue)[0]
        const repeatCycleDays = normalizeRepeatCycleDays(bestProduct?.repeatCycleDays)
        const probability = Math.min(98, Math.round(
          35 +
          (daysSinceLastOrder >= Math.max(7, repeatCycleDays - 7) && daysSinceLastOrder <= repeatCycleDays + 30 ? 25 : 0) +
          Math.min(25, customer.totalRevenue / 4000) +
          Math.min(13, customer.orders.length * 3)
        ))
        return {
          customerKey: customer.customerKey,
          userId: customer.userId,
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          lastOrderAt: customer.lastOrderAt,
          daysSinceLastOrder,
          totalRevenue: toMoney(customer.totalRevenue),
          ordersCount: customer.orders.length,
          probability,
          repeatCycleDays,
          product: bestProduct,
          lastOrderId: lastOrder?.id || null
        }
      })
      .filter(candidate => candidate.product && candidate.daysSinceLastOrder >= Math.max(7, candidate.repeatCycleDays - 7))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 12)

    for (const candidate of repeatCandidates.slice(0, 5)) {
      actions.push({
        id: buildActionId('personal_discount', { customerKey: candidate.customerKey, productId: candidate.product.productId }),
        type: 'personal_discount',
        priority: candidate.probability >= 75 ? 'high' : 'medium',
        title: `Вернуть ${candidate.name}`,
        description: `${candidate.daysSinceLastOrder} дней без заказа. Раньше брал(а) ${candidate.product.title}. Цикл: ${candidate.repeatCycleDays} дней. Вероятность повтора: ${candidate.probability}%.`,
        buttonLabel: 'Создать скидку 15%',
        payload: {
          customerKey: candidate.customerKey,
          userId: candidate.userId,
          customerName: candidate.name,
          customerEmail: candidate.email,
          productId: candidate.product.productId,
          productTitle: candidate.product.title,
          discountValue: 15
        }
      })
    }

    const sortedActions = actions
      .sort((a, b) => getActionPriorityScore(b) - getActionPriorityScore(a))
      .slice(0, 16)

    res.json({
      morning: {
        yesterday,
        dayBefore,
        lastMonthSameDay,
        revenueDelta,
        topProducts,
        criticalStock,
        repeatCandidates
      },
      actions: sortedActions
    })
  } catch (error) {
    next(error)
  }
})

router.post('/actions/:type', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const actionType = String(req.params.type || '').trim()
    const payload = req.body?.payload && typeof req.body.payload === 'object' ? req.body.payload : {}

    if (actionType === 'personal_discount') {
      const discountValue = Math.max(1, Math.min(80, Number(payload.discountValue || 15) || 15))
      const code = `RETURN${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`
      const promoCode = await prisma.promoCode.create({
        data: {
          code,
          discountType: 'percentage',
          discountValue,
          usageType: 'single',
          maxActivations: 1,
          isFirstPurchase: false,
          isActive: true,
          endDate: addDaysToNow(14)
        }
      })

      return res.status(201).json({
        ok: true,
        message: `Создан одноразовый промокод ${promoCode.code} на ${discountValue}% сроком на 14 дней.`,
        promoCode
      })
    }

    if (actionType === 'supplier_order') {
      return res.json({
        ok: true,
        message: 'Черновик заявки поставщику сформирован.',
        draft: buildSupplierOrderText({ payload, title: payload.productTitle || 'препарат' })
      })
    }

    if (actionType === 'review_request') {
      return res.json({
        ok: true,
        message: 'Текст запроса отзыва подготовлен.',
        draft: buildReviewRequestText({ payload })
      })
    }

    if (actionType === 'course_combo') {
      return res.json({
        ok: true,
        message: 'Гипотеза курса подготовлена.',
        draft: `Проверить связку: ${payload.productTitle || 'Пептид A'} + ${payload.comboProductTitle || 'Пептид B'}. Добавить в карточки блок “следующий шаг курса” и отслеживать докупку по индивидуальному циклу товара.`
      })
    }

    res.status(400).json({ error: 'Неизвестное действие' })
  } catch (error) {
    next(error)
  }
})

router.get('/customers', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const now = new Date()

    const orders = await prisma.order.findMany({
      where: {
        status: { not: 'CANCELLED' },
        paymentStatus: { in: [...SUCCESS_PAYMENT_STATUSES] }
      },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        items: {
          include: {
            product: { select: { id: true, title: true, sku: true, repeatCycleDays: true } }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    const customers = new Map()
    const retentionByProduct = new Map()
    const lastProductPurchases = new Map()

    for (const order of orders) {
      const key = getCustomerKey(order)
      if (!customers.has(key)) {
        customers.set(key, {
          key,
          userId: order.userId,
          name: getCustomerLabel(order),
          email: order.customerEmail || order.user?.email || null,
          phone: order.customerPhone || order.user?.phone || null,
          totalRevenue: 0,
          ordersCount: 0,
          firstOrderAt: order.createdAt,
          lastOrderAt: order.createdAt,
          orderDates: [],
          products: new Map()
        })
      }

      const customer = customers.get(key)
      customer.totalRevenue += Number(order.total || 0)
      customer.ordersCount += 1
      customer.lastOrderAt = order.createdAt
      customer.orderDates.push(new Date(order.createdAt))

      for (const item of order.items || []) {
        const productId = item.productId
        const title = item.product?.title || `Товар #${productId}`
        const productMetric = customer.products.get(productId) || {
          productId,
          title,
          sku: item.product?.sku || null,
          units: 0,
          revenue: 0,
          lastPurchaseAt: order.createdAt,
          purchases: 0
        }

        productMetric.units += Number(item.quantity || 0)
        productMetric.revenue += getOrderItemRevenue(item)
        productMetric.lastPurchaseAt = order.createdAt
        productMetric.purchases += 1
        customer.products.set(productId, productMetric)

        if (!retentionByProduct.has(productId)) {
          retentionByProduct.set(productId, {
            productId,
            title,
            sku: item.product?.sku || null,
            customers: new Map()
          })
        }
        const retention = retentionByProduct.get(productId)
        const retentionCustomer = retention.customers.get(key) || { orders: new Set(), units: 0 }
        retentionCustomer.orders.add(order.id)
        retentionCustomer.units += Number(item.quantity || 0)
        retention.customers.set(key, retentionCustomer)

        lastProductPurchases.set(`${key}:${productId}`, {
          customerKey: key,
          customerName: customer.name,
          email: customer.email,
          phone: customer.phone,
          productId,
          title,
          repeatCycleDays: normalizeRepeatCycleDays(item.product?.repeatCycleDays),
          lastPurchaseAt: order.createdAt,
          units: productMetric.units
        })
      }
    }

    const customerRows = [...customers.values()].map(customer => {
      const sortedDates = customer.orderDates.sort((a, b) => a - b)
      const intervals = sortedDates.slice(1).map((date, index) => daysBetween(sortedDates[index], date))
      const avgIntervalDays = intervals.length
        ? intervals.reduce((sum, value) => sum + value, 0) / intervals.length
        : null
      const daysSinceLastOrder = daysBetween(customer.lastOrderAt, now)
      const monthlyBefore = customer.ordersCount >= 2 && avgIntervalDays !== null && avgIntervalDays <= 45

      return {
        key: customer.key,
        userId: customer.userId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        totalRevenue: toMoney(customer.totalRevenue),
        ordersCount: customer.ordersCount,
        avgOrderValue: toMoney(customer.ordersCount ? customer.totalRevenue / customer.ordersCount : 0),
        firstOrderAt: customer.firstOrderAt,
        lastOrderAt: customer.lastOrderAt,
        daysSinceLastOrder,
        avgIntervalDays: avgIntervalDays === null ? null : toMoney(avgIntervalDays),
        isCoreAudience: false,
        isChurned: monthlyBefore && daysSinceLastOrder >= 60,
        topProducts: [...customer.products.values()]
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 3)
          .map(product => ({
            productId: product.productId,
            title: product.title,
            units: product.units,
            revenue: toMoney(product.revenue)
          }))
      }
    }).sort((a, b) => b.totalRevenue - a.totalRevenue)

    const totalRevenue = customerRows.reduce((sum, customer) => sum + customer.totalRevenue, 0)
    const coreLimit = Math.max(1, Math.ceil(customerRows.length * 0.2))
    const coreCustomers = customerRows.slice(0, coreLimit)
    const coreRevenue = coreCustomers.reduce((sum, customer) => sum + customer.totalRevenue, 0)
    const coreKeys = new Set(coreCustomers.map(customer => customer.key))

    for (const customer of customerRows) {
      customer.isCoreAudience = coreKeys.has(customer.key)
    }

    const repeatDue = [...lastProductPurchases.values()]
      .map(purchase => {
        const daysSinceLastPurchase = daysBetween(purchase.lastPurchaseAt, now)
        const repeatCycleDays = normalizeRepeatCycleDays(purchase.repeatCycleDays)
        if (daysSinceLastPurchase < repeatCycleDays) return null

        return {
          customerKey: purchase.customerKey,
          customerName: purchase.customerName,
          email: purchase.email,
          phone: purchase.phone,
          productId: purchase.productId,
          productTitle: purchase.title,
          lastPurchaseAt: purchase.lastPurchaseAt,
          daysSinceLastPurchase,
          repeatCycleDays,
          overdueDays: daysSinceLastPurchase - repeatCycleDays
        }
      })
      .filter(Boolean)
      .sort((a, b) => b.overdueDays - a.overdueDays)
      .slice(0, 100)

    const retentionProducts = [...retentionByProduct.values()].map(product => {
      const customersList = [...product.customers.values()]
      const buyers = customersList.length
      const repeatBuyers = customersList.filter(customer => customer.orders.size >= 2).length
      const retentionRate = buyers > 0 ? (repeatBuyers / buyers) * 100 : 0

      return {
        productId: product.productId,
        title: product.title,
        sku: product.sku,
        buyers,
        repeatBuyers,
        retentionRate: toMoney(retentionRate)
      }
    }).sort((a, b) => b.retentionRate - a.retentionRate || b.buyers - a.buyers)

    res.json({
      summary: {
        customers: customerRows.length,
        revenue: toMoney(totalRevenue),
        coreCustomers: coreCustomers.length,
        coreRevenue: toMoney(coreRevenue),
        coreRevenueShare: totalRevenue > 0 ? toMoney((coreRevenue / totalRevenue) * 100) : 0,
        churnedCustomers: customerRows.filter(customer => customer.isChurned).length,
        repeatDue: repeatDue.length
      },
      topCustomers: customerRows.slice(0, 100),
      churnedCustomers: customerRows.filter(customer => customer.isChurned).slice(0, 100),
      repeatDue,
      retentionProducts
    })
  } catch (error) {
    next(error)
  }
})

export default router
