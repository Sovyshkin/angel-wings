import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

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
    
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ error: 'Email already exists' })
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
    
    res.json({ orders, total })
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
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ])

    const parsedProducts = products.map(p => ({
      ...p,
      specs: p.specs ? JSON.parse(p.specs) : {}
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
      return res.status(404).json({ error: 'Product not found' })
    }

    const parsedProduct = {
      ...product,
      specs: product.specs ? JSON.parse(product.specs) : {}
    }

    res.json({ product: parsedProduct })
  } catch (error) {
    next(error)
  }
})

export default router