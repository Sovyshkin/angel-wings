import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { upload } from '../utils/fileUpload.js'
import tochkaService from '../services/tochka.js'
import { v4 as uuidv4 } from 'uuid'
import { validateBasicPassword, validatePasswordPolicy } from '../utils/passwordPolicy.js'

const router = Router()
const prisma = new PrismaClient()
const ALLOWED_USER_ROLES = ['USER', 'ADMIN', 'PARTNER']

async function generatePartnerReferralCode(tx = prisma) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const code = uuidv4().replace(/-/g, '').slice(0, 8).toUpperCase()
    const existing = await tx.partner.findUnique({ where: { referralCode: code } })
    if (!existing) return code
  }

  return `P${Date.now().toString(36).toUpperCase()}`
}

async function ensurePartnerForUser(tx, userId) {
  const existingPartner = await tx.partner.findUnique({ where: { userId } })

  if (existingPartner) {
    if (!existingPartner.isActive) {
      return tx.partner.update({
        where: { id: existingPartner.id },
        data: { isActive: true }
      })
    }
    return existingPartner
  }

  return tx.partner.create({
    data: {
      userId,
      percentage: 5,
      referralCode: await generatePartnerReferralCode(tx),
      isActive: true
    }
  })
}

function normalizePaymentStatus(status) {
  const raw = String(status || '').trim().toUpperCase()

  if (!raw) return 'PENDING'
  if (['PAID', 'APPROVED', 'SUCCESS', 'SUCCEEDED', 'COMPLETED', 'AUTHORIZED', 'CAPTURED', 'EXECUTED', 'SETTLED'].some(code => raw.includes(code))) {
    return 'PAID'
  }
  if (['CANCEL', 'FAILED', 'ERROR', 'EXPIRED', 'REFUND', 'REJECT', 'DECLIN'].some(code => raw.includes(code))) {
    return 'FAILED'
  }
  return 'PENDING'
}

function parseImagesField(images) {
  if (!images) return []
  if (Array.isArray(images)) return images
  try {
    const parsed = JSON.parse(images)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

router.get('/stats', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const [usersCount, productsCount, ordersCount, recentOrders, lowStock] = await Promise.all([
      prisma.user.count({ where: { role: { not: 'DELETED' } } }),
      prisma.product.count(),
      prisma.order.count(),
      prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          items: { include: { product: { select: { title: true } } } }
        }
      }),
      prisma.product.findMany({
        where: { stock: { lte: 10 } },
        select: { id: true, title: true, stock: true }
      })
    ])
    
    const totalRevenue = await prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { not: 'CANCELLED' } }
    })
    
    res.json({
      stats: {
        usersCount,
        productsCount,
        ordersCount,
        totalRevenue: totalRevenue._sum.total || 0,
        recentOrders,
        lowStock
      }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/users', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, q = '' } = req.query
    const search = String(q || '').trim()
    const where = { role: { not: 'DELETED' } }

    if (search) {
      const numericId = Number.parseInt(search, 10)
      const digitsSearch = search.replace(/\D/g, '')
      where.OR = [
        ...(Number.isFinite(numericId) ? [{ id: numericId }] : []),
        { email: { contains: search } },
        { name: { contains: search } },
        ...(digitsSearch ? [{ phone: { contains: digitsSearch } }] : []),
        { phone: { contains: search } }
      ]
    }
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          createdAt: true,
          _count: { select: { orders: true } }
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ])
    
    res.json({ users, total })
  } catch (error) {
    next(error)
  }
})

router.get('/users/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const userId = Number.parseInt(req.params.id, 10)
    if (!Number.isFinite(userId) || userId <= 0) {
      return res.status(400).json({ error: 'Некорректный ID пользователя' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        createdAt: true,
        partner: {
          select: {
            id: true,
            percentage: true,
            isActive: true,
            promoCodes: {
              select: { id: true, code: true, discountType: true, discountValue: true, isActive: true }
            }
          }
        },
        partnerUser: {
          select: {
            boundAt: true,
            partner: {
              select: {
                id: true,
                percentage: true,
                user: { select: { name: true, email: true } }
              }
            }
          }
        },
        orders: {
          include: {
            items: {
              include: {
                product: {
                  select: { id: true, title: true, image: true, price: true }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!user || user.role === 'DELETED') {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    const promoCodeIds = [...new Set(user.orders.map(order => order.promoCodeId).filter(Boolean))]
    const promoCodes = promoCodeIds.length
      ? await prisma.promoCode.findMany({
          where: { id: { in: promoCodeIds } },
          include: {
            partner: {
              include: {
                user: { select: { id: true, name: true, email: true } }
              }
            }
          }
        })
      : []
    const promoCodeMap = new Map(promoCodes.map(promoCode => [promoCode.id, promoCode]))
    const orders = user.orders.map(order => ({
      ...order,
      promoCode: order.promoCodeId ? promoCodeMap.get(order.promoCodeId) || null : null
    }))

    const paidStatuses = new Set(['PAID', 'CASH_ON_DELIVERY'])
    const successfulOrders = orders.filter(order =>
      !['CANCELLED', 'RETURNED'].includes(order.status) && paidStatuses.has(String(order.paymentStatus || '').toUpperCase())
    )
    const totalSpent = successfulOrders.reduce((sum, order) => sum + Number(order.total || 0), 0)
    const products = new Map()

    for (const order of successfulOrders) {
      for (const item of order.items || []) {
        const current = products.get(item.productId) || {
          productId: item.productId,
          title: item.product?.title || `Товар #${item.productId}`,
          units: 0,
          revenue: 0
        }
        current.units += Number(item.quantity || 0)
        current.revenue += Number(item.price || 0) * Number(item.quantity || 0)
        products.set(item.productId, current)
      }
    }

    const stats = {
      totalOrders: orders.length,
      successfulOrders: successfulOrders.length,
      cancelledOrders: orders.filter(order => order.status === 'CANCELLED').length,
      returnedOrders: orders.filter(order => order.status === 'RETURNED').length,
      totalSpent,
      avgOrderValue: successfulOrders.length ? totalSpent / successfulOrders.length : 0,
      lastOrderAt: orders[0]?.createdAt || null,
      favoriteProducts: [...products.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
    }

    res.json({ user: { ...user, orders }, stats })
  } catch (error) {
    next(error)
  }
})

router.post('/users', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { email, password, name, role = 'USER', phone } = req.body
    const normalizedRole = String(role || 'USER').toUpperCase()

    const passwordError = normalizedRole === 'ADMIN'
      ? validatePasswordPolicy(password, { email, name })
      : validateBasicPassword(password)
    if (passwordError) return res.status(400).json({ error: passwordError })

    if (!ALLOWED_USER_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ error: 'Некорректная роль пользователя' })
    }
    
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' })
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: { email, password: hashedPassword, name, role: normalizedRole, phone },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          createdAt: true
        }
      })

      if (normalizedRole === 'PARTNER') {
        await ensurePartnerForUser(tx, createdUser.id)
      }

      return createdUser
    })
    
    res.status(201).json({ user })
  } catch (error) {
    next(error)
  }
})

router.put('/users/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { name, role, phone, password } = req.body
    const userId = parseInt(req.params.id)
    const normalizedRole = role !== undefined ? String(role).toUpperCase() : undefined

    if (normalizedRole !== undefined && !ALLOWED_USER_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ error: 'Некорректная роль пользователя' })
    }
    
    const passwordUpdate = {}
    if (normalizedRole === 'ADMIN') {
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true }
      })
      const passwordError = validatePasswordPolicy(password, {
        email: currentUser?.email,
        name: name || currentUser?.name
      })
      if (passwordError) return res.status(400).json({ error: passwordError })
      passwordUpdate.password = await bcrypt.hash(password, 10)
    }

    const user = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          name,
          role: normalizedRole,
          phone,
          ...passwordUpdate
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          createdAt: true,
          _count: { select: { orders: true } }
        }
      })

      if (normalizedRole === 'PARTNER') {
        await ensurePartnerForUser(tx, userId)
      } else if (normalizedRole && normalizedRole !== 'PARTNER') {
        await tx.partner.updateMany({
          where: { userId },
          data: { isActive: false }
        })
      }

      return updatedUser
    })
    
    res.json({ user })
  } catch (error) {
    next(error)
  }
})

router.delete('/users/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id)

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Нельзя архивировать свою учётную запись' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true }
    })

    if (!user || user.role === 'DELETED') {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    const archivedEmail = `archived-user-${userId}-${Date.now()}@angel-wings.local`
    const archivedPassword = await bcrypt.hash(`archived-${userId}-${Date.now()}`, 10)

    await prisma.user.update({
      where: { id: userId },
      data: {
        email: archivedEmail,
        password: archivedPassword,
        name: `Архивный пользователь #${userId}`,
        role: 'DELETED',
        phone: null,
        address: null
      }
    })
    
    res.json({ message: 'Пользователь архивирован' })
  } catch (error) {
    next(error)
  }
})

router.get('/orders', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query
    
    const where = status ? { status } : {}
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: { select: { title: true, image: true } }
            }
          },
          user: { select: { email: true, name: true } }
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where })
    ])

    const promoCodeIds = [...new Set(orders.map(order => order.promoCodeId).filter(Boolean))]
    const promoCodes = promoCodeIds.length
      ? await prisma.promoCode.findMany({
          where: { id: { in: promoCodeIds } },
          select: {
            id: true,
            code: true,
            partnerId: true,
            partner: {
              select: {
                id: true,
                user: {
                  select: {
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        })
      : []
    const promoById = new Map(promoCodes.map(promo => [promo.id, promo]))
    for (const order of orders) {
      order.promoCode = order.promoCodeId ? (promoById.get(order.promoCodeId) || null) : null
    }
    
    const maybeUnsynced = orders
      .filter(order => order.paymentId && order.paymentStatus !== 'PAID')
      .slice(0, 10)
    if (maybeUnsynced.length) {
      const syncResults = await Promise.allSettled(
        maybeUnsynced.map(async (order) => {
          const statusResult = await tochkaService.getPaymentStatus(order.paymentId)
          if (!statusResult.success) return null
          const normalized = normalizePaymentStatus(statusResult.status)
          if (normalized === order.paymentStatus) return null

          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: normalized }
          })
          return { id: order.id, paymentStatus: normalized }
        })
      )

      const updates = new Map(
        syncResults
          .filter(item => item.status === 'fulfilled' && item.value)
          .map(item => [item.value.id, item.value.paymentStatus])
      )
      if (updates.size) {
        for (const order of orders) {
          if (updates.has(order.id)) {
            order.paymentStatus = updates.get(order.id)
          }
        }
      }
    }

    res.json({ orders, total })
  } catch (error) {
    next(error)
  }
})

router.put('/orders/:id/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status, cancelReason } = req.body
    const normalizedStatus = String(status || '').trim().toUpperCase()
    const allowedStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'RETURNED', 'CANCELLED']

    if (!allowedStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ error: 'Некорректный статус заказа' })
    }

    const order = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: {
        status: normalizedStatus,
        cancelReason: normalizedStatus === 'CANCELLED'
          ? (String(cancelReason || 'other').trim() || 'other')
          : null
      }
    })

    res.json({ order })
  } catch (error) {
    next(error)
  }
})

router.put('/orders/:id/payment-status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id, 10)
    const { paymentStatus } = req.body
    const allowedStatuses = ['PENDING', 'PAID', 'FAILED']
    const normalizedStatus = String(paymentStatus || '').trim().toUpperCase()

    if (!Number.isFinite(orderId)) {
      return res.status(400).json({ error: 'Некорректный ID заказа' })
    }

    if (!allowedStatuses.includes(normalizedStatus)) {
      return res.status(400).json({ error: 'Некорректный статус оплаты' })
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: normalizedStatus }
    })

    res.json({ order })
  } catch (error) {
    next(error)
  }
})

router.put('/orders/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { cdekOrderUuid, deliveryTariffCode, deliveryTariffName, deliveryPrice, deliveryCity, deliveryPickupPoint, deliveryPickupName } = req.body

    const order = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(cdekOrderUuid !== undefined && { cdekOrderUuid }),
        ...(deliveryTariffCode !== undefined && { deliveryTariffCode }),
        ...(deliveryTariffName !== undefined && { deliveryTariffName }),
        ...(deliveryPrice !== undefined && { deliveryPrice }),
        ...(deliveryCity !== undefined && { deliveryCity }),
        ...(deliveryPickupPoint !== undefined && { deliveryPickupPoint }),
        ...(deliveryPickupName !== undefined && { deliveryPickupName })
      }
    })

    res.json({ order })
  } catch (error) {
    next(error)
  }
})

router.delete('/orders/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id)

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true }
    })

    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' })
    }

    if (order.status !== 'CANCELLED') {
      return res.status(400).json({ error: 'Удалять можно только отменённые заказы' })
    }

    await prisma.$transaction(async (tx) => {
      await tx.partnerCommission.deleteMany({
        where: { orderId }
      })
      await tx.orderItem.deleteMany({
        where: { orderId }
      })
      await tx.order.delete({
        where: { id: orderId }
      })
    })

    res.json({ message: 'Заказ удалён' })
  } catch (error) {
    next(error)
  }
})

router.get('/products', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { active, limit = 100, offset = 0 } = req.query

    const where = {}
    if (active !== undefined) {
      where.active = active === 'true'
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          categories: { select: { id: true, name: true, slug: true } }
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: [{ active: 'desc' }, { createdAt: 'desc' }]
      }),
      prisma.product.count({ where })
    ])

    const parsedProducts = products.map(p => ({
      ...p,
      specs: p.specs ? JSON.parse(p.specs) : {},
      images: parseImagesField(p.images)
    }))

    res.json({ products: parsedProducts, total })
  } catch (error) {
    next(error)
  }
})

router.get('/products/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        categories: { select: { id: true, name: true, slug: true } }
      }
    })

    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' })
    }

    const parsedProduct = {
      ...product,
      specs: product.specs ? JSON.parse(product.specs) : {},
      images: parseImagesField(product.images)
    }

    res.json({ product: parsedProduct })
  } catch (error) {
    next(error)
  }
})

router.delete('/products/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await prisma.product.delete({
      where: { id: parseInt(req.params.id) }
    })
    res.json({ message: 'Товар удалён' })
  } catch (error) {
    next(error)
  }
})

export default router
