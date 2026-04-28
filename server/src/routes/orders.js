import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()
const VALID_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { items, customerName, customerEmail, customerPhone, shippingAddress, notes, userId } = req.body
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' })
    }
    
    const productIds = items.map(item => item.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    })
    
    const productMap = new Map(products.map(p => [p.id, p]))
    
    let total = 0
    const orderItems = []
    
    for (const item of items) {
      const product = productMap.get(item.productId)
      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` })
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Not enough stock for ${product.title}` })
      }
      
      const price = parseFloat(product.price)
      total += price * item.quantity
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        price
      })
    }
    
    const order = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        })
      }
      
      return tx.order.create({
        data: {
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress,
          notes,
          total,
          userId: req.user?.id || userId || null,
          items: {
            create: orderItems
          }
        },
        include: {
          items: {
            include: {
              product: {
                select: { title: true, image: true }
              }
            }
          }
        }
      })
    })
    
    res.status(201).json({ order })
  } catch (error) {
    next(error)
  }
})

router.get('/my', authenticate, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: {
              select: { title: true, image: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
    
    res.json({ orders })
  } catch (error) {
    next(error)
  }
})

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        items: {
          include: {
            product: {
              select: { title: true, image: true, price: true }
            }
          }
        },
        user: {
          select: { email: true, name: true }
        }
      }
    })
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' })
    }
    
    if (order.userId && order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' })
    }
    
    res.json({ order })
  } catch (error) {
    next(error)
  }
})

router.put('/:id/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body
    
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }
    
    const order = await prisma.order.update({
      where: { id: parseInt(req.params.id) },
      data: { status }
    })
    
    res.json({ order })
  } catch (error) {
    next(error)
  }
})

export default router