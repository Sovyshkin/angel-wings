import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import cdek from '../services/cdek.js'
import { extractLatestCdekStatus, mapCdekStatusToLocal } from '../utils/cdekStatus.js'

const router = Router()
const prisma = new PrismaClient()
const VALID_STATUSES = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

function getDosagePriceFromSpecs(product, selectedDosage) {
  if (!selectedDosage || !product?.specs) return null

  try {
    const specs = typeof product.specs === 'string' ? JSON.parse(product.specs) : product.specs
    const dosages = Array.isArray(specs?.dosages) ? specs.dosages : []
    const matched = dosages.find(d => typeof d?.dosage === 'string' && d.dosage.trim() === selectedDosage.trim())
    if (!matched) return null
    if (matched.price === undefined || matched.price === null || matched.price === '') return null
    return Math.max(0, parseFloat(matched.price) || 0)
  } catch {
    return null
  }
}

async function applyPromoCode(code, userId) {
  const promoCode = await prisma.promoCode.findUnique({
    where: { code: code.toUpperCase() }
  })

  if (!promoCode || !promoCode.isActive) {
    return { error: 'Промокод не найден или неактивен' }
  }

  if (promoCode.startDate && new Date() < promoCode.startDate) {
    return { error: 'Промокод ещё не активен' }
  }

  if (promoCode.endDate && new Date() > promoCode.endDate) {
    return { error: 'Срок действия промокода истёк' }
  }

  if (promoCode.usageType === 'single' && promoCode.activationCount >= 1) {
    return { error: 'Промокод достиг лимита использований' }
  }

  if (promoCode.usageType === 'multi' && promoCode.activationCount >= promoCode.maxActivations) {
    return { error: 'Промокод достиг лимита использований' }
  }

  if (promoCode.isFirstPurchase) {
    const hasExistingOrders = await prisma.order.count({ where: { userId } }) > 0
    if (hasExistingOrders) {
      return { error: 'Этот промокод только для первого заказа' }
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

// Создание заказа - требуется авторизация
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { 
      items, 
      customerName, 
      customerEmail, 
      customerPhone, 
      shippingAddress, 
      notes, 
      userId, 
      promoCode,
      delivery 
    } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Корзина пуста' })
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
        return res.status(400).json({ error: `Товар ${item.productId} не найден` })
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Недостаточно товара "${product.title}"` })
      }

      const dosagePrice = getDosagePriceFromSpecs(product, item.selectedDosage)
      const price = dosagePrice !== null ? dosagePrice : parseFloat(product.price)
      total += price * item.quantity
      orderItems.push({
        productId: item.productId,
        dosage: item.selectedDosage || null,
        quantity: item.quantity,
        price
      })
    }

    // Add delivery price to total
    const deliveryPrice = delivery?.price || 0
    const orderTotal = total + deliveryPrice

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
        if (orderTotal < promoResult.minOrderAmount) {
          return res.status(400).json({
            error: `Минимальная сумма заказа для этого промокода: ${promoResult.minOrderAmount}`
          })
        }
        appliedPromoCode = promoResult.code
      } else if (promoResult.promoCode) {
        appliedPromoCode = promoResult.promoCode
      }

      if (appliedPromoCode) {
        promoCodeId = appliedPromoCode.id

        if (appliedPromoCode.discountType === 'percentage') {
          discountAmount = orderTotal * (appliedPromoCode.discountValue / 100)
        } else {
          discountAmount = Math.min(appliedPromoCode.discountValue, orderTotal)
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
          total: orderTotal - discountAmount,
          userId: actualUserId,
          promoCodeId,
          discountAmount,
          partnerId,
          // Delivery info
          deliveryTariffCode: delivery?.tariff_code,
          deliveryTariffName: delivery?.tariff_name,
          deliveryPrice: deliveryPrice,
          deliveryCity: delivery?.city,
          deliveryPickupPoint: delivery?.pickup_point,
          deliveryPickupName: delivery?.pickup_point_name,
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
        const commissionTotal = orderTotal - discountAmount
        const partner = await tx.partner.findUnique({
          where: { id: partnerId }
        })

        if (partner && partner.isActive) {
          const percentage = partner.percentage || 5.0
          const commissionAmount = commissionTotal * (percentage / 100)

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

    const statusMetaByOrderId = new Map()
    const ordersWithCdek = orders.filter(order => Boolean(order.cdekOrderUuid))

    if (ordersWithCdek.length) {
      const cdekResults = await Promise.allSettled(
        ordersWithCdek.map(async (order) => {
          const cdekOrder = await cdek.getOrder(order.cdekOrderUuid)
          const latestStatus = extractLatestCdekStatus(cdekOrder)
          const mappedLocalStatus = mapCdekStatusToLocal(latestStatus?.code)

          if (mappedLocalStatus && mappedLocalStatus !== order.status) {
            await prisma.order.update({
              where: { id: order.id },
              data: { status: mappedLocalStatus }
            })
          }

          return {
            orderId: order.id,
            source: 'cdek',
            cdekStatusCode: latestStatus?.code || null,
            cdekStatusName: latestStatus?.name || null,
            cdekStatusDate: latestStatus?.dateTime || null,
            mappedLocalStatus
          }
        })
      )

      for (const result of cdekResults) {
        if (result.status !== 'fulfilled') continue
        statusMetaByOrderId.set(result.value.orderId, result.value)
      }
    }

    const responseOrders = orders.map((order) => {
      const meta = statusMetaByOrderId.get(order.id)
      const effectiveStatus = meta?.mappedLocalStatus || order.status
      return {
        ...order,
        status: effectiveStatus,
        deliveryStatusSource: meta?.source || 'local',
        cdekStatusCode: meta?.cdekStatusCode || null,
        cdekStatusName: meta?.cdekStatusName || null,
        cdekStatusDate: meta?.cdekStatusDate || null
      }
    })

    res.json({ orders: responseOrders })
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
      return res.status(404).json({ error: 'Заказ не найден' })
    }
    
    if (order.userId && order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Доступ запрещён' })
    }
    
    res.json({ order })
  } catch (error) {
    next(error)
  }
})

// Привязка CDEK UUID к заказу (для заказов пользователя/админа)
router.put('/:id/cdek-link', authenticate, async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id)
    const { cdekOrderUuid } = req.body

    if (!cdekOrderUuid || typeof cdekOrderUuid !== 'string') {
      return res.status(400).json({ error: 'Необходимо указать cdekOrderUuid' })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, cdekOrderUuid: true }
    })

    if (!order) {
      return res.status(404).json({ error: 'Заказ не найден' })
    }

    if (order.userId && order.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Доступ запрещён' })
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { cdekOrderUuid: cdekOrderUuid.trim() }
    })

    res.json({ order: updatedOrder })
  } catch (error) {
    next(error)
  }
})

router.put('/:id/status', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body
    
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Неверный статус' })
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
