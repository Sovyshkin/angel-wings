import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requirePartner } from '../middleware/auth.js'
import { v4 as uuidv4 } from 'uuid'

const router = Router()
const prisma = new PrismaClient()

router.get('/cabinet/stats', authenticate, requirePartner, async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({
      where: { userId: req.user.id }
    })

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' })
    }

    const [
      usersCount,
      referralsData,
      commissionsData,
      paymentsData
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
        where: { partnerId: partner.id },
        _sum: { amount: true },
        _count: true
      }),
      prisma.partnerPayment.aggregate({
        where: { partnerId: partner.id },
        _sum: { amount: true }
      })
    ])

    const referredUserIds = referralsData.map(r => r.userId)
    const ordersData = referredUserIds.length > 0
      ? await prisma.order.findMany({
          where: { userId: { in: referredUserIds } },
          select: { total: true, status: true }
        })
      : []

    const totalOrdersAmount = ordersData
      .filter(o => o.status !== 'CANCELLED')
      .reduce((sum, o) => sum + o.total, 0)

    const totalPaidOut = paymentsData._sum.amount || 0
    const totalEarned = commissionsData._sum.amount || 0

    res.json({
      stats: {
        usersCount,
        ordersCount: commissionsData._count,
        totalOrdersAmount,
        totalEarned,
        totalPaidOut,
        pendingAmount: totalEarned - totalPaidOut
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
      return res.status(404).json({ error: 'Partner not found' })
    }

    res.json({ promoCodes: partner.promoCodes, referralCode: partner.referralCode })
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
      return res.status(404).json({ error: 'Partner not found' })
    }

    const { discountType = 'percentage', discountValue, usageType = 'multi', maxActivations = 100 } = req.body

    const code = uuidv4().substring(0, 8).toUpperCase()

    const promoCode = await prisma.promoCode.create({
      data: {
        code,
        discountType,
        discountValue: discountValue || 5,
        usageType,
        maxActivations,
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
      return res.status(404).json({ error: 'Partner not found' })
    }

    const where = { partnerId: partner.id }
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
                select: { total: true, status: true }
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
      const totalSpent = userOrders.reduce((sum, o) => sum + o.total, 0)
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
      return res.status(404).json({ error: 'Partner not found' })
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
      return res.status(404).json({ error: 'Partner not found' })
    }

    const payments = await prisma.partnerPayment.findMany({
      where: { partnerId: partner.id },
      orderBy: { createdAt: 'desc' }
    })

    res.json({ payments })
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
      return res.status(404).json({ error: 'Partner not found' })
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
        status: { not: 'CANCELLED' }
      },
      select: {
        createdAt: true,
        total: true
      }
    })

    const commissions = await prisma.partnerCommission.findMany({
      where: {
        partnerId: partner.id,
        createdAt: { gte: startDate }
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
        day.ordersAmount += order.total
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
      return res.status(404).json({ error: 'Partner not found' })
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
              select: { total: true, status: true, createdAt: true }
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
        userOrders.reduce((sum, o) => sum + o.total, 0).toFixed(2)
      ])
    })

    const csv = csvRows.map(row => row.join(',')).join('\n')

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename=partner-report-${partner.referralCode}.csv`)
    res.send(csv)
  } catch (error) {
    next(error)
  }
})

export default router