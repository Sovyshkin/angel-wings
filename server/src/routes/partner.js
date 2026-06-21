import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { calculatePartnerBalance } from '../utils/partnerBalance.js'

const router = Router()
const prisma = new PrismaClient()

function normalizePromoCodeValue(code) {
  return String(code || '').trim().toUpperCase()
}

function parsePaymentDetails(details) {
  if (!details) return null
  try {
    return JSON.parse(details)
  } catch {
    return null
  }
}

// Resource routes - placed before /:id to avoid conflicts
router.get('/promo-codes', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, partnerId } = req.query

    const where = partnerId ? { partnerId: parseInt(partnerId) } : {}

    const [promoCodes, total] = await Promise.all([
      prisma.promoCode.findMany({
        where,
        include: {
          partner: { select: { id: true, user: { select: { name: true } } } }
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.promoCode.count({ where })
    ])

    res.json({ promoCodes, total })
  } catch (error) {
    next(error)
  }
})

router.post('/promo-codes', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      code,
      discountType = 'percentage',
      discountValue,
      usageType = 'single',
      maxActivations = 0,
      startDate,
      endDate,
      minOrderAmount,
      isFirstPurchase = false,
      partnerId
    } = req.body

    const normalizedCode = normalizePromoCodeValue(code)
    if (!normalizedCode) {
      return res.status(400).json({ error: 'Укажите промокод' })
    }

    const existing = await prisma.promoCode.findFirst({
      where: {
        OR: [
          { code: normalizedCode },
          { code: String(code || '').trim() },
          { code: String(code || '').trim().toLowerCase() }
        ]
      }
    })
    if (existing) {
      return res.status(400).json({ error: 'Промокод уже существует' })
    }

    const normalizedMaxActivations = usageType === 'single'
      ? 1
      : Math.max(0, parseInt(maxActivations ?? 0, 10) || 0)

    const promoCode = await prisma.promoCode.create({
      data: {
        code: normalizedCode,
        discountType,
        discountValue,
        usageType,
        maxActivations: normalizedMaxActivations,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        minOrderAmount,
        isFirstPurchase,
        partnerId: partnerId ? parseInt(partnerId) : null
      }
    })

    res.status(201).json({ promoCode })
  } catch (error) {
    next(error)
  }
})

router.put('/promo-codes/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const {
      discountType,
      discountValue,
      usageType,
      maxActivations,
      startDate,
      endDate,
      minOrderAmount,
      isFirstPurchase,
      isActive,
      partnerId
    } = req.body

    const data = {}
    if (discountType !== undefined) data.discountType = discountType
    if (discountValue !== undefined) data.discountValue = discountValue
    if (usageType !== undefined) data.usageType = usageType
    if (usageType === 'single') data.maxActivations = 1
    if (maxActivations !== undefined) {
      const nextUsageType = usageType !== undefined ? usageType : undefined
      if (nextUsageType === 'single') {
        data.maxActivations = 1
      } else {
        data.maxActivations = Math.max(0, parseInt(maxActivations, 10) || 0)
      }
    }
    if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null
    if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null
    if (minOrderAmount !== undefined) data.minOrderAmount = minOrderAmount
    if (isFirstPurchase !== undefined) data.isFirstPurchase = isFirstPurchase
    if (isActive !== undefined) data.isActive = isActive
    if (partnerId !== undefined) data.partnerId = partnerId ? parseInt(partnerId) : null

    const promoCode = await prisma.promoCode.update({
      where: { id: parseInt(req.params.id) },
      data
    })

    res.json({ promoCode })
  } catch (error) {
    next(error)
  }
})

router.delete('/promo-codes/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await prisma.promoCode.delete({
      where: { id: parseInt(req.params.id) }
    })

    res.json({ message: 'Promo code deleted' })
  } catch (error) {
    next(error)
  }
})

router.get('/partner-users', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, partnerId } = req.query

    const where = partnerId ? { partnerId: parseInt(partnerId) } : {}

    const [partnerUsers, total] = await Promise.all([
      prisma.partnerUser.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, name: true, createdAt: true } },
          partner: { select: { id: true, user: { select: { name: true } } } },
          promoCode: { select: { code: true } }
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { boundAt: 'desc' }
      }),
      prisma.partnerUser.count({ where })
    ])

    res.json({ partnerUsers, total })
  } catch (error) {
    next(error)
  }
})

router.put('/partner-users/:userId/partner', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { partnerId } = req.body
    const userId = parseInt(req.params.userId)

    const existingBinding = await prisma.partnerUser.findUnique({
      where: { userId }
    })

    if (existingBinding) {
      return res.status(400).json({ error: 'Пользователь уже привязан к партнёру. Сначала отвяжите его.' })
    }

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId }
    })

    if (!partner) {
      return res.status(404).json({ error: 'Партнёр не найден' })
    }

    const partnerUser = await prisma.partnerUser.create({
      data: {
        userId,
        partnerId,
        referralSource: 'admin_assignment'
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        partner: { select: { id: true } }
      }
    })

    res.json({ partnerUser })
  } catch (error) {
    next(error)
  }
})

router.delete('/partner-users/:userId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await prisma.partnerUser.delete({
      where: { userId: parseInt(req.params.userId) }
    })

    res.json({ message: 'Partner binding removed' })
  } catch (error) {
    next(error)
  }
})

router.get('/commissions', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, partnerId, startDate, endDate } = req.query

    const where = { order: { paymentStatus: 'PAID' } }
    if (partnerId) where.partnerId = parseInt(partnerId)
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const [commissions, total] = await Promise.all([
      prisma.partnerCommission.findMany({
        where,
        include: {
          partner: { select: { id: true, user: { select: { name: true } } } },
          order: { select: { id: true, total: true, paymentStatus: true, createdAt: true, user: { select: { email: true, name: true } } } }
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

router.get('/payments', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, partnerId, status, type } = req.query

    const where = {}
    if (partnerId) where.partnerId = parseInt(partnerId)
    if (type) where.type = String(type)
    if (status) {
      const normalizedStatus = String(status).trim().toUpperCase()
      if (normalizedStatus === 'ACTIVE') {
        where.status = { in: ['PENDING', 'PAYOUT_REQUESTED'] }
      } else if (normalizedStatus === 'COMPLETED') {
        where.status = { in: ['PAYOUT_APPROVED', 'PAYOUT_REJECTED', 'PAID'] }
      } else if (normalizedStatus !== 'ALL') {
        where.status = normalizedStatus
      }
    }

    const [payments, total] = await Promise.all([
      prisma.partnerPayment.findMany({
        where,
        include: {
          partner: { select: { id: true, user: { select: { name: true, email: true, phone: true } } } }
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.partnerPayment.count({ where })
    ])
    const balances = new Map()
    const partnerIds = [...new Set(payments.map(payment => payment.partnerId).filter(Boolean))]
    await Promise.all(partnerIds.map(async (id) => {
      balances.set(id, await calculatePartnerBalance(prisma, id))
    }))

    res.json({
      payments: payments.map(payment => ({
        ...payment,
        details: parsePaymentDetails(payment.details),
        partner: payment.partner
          ? {
              ...payment.partner,
              balance: balances.get(payment.partnerId) || null
            }
          : payment.partner
      })),
      total
    })
  } catch (error) {
    next(error)
  }
})

router.post('/payments', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { partnerId, amount, status = 'PAYOUT_REQUESTED', type = 'PAYOUT', details, comment } = req.body

    const payment = await prisma.partnerPayment.create({
      data: {
        partnerId,
        amount,
        status,
        type,
        details: details ? JSON.stringify(details) : null,
        comment: comment || null
      }
    })

    res.status(201).json({ payment })
  } catch (error) {
    next(error)
  }
})

router.put('/payments/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status, comment } = req.body
    const id = parseInt(req.params.id)

    const existing = await prisma.partnerPayment.findUnique({
      where: { id },
      include: { partner: true }
    })

    if (!existing) {
      return res.status(404).json({ error: 'Заявка не найдена' })
    }

    if (!['PAYOUT_APPROVED', 'PAYOUT_REJECTED', 'PAYOUT_REQUESTED'].includes(status)) {
      return res.status(400).json({ error: 'Некорректный статус заявки' })
    }

    if (existing.status !== 'PAYOUT_REQUESTED' && status !== existing.status) {
      return res.status(400).json({ error: 'Можно обрабатывать только активные заявки' })
    }

    if (status === 'PAYOUT_APPROVED') {
      const balance = await calculatePartnerBalance(prisma, existing.partnerId)
      const frozenByThisRequest = existing.status === 'PAYOUT_REQUESTED' ? Number(existing.amount || 0) : 0
      if (Number(existing.amount || 0) > balance.availableBalance + frozenByThisRequest) {
        return res.status(400).json({ error: 'Недостаточно баланса для одобрения заявки' })
      }
    }

    const data = {
      status,
      comment: comment !== undefined ? String(comment || '').trim() || null : existing.comment
    }

    if (status === 'PAYOUT_APPROVED') {
      data.paidAt = new Date()
      data.processedAt = new Date()
      data.processedBy = req.user.id
    }

    if (status === 'PAYOUT_REJECTED') {
      data.processedAt = new Date()
      data.processedBy = req.user.id
    }

    const payment = await prisma.partnerPayment.update({
      where: { id },
      data
    })

    res.json({
      payment: {
        ...payment,
        details: parsePaymentDetails(payment.details)
      }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/stats/partner', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const [partnersCount, promoCodesCount, activeBindings, totalCommissions] = await Promise.all([
      prisma.partner.count(),
      prisma.promoCode.count(),
      prisma.partnerUser.count(),
      prisma.partnerCommission.aggregate({
        where: { order: { paymentStatus: 'PAID' } },
        _sum: { amount: true }
      })
    ])

    res.json({
      stats: {
        partnersCount,
        promoCodesCount,
        activeBindings,
        totalCommissions: totalCommissions._sum.amount || 0
      }
    })
  } catch (error) {
    next(error)
  }
})

// Partner routes with :id - placed after resource routes
router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        include: {
          user: { select: { id: true, email: true, name: true, createdAt: true } },
          _count: { select: { partnerUsers: true, commissions: true } },
          commissions: {
            where: { order: { paymentStatus: 'PAID' } },
            select: { amount: true }
          }
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.partner.count()
    ])

    const balances = new Map()
    await Promise.all(partners.map(async (partner) => {
      balances.set(partner.id, await calculatePartnerBalance(prisma, partner.id))
    }))

    const partnersWithStats = partners.map(p => {
      const totalCommission = p.commissions.reduce((sum, c) => sum + c.amount, 0)
      const balance = balances.get(p.id) || {
        totalEarned: totalCommission,
        totalPaidOut: 0,
        pendingPayouts: 0,
        totalSpentOnOrders: 0,
        availableBalance: totalCommission
      }
      return {
        id: p.id,
        user: p.user,
        percentage: p.percentage,
        isActive: p.isActive,
        createdAt: p.createdAt,
        usersCount: p._count.partnerUsers,
        ordersCount: p.commissions.length,
        totalCommission,
        balance,
        availableBalance: balance.availableBalance
      }
    })

    res.json({ partners: partnersWithStats, total })
  } catch (error) {
    next(error)
  }
})

router.post('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { email, password, name, phone, percentage = 5.0 } = req.body

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const internalPartnerCode = uuidv4().substring(0, 8).toUpperCase()

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        role: 'PARTNER'
      }
    })

    const partner = await prisma.partner.create({
      data: {
        userId: user.id,
        percentage,
        referralCode: internalPartnerCode
      },
      include: {
        user: { select: { id: true, email: true, name: true } }
      }
    })

    res.status(201).json({ partner })
  } catch (error) {
    next(error)
  }
})

router.put('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { percentage, isActive } = req.body

    const partner = await prisma.partner.update({
      where: { id: parseInt(req.params.id) },
      data: {
        percentage: percentage !== undefined ? percentage : undefined,
        isActive: isActive !== undefined ? isActive : undefined
      },
      include: {
        user: { select: { id: true, email: true, name: true } }
      }
    })

    res.json({ partner })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        user: { select: { id: true, email: true, name: true, phone: true, createdAt: true } },
        partnerUsers: {
          include: {
            user: { select: { id: true, email: true, name: true, createdAt: true } }
          },
          orderBy: { boundAt: 'desc' }
        },
        commissions: {
          where: { order: { paymentStatus: 'PAID' } },
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        promoCodes: true
      }
    })

    if (!partner) {
      return res.status(404).json({ error: 'Партнёр не найден' })
    }

    const totalCommission = partner.commissions.reduce((sum, c) => sum + c.amount, 0)

    const recentOrders = await prisma.order.findMany({
      where: {
        commission: { partnerId: parseInt(req.params.id) },
        paymentStatus: 'PAID'
      },
      include: {
        items: { include: { product: { select: { title: true } } } },
        user: { select: { email: true, name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    })

    const { referralCode, ...partnerWithoutReferralCode } = partner
    res.json({
      partner: {
        ...partnerWithoutReferralCode,
        totalCommission,
        user: partner.user,
        users: partner.partnerUsers.map(pu => ({
          id: pu.user.id,
          email: pu.user.email,
          name: pu.user.name,
          boundAt: pu.boundAt
        })),
        recentOrders: recentOrders.map(o => ({
          id: o.id,
          total: o.total,
          status: o.status,
          createdAt: o.createdAt,
          user: o.user,
          items: o.items
        }))
      }
    })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { user: true }
    })

    if (!partner) {
      return res.status(404).json({ error: 'Партнёр не найден' })
    }

    await prisma.partner.delete({
      where: { id: parseInt(req.params.id) }
    })

    await prisma.user.update({
      where: { id: partner.userId },
      data: { role: 'USER' }
    })

    res.json({ message: 'Partner deleted' })
  } catch (error) {
    next(error)
  }
})

export default router
