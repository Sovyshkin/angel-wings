import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import {
  createPointBatchId,
  creditUserPoints,
  normalizePointAmount,
  normalizePointMessage
} from '../utils/userPoints.js'

const router = Router()
const prisma = new PrismaClient()
const BASE_USER_WHERE = { role: { in: ['USER', 'PARTNER'] } }
const SUCCESSFUL_ORDER_WHERE = {
  status: { notIn: ['CANCELLED', 'RETURNED'] },
  paymentStatus: { in: ['PAID', 'CASH_ON_DELIVERY'] }
}

function parsePositiveInt(value) {
  const parsed = parseInt(value, 10)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function hasValue(value) {
  return value !== '' && value !== null && value !== undefined
}

function parseNonNegativeNumber(value) {
  if (value === '' || value === null || value === undefined) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function parseDate(value, endOfDay = false) {
  const raw = String(value || '').trim()
  if (!raw) return null
  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return null
  if (endOfDay) {
    date.setHours(23, 59, 59, 999)
  } else {
    date.setHours(0, 0, 0, 0)
  }
  return date
}

function buildDateRange(params = {}, field = 'createdAt') {
  const gte = parseDate(params.from)
  const lte = parseDate(params.to, true)
  if (!gte && !lte) return {}
  return {
    [field]: {
      ...(gte ? { gte } : {}),
      ...(lte ? { lte } : {})
    }
  }
}

function buildOrderWhere(params = {}) {
  return {
    ...SUCCESSFUL_ORDER_WHERE,
    ...buildDateRange(params, 'createdAt'),
    userId: { not: null }
  }
}

function buildRangeFilter(params = {}, minKey = 'min', maxKey = 'max') {
  const min = parseNonNegativeNumber(params[minKey])
  const max = parseNonNegativeNumber(params[maxKey])
  return {
    min,
    max,
    matches(value) {
      const number = Number(value || 0)
      if (min !== null && number < min) return false
      if (max !== null && number > max) return false
      return true
    }
  }
}

function uniqueIds(ids) {
  return [...new Set(ids.map(id => parseInt(id, 10)).filter(id => Number.isInteger(id) && id > 0))]
}

function failSegment(message) {
  throw Object.assign(new Error(message), { status: 400 })
}

function requireDateRange(params) {
  if (!hasValue(params.from) || !hasValue(params.to)) {
    failSegment('Укажите начало и конец периода')
  }

  const from = parseDate(params.from)
  const to = parseDate(params.to, true)
  if (!from || !to || from > to) {
    failSegment('Укажите корректный период')
  }
}

function validateRange(params, minKey, maxKey, message) {
  if (!hasValue(params[minKey]) && !hasValue(params[maxKey])) {
    failSegment(message)
  }

  const min = parseNonNegativeNumber(params[minKey])
  const max = parseNonNegativeNumber(params[maxKey])
  if ((hasValue(params[minKey]) && min === null) || (hasValue(params[maxKey]) && max === null)) {
    failSegment('Укажите корректный диапазон')
  }

  if (min !== null && max !== null && min > max) {
    failSegment('Минимальное значение не может быть больше максимального')
  }
}

function validateSegment(type, params) {
  if (['purchased_period', 'not_purchased_period', 'registered_period'].includes(type)) {
    requireDateRange(params)
  }

  if (type === 'spent_period') {
    requireDateRange(params)
    validateRange(params, 'minAmount', 'maxAmount', 'Укажите сумму покупок от или до')
  }

  if (type === 'orders_count_period') {
    requireDateRange(params)
    validateRange(params, 'minCount', 'maxCount', 'Укажите количество заказов от или до')
  }

  if (type === 'vip_lifetime') {
    validateRange(params, 'minAmount', 'maxAmount', 'Укажите минимальную сумму покупок')
  }

  if (type === 'points_balance_range') {
    validateRange(params, 'min', 'max', 'Укажите баланс баллов от или до')
  }

  if (type === 'bought_product' && !parsePositiveInt(params.productId)) {
    failSegment('Выберите товар')
  }

  if (type === 'bought_category' && !parsePositiveInt(params.categoryId)) {
    failSegment('Выберите категорию')
  }
}

async function resolveSegmentUserIds(db, segment = {}) {
  const type = String(segment?.type || 'all').trim()
  const params = segment?.params && typeof segment.params === 'object' ? segment.params : {}

  validateSegment(type, params)

  if (type === 'all') {
    const users = await db.user.findMany({ where: BASE_USER_WHERE, select: { id: true } })
    return users.map(user => user.id)
  }

  if (type === 'no_orders') {
    const users = await db.user.findMany({
      where: { ...BASE_USER_WHERE, orders: { none: {} } },
      select: { id: true }
    })
    return users.map(user => user.id)
  }

  if (type === 'purchased_period') {
    const users = await db.user.findMany({
      where: {
        ...BASE_USER_WHERE,
        orders: { some: buildOrderWhere(params) }
      },
      select: { id: true }
    })
    return users.map(user => user.id)
  }

  if (type === 'not_purchased_period') {
    const users = await db.user.findMany({
      where: {
        ...BASE_USER_WHERE,
        orders: { none: buildOrderWhere(params) }
      },
      select: { id: true }
    })
    return users.map(user => user.id)
  }

  if (type === 'registered_period') {
    const users = await db.user.findMany({
      where: {
        ...BASE_USER_WHERE,
        ...buildDateRange(params, 'createdAt')
      },
      select: { id: true }
    })
    return users.map(user => user.id)
  }

  if (type === 'points_balance_range') {
    const range = buildRangeFilter(params)
    const users = await db.user.findMany({
      where: {
        ...BASE_USER_WHERE,
        pointsBalance: {
          ...(range.min !== null ? { gte: Math.floor(range.min) } : {}),
          ...(range.max !== null ? { lte: Math.floor(range.max) } : {})
        }
      },
      select: { id: true }
    })
    return users.map(user => user.id)
  }

  if (type === 'bought_product') {
    const productId = parsePositiveInt(params.productId)
    if (!productId) return []
    const users = await db.user.findMany({
      where: {
        ...BASE_USER_WHERE,
        orders: {
          some: {
            ...buildOrderWhere(params),
            items: { some: { productId } }
          }
        }
      },
      select: { id: true }
    })
    return users.map(user => user.id)
  }

  if (type === 'bought_category') {
    const categoryId = parsePositiveInt(params.categoryId)
    if (!categoryId) return []
    const users = await db.user.findMany({
      where: {
        ...BASE_USER_WHERE,
        orders: {
          some: {
            ...buildOrderWhere(params),
            items: {
              some: {
                product: {
                  categories: { some: { id: categoryId } }
                }
              }
            }
          }
        }
      },
      select: { id: true }
    })
    return users.map(user => user.id)
  }

  if (type === 'bound_partner') {
    const partnerId = parsePositiveInt(params.partnerId)
    const users = await db.user.findMany({
      where: {
        ...BASE_USER_WHERE,
        partnerUser: partnerId
          ? { is: { partnerId } }
          : { isNot: null }
      },
      select: { id: true }
    })
    return users.map(user => user.id)
  }

  if (['spent_period', 'orders_count_period', 'vip_lifetime'].includes(type)) {
    const isLifetime = type === 'vip_lifetime'
    const orderWhere = isLifetime ? { ...SUCCESSFUL_ORDER_WHERE, userId: { not: null } } : buildOrderWhere(params)
    const groupedOrders = await db.order.groupBy({
      by: ['userId'],
      where: orderWhere,
      _sum: { total: true },
      _count: { id: true }
    })

    const range = type === 'orders_count_period'
      ? buildRangeFilter(params, 'minCount', 'maxCount')
      : buildRangeFilter(params, 'minAmount', 'maxAmount')

    const matchedIds = groupedOrders
      .filter(group => range.matches(type === 'orders_count_period' ? group._count.id : group._sum.total))
      .map(group => group.userId)

    if (!matchedIds.length) return []

    const users = await db.user.findMany({
      where: {
        ...BASE_USER_WHERE,
        id: { in: uniqueIds(matchedIds) }
      },
      select: { id: true }
    })
    return users.map(user => user.id)
  }

  throw Object.assign(new Error('Некорректный фильтр пользователей'), { status: 400 })
}

async function getSegmentPreview(db, segment) {
  const ids = await resolveSegmentUserIds(db, segment)
  const sample = ids.length
    ? await db.user.findMany({
        where: { id: { in: ids.slice(0, 12) } },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          pointsBalance: true,
          createdAt: true,
          _count: { select: { orders: true } }
        },
        orderBy: { createdAt: 'desc' }
      })
    : []

  return { ids, total: ids.length, sample }
}

router.post('/segments/preview', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const preview = await getSegmentPreview(prisma, req.body?.segment)
    res.json({
      total: preview.total,
      sample: preview.sample
    })
  } catch (error) {
    next(error)
  }
})

router.post('/credit', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const scope = String(req.body?.scope || 'user').trim().toLowerCase()
    const amount = normalizePointAmount(req.body?.amount)
    const message = normalizePointMessage(req.body?.message)
    const batchId = createPointBatchId()

    if (amount <= 0) {
      return res.status(400).json({ error: 'Укажите положительное количество баллов' })
    }

    if (amount > 1_000_000) {
      return res.status(400).json({ error: 'Слишком большое начисление за одну операцию' })
    }

    if (scope === 'all' || scope === 'segment') {
      const result = await prisma.$transaction(async (tx) => {
        const userIds = scope === 'segment'
          ? await resolveSegmentUserIds(tx, req.body?.segment)
          : (await tx.user.findMany({
              where: BASE_USER_WHERE,
              select: { id: true }
            })).map(user => user.id)

        if (!userIds.length) {
          throw Object.assign(new Error('Под выбранный фильтр не попал ни один пользователь'), { status: 400 })
        }

        for (const userId of userIds) {
          await creditUserPoints(tx, {
            userId,
            amount,
            message,
            createdById: req.user.id,
            batchId
          })
        }

        return { count: userIds.length }
      })

      return res.json({
        message: `Баллы начислены пользователям: ${result.count}`,
        creditedUsers: result.count,
        amount,
        batchId
      })
    }

    const userId = parseInt(req.body?.userId, 10)
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Выберите пользователя для начисления' })
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    })

    if (!targetUser || targetUser.role === 'DELETED') {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    const user = await prisma.$transaction((tx) => creditUserPoints(tx, {
      userId,
      amount,
      message,
      createdById: req.user.id,
      batchId
    }))

    res.json({
      message: 'Баллы начислены пользователю',
      creditedUsers: 1,
      amount,
      balance: user.pointsBalance,
      batchId
    })
  } catch (error) {
    next(error)
  }
})

export default router
