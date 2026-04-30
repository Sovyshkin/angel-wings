import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'

const router = Router()
const prisma = new PrismaClient()

router.get('/partners', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        include: {
          user: { select: { id: true, email: true, name: true, createdAt: true } },
          _count: { select: { partnerUsers: true, commissions: true } },
          commissions: { select: { amount: true } }
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.partner.count()
    ])

    const partnersWithStats = partners.map(p => {
      const totalCommission = p.commissions.reduce((sum, c) => sum + c.amount, 0)
      return {
        id: p.id,
        user: p.user,
        percentage: p.percentage,
        referralCode: p.referralCode,
        isActive: p.isActive,
        createdAt: p.createdAt,
        usersCount: p._count.partnerUsers,
        ordersCount: p._count.commissions,
        totalCommission
      }
    })

    res.json({ partners: partnersWithStats, total })
  } catch (error) {
    next(error)
  }
})

router.post('/partners', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { email, password, name, phone, percentage = 5.0 } = req.body

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const referralCode = uuidv4().substring(0, 8).toUpperCase()

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
        referralCode
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

router.put('/partners/:id', authenticate, requireAdmin, async (req, res, next) => {
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

router.delete('/partners/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const partner = await prisma.partner.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { user: true }
    })

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' })
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

router.get('/promo-codes', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, partnerId } = req.query

    const where = partnerId ? { partnerId: parseInt(partnerId) } : {}

    const [promoCodes, total] = await Promise.all([
      prisma.promoCode.findMany({
        where,
        include: {
          partner: { select: { id: true, referralCode: true, user: { select: { name: true } } } }
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
      maxActivations = 1,
      startDate,
      endDate,
      minOrderAmount,
      isFirstPurchase = false,
      partnerId
    } = req.body

    const existing = await prisma.promoCode.findUnique({ where: { code } })
    if (existing) {
      return res.status(400).json({ error: 'Promo code already exists' })
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue,
        usageType,
        maxActivations,
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
    if (maxActivations !== undefined) data.maxActivations = maxActivations
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
          partner: { select: { id: true, referralCode: true, user: { select: { name: true } } } },
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
      return res.status(400).json({ error: 'User is already bound to a partner. Unbind first.' })
    }

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId }
    })

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' })
    }

    const partnerUser = await prisma.partnerUser.create({
      data: {
        userId,
        partnerId,
        referralSource: 'admin_assignment'
      },
      include: {
        user: { select: { id: true, email: true, name: true } },
        partner: { select: { id: true, referralCode: true } }
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

    const where = {}
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
          partner: { select: { id: true, referralCode: true, user: { select: { name: true } } } },
          order: { select: { id: true, total: true, createdAt: true, user: { select: { email: true, name: true } } } }
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
    const { limit = 50, offset = 0, partnerId, status } = req.query

    const where = {}
    if (partnerId) where.partnerId = parseInt(partnerId)
    if (status) where.status = status

    const [payments, total] = await Promise.all([
      prisma.partnerPayment.findMany({
        where,
        include: {
          partner: { select: { id: true, referralCode: true, user: { select: { name: true } } } }
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.partnerPayment.count({ where })
    ])

    res.json({ payments, total })
  } catch (error) {
    next(error)
  }
})

router.post('/payments', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { partnerId, amount, status = 'PENDING' } = req.body

    const payment = await prisma.partnerPayment.create({
      data: {
        partnerId,
        amount,
        status
      }
    })

    res.status(201).json({ payment })
  } catch (error) {
    next(error)
  }
})

router.put('/payments/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body

    const data = { status }
    if (status === 'PAID') {
      data.paidAt = new Date()
    }

    const payment = await prisma.partnerPayment.update({
      where: { id: parseInt(req.params.id) },
      data
    })

    res.json({ payment })
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

export default router