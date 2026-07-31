import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requirePartner } from '../middleware/auth.js'
import { v4 as uuidv4 } from 'uuid'
import { calculatePartnerBalance } from '../utils/partnerBalance.js'

const router = Router()
const prisma = new PrismaClient()

function getOrderAmountWithoutDelivery(order) {
  const total = Number(order?.total || 0)
  const deliveryPrice = Number(order?.deliveryPrice || 0)
  return Math.max(0, total - deliveryPrice)
}

function parsePaymentDetails(details) {
  if (!details) return null
  if (typeof details === 'object') return details
  try {
    return JSON.parse(details)
  } catch {
    return null
  }
}

function isUnseenCredit(payment) {
  if (payment.type !== 'ADMIN_CREDIT') return false
  const details = parsePaymentDetails(payment.details) || {}
  return !details.notificationSeenAt
}

function normalizePayoutDetails(details = {}) {
  return {
    recipientName: String(details.recipientName || '').trim(),
    bankName: String(details.bankName || '').trim(),
    accountNumber: String(details.accountNumber || '').trim(),
    bik: String(details.bik || '').trim(),
    correspondentAccount: String(details.correspondentAccount || '').trim(),
    inn: String(details.inn || '').trim(),
    cardNumber: String(details.cardNumber || '').trim(),
    phone: String(details.phone || '').trim(),
    comment: String(details.comment || '').trim()
  }
}

router.get('/cabinet/stats', authenticate, requirePartner, async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({
      where: { userId: req.user.id }
    })

    if (!partner) {
      return res.status(404).json({ error: 'Партнёр не найден' })
    }

    const [
      usersCount,
      referralsData,
      commissionsData,
      balanceData
    ] = await Promise.all([
      prisma.partnerUser.count({ where: { partnerId: partner.id } }),
      prisma.partnerUser.findMany({
        where: { partnerId: partner.id },
        select: {
          userId: true,
          boundAt: true,
          promoCode: { select: { code: true } }
        }
      }),
      prisma.partnerCommission.aggregate({
        where: {
          partnerId: partner.id,
          order: { paymentStatus: 'PAID' }
        },
        _sum: { amount: true },
        _count: true
      }),
      calculatePartnerBalance(prisma, partner.id)
    ])

    const referredUserIds = referralsData.map(r => r.userId)
    const ordersData = referredUserIds.length > 0
      ? await prisma.order.findMany({
          where: {
            userId: { in: referredUserIds },
            paymentStatus: 'PAID'
          },
          select: { total: true, status: true, deliveryPrice: true }
        })
      : []

    const totalOrdersAmount = ordersData
      .filter(o => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + getOrderAmountWithoutDelivery(o), 0)

    const totalEarned = balanceData.totalEarned

    res.json({
      stats: {
        usersCount,
        ordersCount: commissionsData._count,
        totalOrdersAmount,
        totalEarned,
        totalCommissions: balanceData.totalCommissions,
        adminCredits: balanceData.adminCredits,
        totalPaidOut: balanceData.totalPaidOut,
        pendingPayouts: balanceData.pendingPayouts,
        spentOnOrders: balanceData.totalSpentOnOrders,
        availableBalance: balanceData.availableBalance,
        availableForOrders: balanceData.availableBalance,
        pendingAmount: balanceData.availableBalance
      }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/cabinet/promo-code', authenticate, requirePartner, async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({
      where: { userId: req.user.id },
      include: {
        promoCodes: {
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!partner) {
      return res.status(404).json({ error: 'Партнёр не найден' })
    }

    res.json({ promoCodes: partner.promoCodes })
  } catch (error) {
    next(error)
  }
})

router.post('/cabinet/promo-code', authenticate, requirePartner, async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({
      where: { userId: req.user.id }
    })

    if (!partner) {
      return res.status(404).json({ error: 'Партнёр не найден' })
    }

    const { discountType = 'percentage', discountValue, usageType = 'multi', maxActivations = 0 } = req.body

    const code = uuidv4().substring(0, 8).toUpperCase()

    const promoCode = await prisma.promoCode.create({
      data: {
        code,
        discountType,
        discountValue: discountValue || 5,
        usageType,
        maxActivations: usageType === 'single'
          ? 1
          : Math.max(0, parseInt(maxActivations ?? 0, 10) || 0),
        partnerId: partner.id
      }
    })

    res.status(201).json({ promoCode })
  } catch (error) {
    next(error)
  }
})

router.get('/cabinet/users', authenticate, requirePartner, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, startDate, endDate } = req.query

    const partner = await prisma.partner.findUnique({
      where: { userId: req.user.id }
    })

    if (!partner) {
      return res.status(404).json({ error: 'Партнёр не найден' })
    }

    const where = {
      partnerId: partner.id,
      order: { paymentStatus: 'PAID' }
    }
    if (startDate || endDate) {
      where.boundAt = {}
      if (startDate) where.boundAt.gte = new Date(startDate)
      if (endDate) where.boundAt.lte = new Date(endDate)
    }

    const [partnerUsers, total] = await Promise.all([
      prisma.partnerUser.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
              createdAt: true,
              orders: {
                select: { total: true, status: true, deliveryPrice: true }
              }
            }
          },
          promoCode: { select: { code: true } }
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { boundAt: 'desc' }
      }),
      prisma.partnerUser.count({ where })
    ])

    const usersWithStats = partnerUsers.map(pu => {
      const userOrders = pu.user.orders.filter(o => o.status !== 'CANCELLED')
      const totalSpent = userOrders.reduce((sum, o) => sum + getOrderAmountWithoutDelivery(o), 0)
      return {
        id: pu.user.id,
        email: pu.user.email,
        name: pu.user.name,
        registeredAt: pu.user.createdAt,
        boundAt: pu.boundAt,
        referralSource: pu.referralSource,
        promoCode: pu.promoCode?.code,
        ordersCount: userOrders.length,
        totalSpent
      }
    })

    res.json({ users: usersWithStats, total })
  } catch (error) {
    next(error)
  }
})

router.get('/cabinet/commissions', authenticate, requirePartner, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, startDate, endDate } = req.query

    const partner = await prisma.partner.findUnique({
      where: { userId: req.user.id }
    })

    if (!partner) {
      return res.status(404).json({ error: 'Партнёр не найден' })
    }

    const where = { partnerId: partner.id }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [commissions, total] = await Promise.all([
      prisma.partnerCommission.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              total: true,
              createdAt: true,
              user: { select: { email: true, name: true } }
            }
          }
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.partnerCommission.count({ where })
    ])

    res.json({ commissions, total })
  } catch (error) {
    next(error)
  }
})

router.get('/cabinet/payments', authenticate, requirePartner, async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({
      where: { userId: req.user.id }
    })

    if (!partner) {
      return res.status(404).json({ error: 'Партнёр не найден' })
    }

    const payments = await prisma.partnerPayment.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: 'desc' }
    })

    res.json({
      payments: payments.map(payment => ({
        ...payment,
        details: parsePaymentDetails(payment.details)
      }))
    })
  } catch (error) {
    next(error)
  }
})

router.get('/cabinet/credit-notifications', authenticate, requirePartner, async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({
      where: { userId: req.user.id }
    })

    if (!partner) {
      return res.status(404).json({ error: 'Партнёр не найден' })
    }

    const payments = await prisma.partnerPayment.findMany({
      where: {
        partnerId: partner.id,
        type: 'ADMIN_CREDIT',
        status: 'PAID'
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    res.json({
      notifications: payments
        .filter(isUnseenCredit)
        .map(payment => ({
          id: payment.id,
          amount: payment.amount,
          comment: payment.comment || parsePaymentDetails(payment.details)?.comment || '',
          createdAt: payment.createdAt
        }))
    })
  } catch (error) {
    next(error)
  }
})

router.post('/cabinet/credit-notifications/:id/read', authenticate, requirePartner, async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({
      where: { userId: req.user.id }
    })

    if (!partner) {
      return res.status(404).json({ error: 'Партнёр не найден' })
    }

    const id = parseInt(req.params.id, 10)
    const payment = await prisma.partnerPayment.findFirst({
      where: {
        id,
        partnerId: partner.id,
        type: 'ADMIN_CREDIT'
      }
    })

    if (!payment) {
      return res.status(404).json({ error: 'Начисление не найдено' })
    }

    const details = parsePaymentDetails(payment.details) || {}
    await prisma.partnerPayment.update({
      where: { id: payment.id },
      data: {
        details: JSON.stringify({
          ...details,
          notificationSeenAt: new Date().toISOString()
        })
      }
    })

    res.json({ ok: true })
  } catch (error) {
    next(error)
  }
})

router.post('/cabinet/payout-requests', authenticate, requirePartner, async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({
      where: { userId: req.user.id }
    })

    if (!partner || !partner.isActive) {
      return res.status(404).json({ error: 'Партнёр не найден или отключён' })
    }

    const amount = Math.floor(Number(req.body?.amount || 0))
    const details = normalizePayoutDetails(req.body?.details || {})

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Укажите сумму вывода' })
    }

    if (amount < 500) {
      return res.status(400).json({ error: 'Минимальная сумма вывода: 500 ₽' })
    }

    if (!details.recipientName) {
      return res.status(400).json({ error: 'Укажите ФИО получателя' })
    }

    const hasBankDetails = details.bankName && details.accountNumber && details.bik
    const hasCardOrPhone = details.cardNumber || details.phone
    if (!hasBankDetails && !hasCardOrPhone) {
      return res.status(400).json({ error: 'Укажите реквизиты: расчётный счёт и БИК, карту или телефон для перевода' })
    }

    const balance = await calculatePartnerBalance(prisma, partner.id)
    if (amount > balance.availableBalance) {
      return res.status(400).json({ error: 'Недостаточно доступного баланса для вывода' })
    }

    const payment = await prisma.partnerPayment.create({
      data: {
        partnerId: partner.id,
        amount,
        type: 'PAYOUT',
        status: 'PAYOUT_REQUESTED',
        details: JSON.stringify(details),
        comment: details.comment || null
      }
    })

    res.status(201).json({
      payment: {
        ...payment,
        details
      },
      balance: await calculatePartnerBalance(prisma, partner.id)
    })
  } catch (error) {
    next(error)
  }
})

router.get('/cabinet/transactions', authenticate, requirePartner, async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({
      where: { userId: req.user.id }
    })

    if (!partner) {
      return res.status(404).json({ error: 'Партнёр не найден' })
    }

    const [commissions, payments] = await Promise.all([
      prisma.partnerCommission.findMany({
        where: {
          partnerId: partner.id,
          order: { paymentStatus: 'PAID' }
        },
        include: {
          order: { select: { id: true, customerName: true, total: true, deliveryPrice: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
      }),
      prisma.partnerPayment.findMany({
        where: { partnerId: partner.id },
        orderBy: { createdAt: 'desc' },
        take: 100
      })
    ])

    const transactions = [
      ...commissions.map(commission => ({
        id: `commission-${commission.id}`,
        sourceId: commission.id,
        type: 'COMMISSION',
        direction: 'INCOME',
        status: 'COMPLETED',
        amount: commission.amount,
        title: `Комиссия по заказу #${commission.orderId}`,
        description: commission.order?.customerName || null,
        createdAt: commission.createdAt,
        processedAt: commission.createdAt,
        order: commission.order
      })),
      ...payments.map(payment => ({
        id: `payment-${payment.id}`,
        sourceId: payment.id,
        type: payment.type || 'PAYOUT',
        direction: payment.type === 'ADMIN_CREDIT'
          ? 'INCOME'
          : payment.status === 'PAYOUT_REJECTED'
            ? 'NEUTRAL'
            : 'OUTCOME',
        status: payment.status,
        amount: payment.amount,
        title: payment.type === 'ADMIN_CREDIT'
          ? 'Начисление баллов'
          : payment.type === 'ORDER_SPEND' || payment.status === 'SPENT_ON_ORDER'
            ? 'Списание на покупку'
            : 'Заявка на вывод',
        description: payment.comment || null,
        comment: payment.comment || parsePaymentDetails(payment.details)?.comment || null,
        details: parsePaymentDetails(payment.details),
        createdAt: payment.createdAt,
        processedAt: payment.processedAt || payment.paidAt
      }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

    res.json({
      transactions,
      balance: await calculatePartnerBalance(prisma, partner.id)
    })
  } catch (error) {
    next(error)
  }
})

router.get('/cabinet/daily-stats', authenticate, requirePartner, async (req, res, next) => {
  try {
    const { days = 30 } = req.query

    const partner = await prisma.partner.findUnique({
      where: { userId: req.user.id }
    })

    if (!partner) {
      return res.status(404).json({ error: 'Партнёр не найден' })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(days))

    const partnerUsers = await prisma.partnerUser.findMany({
      where: { partnerId: partner.id },
      select: { userId: true }
    })

    const userIds = partnerUsers.map(pu => pu.userId)

    if (userIds.length === 0) {
      return res.json({ dailyStats: [] })
    }

    const orders = await prisma.order.findMany({
      where: {
        userId: { in: userIds },
        createdAt: { gte: startDate },
        status: { not: 'CANCELLED' },
        paymentStatus: 'PAID'
      },
      select: {
        createdAt: true,
        total: true,
        deliveryPrice: true
      }
    })

    const commissions = await prisma.partnerCommission.findMany({
      where: {
        partnerId: partner.id,
        createdAt: { gte: startDate },
        order: { paymentStatus: 'PAID' }
      },
      select: {
        createdAt: true,
        amount: true
      }
    })

    const dailyMap = new Map()

    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const key = date.toISOString().split('T')[0]
      dailyMap.set(key, { date: key, ordersCount: 0, ordersAmount: 0, commission: 0 })
    }

    orders.forEach(order => {
      const key = order.createdAt.toISOString().split('T')[0]
      const day = dailyMap.get(key)
      if (day) {
        day.ordersCount++
        day.ordersAmount += getOrderAmountWithoutDelivery(order)
      }
    })

    commissions.forEach(c => {
      const key = c.createdAt.toISOString().split('T')[0]
      const day = dailyMap.get(key)
      if (day) {
        day.commission += c.amount
      }
    })

    const dailyStats = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date))

    res.json({ dailyStats })
  } catch (error) {
    next(error)
  }
})

router.get('/cabinet/export', authenticate, requirePartner, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query

    const partner = await prisma.partner.findUnique({
      where: { userId: req.user.id }
    })

    if (!partner) {
      return res.status(404).json({ error: 'Партнёр не найден' })
    }

    const where = { partnerId: partner.id }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const partnerUsers = await prisma.partnerUser.findMany({
      where: { partnerId: partner.id },
      include: {
        user: {
          select: {
            email: true,
            name: true,
            createdAt: true,
            orders: {
              where: startDate || endDate ? {
                createdAt: {
                  ...(startDate ? { gte: new Date(startDate) } : {}),
                  ...(endDate ? { lte: new Date(endDate) } : {})
                }
              } : undefined,
              select: { total: true, status: true, createdAt: true, deliveryPrice: true }
            }
          }
        }
      }
    })

    const csvRows = [
      ['Email', 'Имя', 'Дата регистрации', 'Дата привязки', 'Источник', 'Кол-во заказов', 'Сумма заказов']
    ]

    partnerUsers.forEach(pu => {
      const userOrders = pu.user.orders.filter(o => o.status !== 'CANCELLED')
      csvRows.push([
        pu.user.email,
        pu.user.name,
        pu.user.createdAt.toISOString().split('T')[0],
        pu.boundAt.toISOString().split('T')[0],
        pu.referralSource,
        userOrders.length,
        userOrders.reduce((sum, o) => sum + getOrderAmountWithoutDelivery(o), 0).toFixed(2)
      ])
    })

    const csv = csvRows.map(row => row.join(',')).join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=partner-report-${partner.id}.csv`)
    res.send(csv)
  } catch (error) {
    next(error)
  }
})

export default router
