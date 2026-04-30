import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()
const VALID_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

async function applyPromoCode(code, userId) {
  const promoCode = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase() }
  })

  if (!promoCode || !promoCode.isActive) {
    return { error: 'Promo code not found or inactive' }
  }

  if (promoCode.startDate && new Date() < promoCode.startDate) {
    return { error: 'Promo code is not yet active' }
  }

  if (promoCode.endDate && new Date() > promoCode.endDate) {
    return { error: 'Promo code has expired' }
  }

  if (promoCode.usageType === 'single' && promoCode.activationCount >= 1) {
    return { error: 'Promo code has reached its usage limit' }
  }

  if (promoCode.usageType === 'multi' && promoCode.activationCount >= promoCode.maxActivations) {
    return { error: 'Promo code has reached its usage limit' }
  }

  if (promoCode.isFirstPurchase) {
    const hasExistingOrders = await prisma.order.count({ where: { userId } }) > 0
    if (hasExistingOrders) {
      return { error: 'This promo code is only for first purchase' }
    }
  }

  if (promoCode.minOrderAmount) {
    return { minOrderAmount: promoCode.minOrderAmount, code: promoCode }
  }

  return { promoCode }
}

async function bindUserToPartner(userId, partnerId, promoCodeId = null, source = 'link') {
  const existing = await prisma.partnerUser.findUnique({
    where: { userId }
  })

  if (existing) {
    return { bound: false, reason: 'already_bound' }
  }

  const partner = await prisma.partner.findUnique({
    where: { id: partnerId }
  })

  if (!partner || !partner.isActive) {
    return { bound: false, reason: 'partner_not_found_or_inactive' }
  }

  await prisma.partnerUser.create({
    data: {
      userId,
      partnerId,
      promoCodeId,
      referralSource: source
    }
  })

  return { bound: true }
}

async function calculateCommission(orderId, partnerId, userId, orderTotal) {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId }
  })

  if (!partner || !partner.isActive) {
    return null
  }

  const percentage = partner.percentage || 5.0
  const amount = orderTotal * (percentage / 100)

  return prisma.partnerCommission.create({
    data: {
      partnerId,
      orderId,
      userId,
      amount,
      percentage
    }
  })
}

router.post('/', authenticate, async (req, res, next) => {
  try {
    const { items, customerName, customerEmail, customerPhone, shippingAddress, notes, userId, promoCode } = req.body

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

    let discountAmount = 0
    let appliedPromoCode = null
    let promoCodeId = null
    let partnerId = null

    if (promoCode) {
      const promoResult = await applyPromoCode(promoCode, req.user?.id || userId)

      if (promoResult.error) {
        return res.status(400).json({ error: promoResult.error })
      }

      if (promoResult.minOrderAmount) {
        if (total < promoResult.minOrderAmount) {
          return res.status(400).json({
            error: `Minimum order amount for this promo code is ${promoResult.minOrderAmount}`
          })
        }
        appliedPromoCode = promoResult.code
      } else if (promoResult.promoCode) {
        appliedPromoCode = promoResult.promoCode
      }

      if (appliedPromoCode) {
        promoCodeId = appliedPromoCode.id

        if (appliedPromoCode.discountType === 'percentage') {
          discountAmount = total * (appliedPromoCode.discountValue / 100)
        } else {
          discountAmount = Math.min(appliedPromoCode.discountValue, total)
        }

        if (appliedPromoCode.partnerId) {
          partnerId = appliedPromoCode.partnerId
        }
      }
    }

    const actualUserId = req.user?.id || userId || null

    if (!partnerId && actualUserId) {
      const existingBinding = await prisma.partnerUser.findUnique({
        where: { userId: actualUserId }
      })

      if (existingBinding) {
        partnerId = existingBinding.partnerId
      }
    }

    const order = await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } }
        })
      }

      if (appliedPromoCode) {
        await tx.promoCode.update({
          where: { id: appliedPromoCode.id },
          data: { activationCount: { increment: 1 } }
        })
      }

      const createdOrder = await tx.order.create({
        data: {
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress,
          notes,
          total: total - discountAmount,
          userId: actualUserId,
          promoCodeId,
          discountAmount,
          partnerId,
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

      if (partnerId && actualUserId) {
        const existingBinding = await tx.partnerUser.findUnique({
          where: { userId: actualUserId }
        })

        if (!existingBinding) {
          const promoCodeForBinding = appliedPromoCode ? promoCodeId : null
          await tx.partnerUser.create({
            data: {
              userId: actualUserId,
              partnerId,
              promoCodeId: promoCodeForBinding,
              referralSource: promoCode ? 'promo_code' : 'link'
            }
          })
        }
      }

      if (partnerId) {
        const orderTotal = total - discountAmount
        const partner = await tx.partner.findUnique({
          where: { id: partnerId }
        })

        if (partner && partner.isActive) {
          const percentage = partner.percentage || 5.0
          const commissionAmount = orderTotal * (percentage / 100)

          await tx.partnerCommission.create({
            data: {
              partnerId,
              orderId: createdOrder.id,
              userId: actualUserId,
              amount: commissionAmount,
              percentage
            }
          })
        }
      }

      return createdOrder
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