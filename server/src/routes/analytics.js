import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()
const TRACKABLE_EVENTS = new Set(['view', 'add_to_cart'])
const SUCCESS_PAYMENT_STATUSES = new Set(['PAID', 'CASH_ON_DELIVERY'])

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

function toMoney(value) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100
}

function getOrderItemRevenue(item) {
  return Number(item.price || 0) * Number(item.quantity || 0)
}

function normalizeOrderStatus(status) {
  return String(status || '').trim().toUpperCase()
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

export default router
