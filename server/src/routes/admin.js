import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { upload } from '../utils/fileUpload.js'
import tochkaService from '../services/tochka.js'

const router = Router()
const prisma = new PrismaClient()

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
      prisma.user.count(),
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
    const { limit = 50, offset = 0 } = req.query
    
    const [users, total] = await Promise.all([
      prisma.user.findMany({
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
      prisma.user.count()
    ])
    
    res.json({ users, total })
  } catch (error) {
    next(error)
  }
})

router.post('/users', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { email, password, name, role = 'USER', phone } = req.body

    if (typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Пароль должен содержать минимум 6 символов' })
    }
    
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' })
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role, phone },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        createdAt: true
      }
    })
    
    res.status(201).json({ user })
  } catch (error) {
    next(error)
  }
})

router.put('/users/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { name, role, phone } = req.body
    
    const user = await prisma.user.update({
      where: { id: parseInt(req.params.id) },
      data: { name, role, phone }
    })
    
    res.json({ user })
  } catch (error) {
    next(error)
  }
})

router.delete('/users/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    await prisma.user.delete({
      where: { id: parseInt(req.params.id) }
    })
    
    res.json({ message: 'User deleted' })
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
              product: { select: { title: true } }
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
    
    const maybeUnsynced = orders.filter(order => order.paymentId && order.paymentStatus !== 'PAID')
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
    const { status } = req.body

    const order = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: { status }
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
