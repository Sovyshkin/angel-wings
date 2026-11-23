import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import ExcelJS from 'exceljs'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { calculatePartnerBalance } from '../utils/partnerBalance.js'
import { findUserByEmail, normalizeEmail } from '../utils/userEmail.js'
import emailService from '../services/email.js'
import { allocateOrderFinancials, allocateOrderItems, formatOrderComposition, getOrderProductCost, getOrderReportAmounts, getReportOrderWhere, getReportPartnerName } from '../utils/partnerOrdersReport.js'
import { getPaymentTypeLabel } from '../utils/paymentAcquiring.js'
import { getAcquiringSettings } from '../utils/acquiringSettings.js'
import { createPartnerOrdersDocx, createPartnerOrdersPdf } from '../utils/partnerOrdersDocuments.js'
import { parseReportPeriod } from '../utils/reportPeriod.js'

const router = Router()
const prisma = new PrismaClient()

function normalizePromoCodeValue(code) {
  return String(code || '').trim().toUpperCase()
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

function formatRubles(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2
  }).format(Number(value || 0))
}

function getOrderStatusLabel(status) {
  const labels = {
    PENDING: 'Ожидает',
    PROCESSING: 'В обработке',
    SHIPPED: 'Отправлен',
    DELIVERED: 'Доставлен',
    CANCELLED: 'Отменён'
  }
  return labels[status] || status || '—'
}

function getPaymentStatusLabel(status) {
  const labels = {
    PENDING: 'Ожидает оплаты',
    PAID: 'Оплачен',
    CASH_ON_DELIVERY: 'Наличными при получении',
    FAILED: 'Ошибка оплаты',
    CANCELLED: 'Отменён',
    REFUNDED: 'Возвращён'
  }
  return labels[status] || status || '—'
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

async function sendPartnerCreditEmail({ partner, amount, comment }) {
  const email = partner?.user?.email
  if (!email) return null

  const rawName = String(partner?.user?.name || 'партнёр')
  const rawComment = String(comment || '').trim()
  const safeName = escapeHtml(rawName)
  const safeAmount = escapeHtml(formatRubles(amount))
  const safeComment = escapeHtml(rawComment)

  return emailService.sendMail({
    to: email,
    subject: 'Вам начислены баллы Angel Wings',
    text: [
      `Здравствуйте, ${rawName}!`,
      '',
      `Вам начислено: ${formatRubles(amount)}`,
      rawComment ? `Комментарий: ${rawComment}` : '',
      '',
      'Баллы уже доступны в личном кабинете партнёра.',
      'Личный кабинет: https://angel-wings.ru/partner'
    ].filter(Boolean).join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:28px;background:#f6f7fb;color:#151722">
        <div style="background:#fff;border-radius:24px;padding:30px;border:1px solid #e7e9f2">
          <div style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#8da2ff;font-weight:700;margin-bottom:12px">Angel Wings</div>
          <h1 style="margin:0 0 14px;font-size:25px;line-height:1.2">Вам начислены баллы</h1>
          <p style="margin:0 0 20px;font-size:16px;line-height:1.55">Здравствуйте, ${safeName}! На ваш партнёрский баланс добавлено начисление.</p>
          <div style="background:#f3f5ff;border-radius:18px;padding:22px;margin:0 0 20px;border:1px solid #dfe5ff">
            <p style="margin:0 0 8px;color:#687087;font-size:14px">Сумма начисления</p>
            <div style="font-size:30px;font-weight:800;color:#22305f">${safeAmount}</div>
            ${safeComment ? `<p style="margin:18px 0 8px;color:#687087;font-size:14px">Комментарий</p><div style="font-size:16px;line-height:1.5;color:#151722">${safeComment}</div>` : ''}
          </div>
          <a href="https://angel-wings.ru/partner" style="display:block;text-align:center;background:#9fb3ff;color:#10131f;text-decoration:none;font-weight:700;border-radius:16px;padding:16px 20px">Открыть кабинет партнёра</a>
        </div>
      </div>
    `
  })
}

// Resource routes - placed before /:id to avoid conflicts
router.get('/promo-codes', authenticate, requireAdmin, async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
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

    if (partnerId) {
      const partner = await prisma.partner.findUnique({ where: { id: Number(partnerId) }, select: { isActive: true, archivedAt: true } })
      if (!partner?.isActive || partner.archivedAt) return res.status(400).json({ error: 'Нельзя создать промокод для партнёра, убранного из программы' })
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

    if (isActive === true || partnerId !== undefined) {
      const current = await prisma.promoCode.findUnique({ where: { id: Number(req.params.id) }, select: { partnerId: true } })
      const effectivePartnerId = partnerId !== undefined ? Number(partnerId) || null : current?.partnerId
      if (effectivePartnerId) {
        const partner = await prisma.partner.findUnique({ where: { id: effectivePartnerId }, select: { isActive: true, archivedAt: true } })
        if (!partner?.isActive || partner.archivedAt) return res.status(400).json({ error: 'Промокод партнёра, убранного из программы, нельзя включить повторно' })
      }
    }

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
    const promoCodeId = parseInt(req.params.id, 10)

    if (!Number.isInteger(promoCodeId)) {
      return res.status(400).json({ error: 'Некорректный идентификатор промокода' })
    }

    await prisma.$transaction(async (tx) => {
      // A code can remain referenced by partner bindings created through it.
      // Keep the partner binding but remove the deleted promo-code reference.
      await tx.partnerUser.updateMany({
        where: { promoCodeId },
        data: { promoCodeId: null }
      })

      await tx.promoCode.delete({
        where: { id: promoCodeId }
      })
    })

    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.json({ message: 'Promo code deleted', id: promoCodeId })
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
      where: { id: partnerId },
      select: { id: true, userId: true, isActive: true, archivedAt: true, user: { select: { role: true } } }
    })

    if (!partner || !partner.isActive || partner.archivedAt || partner.user?.role !== 'PARTNER' || partner.userId === userId) {
      return res.status(400).json({ error: 'Партнёр не найден или больше не активен' })
    }

    const partnerUser = await prisma.$transaction(async tx => {
      const binding = await tx.partnerUser.create({
        data: { userId, partnerId, referralSource: 'admin_assignment' },
        include: {
          user: { select: { id: true, email: true, name: true } },
          partner: { select: { id: true } }
        }
      })
      await tx.user.update({ where: { id: userId }, data: { partnerBindingDisabled: false } })
      return binding
    })

    res.json({ partnerUser })
  } catch (error) {
    next(error)
  }
})

router.delete('/partner-users/:userId', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const userId = Number(req.params.userId)
    if (!Number.isSafeInteger(userId) || userId <= 0) return res.status(400).json({ error: 'Некорректный пользователь' })
    await prisma.$transaction(async tx => {
      await tx.partnerUser.deleteMany({ where: { userId } })
      await tx.user.update({ where: { id: userId }, data: { partnerBindingDisabled: true } })
    })

    res.json({ message: 'Partner binding removed' })
  } catch (error) {
    next(error)
  }
})

router.get('/commissions', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { limit = 50, offset = 0, partnerId, startDate, endDate } = req.query

    const where = { order: { paymentStatus: 'PAID', status: { notIn: ['CANCELLED', 'RETURNED'] } } }
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

router.post('/:id/credits', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const partnerId = parseInt(req.params.id, 10)
    const amount = Number(req.body?.amount || 0)
    const comment = String(req.body?.comment || '').trim()

    if (!Number.isFinite(partnerId)) {
      return res.status(400).json({ error: 'Некорректный ID партнёра' })
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Укажите сумму начисления больше 0' })
    }

    if (amount > 1000000) {
      return res.status(400).json({ error: 'Сумма начисления слишком большая' })
    }

    if (!comment) {
      return res.status(400).json({ error: 'Укажите комментарий к начислению' })
    }

    if (comment.length > 700) {
      return res.status(400).json({ error: 'Комментарий должен быть короче 700 символов' })
    }

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        user: { select: { id: true, email: true, name: true, phone: true } }
      }
    })

    if (!partner) {
      return res.status(404).json({ error: 'Партнёр не найден' })
    }

    const payment = await prisma.partnerPayment.create({
      data: {
        partnerId,
        amount,
        type: 'ADMIN_CREDIT',
        status: 'PAID',
        comment,
        details: JSON.stringify({
          source: 'admin_manual_credit',
          comment,
          createdBy: req.user.id,
          notificationSeenAt: null
        }),
        processedBy: req.user.id,
        paidAt: new Date(),
        processedAt: new Date()
      }
    })

    let emailSent = false
    let emailError = null
    try {
      await sendPartnerCreditEmail({ partner, amount, comment })
      emailSent = true
    } catch (error) {
      emailError = error?.message || 'Не удалось отправить письмо'
      console.error('[PARTNER] credit email failed', JSON.stringify({
        partnerId,
        paymentId: payment.id,
        email: partner.user?.email || null,
        code: error?.code || error?.deliveryCode || null,
        message: emailError
      }))
    }

    res.status(201).json({
      payment: {
        ...payment,
        details: parsePaymentDetails(payment.details)
      },
      balance: await calculatePartnerBalance(prisma, partnerId),
      emailSent,
      emailError
    })
  } catch (error) {
    next(error)
  }
})

router.post('/:id/debits', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const partnerId = parseInt(req.params.id, 10)
    const mode = String(req.body?.mode || 'amount').trim()
    const requestedAmount = Number(req.body?.amount || 0)
    const comment = String(req.body?.comment || '').trim()

    if (!Number.isFinite(partnerId)) {
      return res.status(400).json({ error: 'Некорректный ID партнёра' })
    }

    if (comment.length > 700) {
      return res.status(400).json({ error: 'Комментарий должен быть короче 700 символов' })
    }

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { id: true }
    })

    if (!partner) {
      return res.status(404).json({ error: 'Партнёр не найден' })
    }

    const balanceBefore = await calculatePartnerBalance(prisma, partnerId)
    const availableBalance = Number(balanceBefore.availableBalance || 0)
    const amount = mode === 'reset' ? availableBalance : requestedAmount

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Укажите сумму списания больше 0' })
    }

    if (amount > availableBalance) {
      return res.status(400).json({ error: 'Нельзя списать больше доступного баланса партнёра' })
    }

    const normalizedAmount = Math.round(amount * 100) / 100
    const payment = await prisma.partnerPayment.create({
      data: {
        partnerId,
        amount: normalizedAmount,
        type: 'ADMIN_DEBIT',
        status: 'ADMIN_DEBITED',
        comment: comment || (mode === 'reset' ? 'Баланс обнулён администратором' : 'Ручное списание баллов'),
        details: JSON.stringify({
          source: mode === 'reset' ? 'admin_balance_reset' : 'admin_manual_debit',
          comment: comment || null,
          balanceBefore: availableBalance,
          createdBy: req.user.id
        }),
        processedBy: req.user.id,
        paidAt: new Date(),
        processedAt: new Date()
      }
    })

    res.status(201).json({
      payment: {
        ...payment,
        details: parsePaymentDetails(payment.details)
      },
      balance: await calculatePartnerBalance(prisma, partnerId)
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:id/transactions', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const partnerId = parseInt(req.params.id, 10)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25))
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0)
    const direction = String(req.query.direction || 'ALL').trim().toUpperCase()

    if (!Number.isFinite(partnerId)) {
      return res.status(400).json({ error: 'Некорректный ID партнёра' })
    }
    if (!['ALL', 'INCOME', 'OUTCOME'].includes(direction)) {
      return res.status(400).json({ error: 'Некорректный фильтр истории' })
    }

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      select: { id: true }
    })
    if (!partner) {
      return res.status(404).json({ error: 'Партнёр не найден' })
    }

    const includeCommissions = direction !== 'OUTCOME'
    const paymentWhere = {
      partnerId,
      ...(direction === 'INCOME'
        ? { type: 'ADMIN_CREDIT' }
        : direction === 'OUTCOME'
          ? { NOT: { type: 'ADMIN_CREDIT' }, status: { not: 'PAYOUT_REJECTED' } }
          : {})
    }
    const fetchLimit = offset + limit

    const [commissions, commissionCount, payments, paymentCount, balance] = await Promise.all([
      includeCommissions
        ? prisma.partnerCommission.findMany({
            where: { partnerId, order: { paymentStatus: 'PAID', status: { notIn: ['CANCELLED', 'RETURNED'] } } },
            include: { order: { select: { id: true, customerName: true, total: true } } },
            orderBy: { createdAt: 'desc' },
            take: fetchLimit
          })
        : [],
      includeCommissions
        ? prisma.partnerCommission.count({ where: { partnerId, order: { paymentStatus: 'PAID', status: { notIn: ['CANCELLED', 'RETURNED'] } } } })
        : 0,
      prisma.partnerPayment.findMany({
        where: paymentWhere,
        orderBy: { createdAt: 'desc' },
        take: fetchLimit
      }),
      prisma.partnerPayment.count({ where: paymentWhere }),
      calculatePartnerBalance(prisma, partnerId)
    ])

    const actorIds = [...new Set(payments.map(payment => payment.processedBy).filter(Boolean))]
    const actors = actorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: actorIds } },
          select: { id: true, name: true, email: true }
        })
      : []
    const actorsById = new Map(actors.map(actor => [actor.id, actor]))

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
        order: commission.order,
        actor: null,
        createdAt: commission.createdAt,
        processedAt: commission.createdAt
      })),
      ...payments.map(payment => {
        const details = parsePaymentDetails(payment.details)
        const isRejected = payment.status === 'PAYOUT_REJECTED'
        const isRefundedSpend = payment.status === 'ORDER_SPEND_REFUNDED'
        const paymentDirection = payment.type === 'ADMIN_CREDIT'
          ? 'INCOME'
          : isRejected || isRefundedSpend ? 'NEUTRAL' : 'OUTCOME'
        const title = isRefundedSpend
          ? 'Списание возвращено после отмены заказа'
          : payment.type === 'ADMIN_CREDIT'
            ? 'Начисление баллов администратором'
            : payment.type === 'ADMIN_DEBIT'
              ? 'Списание баллов администратором'
              : payment.type === 'ORDER_SPEND' || payment.status === 'SPENT_ON_ORDER'
                ? 'Оплата заказа баллами'
                : isRejected
                  ? 'Заявка на вывод отклонена'
                  : payment.status === 'PAYOUT_REQUESTED' || payment.status === 'PENDING'
                    ? 'Баллы зарезервированы для вывода'
                    : 'Вывод партнёрских баллов'

        return {
          id: `payment-${payment.id}`,
          sourceId: payment.id,
          type: payment.type || 'PAYOUT',
          direction: paymentDirection,
          status: payment.status,
          amount: payment.amount,
          title,
          description: payment.comment || details?.comment || null,
          order: null,
          actor: payment.processedBy ? actorsById.get(payment.processedBy) || null : null,
          createdAt: payment.createdAt,
          processedAt: payment.processedAt || payment.paidAt
        }
      })
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(offset, offset + limit)

    const total = commissionCount + paymentCount
    res.json({
      transactions,
      total,
      hasMore: offset + transactions.length < total,
      balance
    })
  } catch (error) {
    next(error)
  }
})

router.get('/stats/partner', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const [partnersCount, promoCodesCount, activeBindings, totalCommissions] = await Promise.all([
      prisma.partner.count({ where: { archivedAt: null } }),
      prisma.promoCode.count(),
      prisma.partnerUser.count(),
      prisma.partnerCommission.aggregate({
        where: { order: { paymentStatus: 'PAID', status: { notIn: ['CANCELLED', 'RETURNED'] } } },
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
    const archived = req.query.archived === 'true'
    const archiveFilter = { archivedAt: archived ? { not: null } : null }

    const [partners, total] = await Promise.all([
      prisma.partner.findMany({
        where: archiveFilter,
        include: {
          user: { select: { id: true, email: true, name: true, createdAt: true } },
          _count: { select: { partnerUsers: true, commissions: true } },
          commissions: {
            where: { order: { paymentStatus: 'PAID', status: { notIn: ['CANCELLED', 'RETURNED'] } } },
            select: { amount: true }
          }
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.partner.count({ where: archiveFilter })
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
    const { name, phone, percentage = 5.0 } = req.body
    const email = normalizeEmail(req.body.email)

    if (!email) {
      return res.status(400).json({ error: 'Укажите корректный email партнёра' })
    }

    const existing = await findUserByEmail(prisma, email)
    if (existing) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' })
    }

    const hashedPassword = await bcrypt.hash(uuidv4() + uuidv4(), 10)
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
    const existing = await prisma.partner.findUnique({ where: { id: parseInt(req.params.id) }, select: { archivedAt: true } })
    if (!existing) return res.status(404).json({ error: 'Партнёр не найден' })
    if (existing.archivedAt) return res.status(409).json({ error: 'Партнёр убран из программы и не может быть включён повторно через этот экран' })

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

router.get(['/orders-export/all', '/orders-export/all-orders'], authenticate, requireAdmin, async (req, res, next) => {
  try {
    const allOrders = req.path === '/orders-export/all-orders'
    const format = String(req.query.format || 'xlsx').toLowerCase()
    if (!['xlsx', 'docx', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'Доступные форматы: xlsx, docx, pdf' })
    }
    const periodWhere = parseReportPeriod(req.query)
    const periodLabel = req.query.dateFrom && req.query.dateTo ? ` · ${req.query.dateFrom} — ${req.query.dateTo}` : ''
    const partners = await prisma.partner.findMany({
      select: {
        id: true,
        user: { select: { name: true, email: true } },
        promoCodes: { select: { id: true, code: true } }
      }
    })
    const partnerById = new Map(partners.map(partner => [partner.id, partner]))
    const promoById = new Map(partners.flatMap(partner => partner.promoCodes.map(promo => [promo.id, { partnerId: partner.id, code: promo.code }])))
    const orders = await prisma.order.findMany({
      where: { ...getReportOrderWhere(allOrders, [...promoById.keys()]), ...periodWhere },
      include: {
        items: { include: { product: { select: { title: true, sku: true, costPrice: true, specs: true } } } },
        commission: { select: { partnerId: true, amount: true, percentage: true } }
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }]
    })

    const acquiringSettings = await getAcquiringSettings(prisma)
    const reportOrders = orders.map(order => {
      const promo = promoById.get(order.promoCodeId)
      const partnerId = order.partnerId || order.commission?.partnerId || promo?.partnerId
      const partner = partnerById.get(partnerId)
      const amounts = getOrderReportAmounts(order, acquiringSettings)
      return {
        id: order.id,
        createdAt: order.createdAt,
        partnerName: getReportPartnerName(partner, partnerId),
        partnerEmail: partner?.user?.email || '',
        customerName: order.customerName || '',
        customerPhone: order.customerPhone || '',
        customerEmail: order.customerEmail || '',
        promoCode: promo?.code || '',
        status: getOrderStatusLabel(order.status),
        paymentStatus: getPaymentStatusLabel(order.paymentStatus),
        paymentType: getPaymentTypeLabel(order.paymentType),
        total: Number(order.total || 0),
        productCost: getOrderProductCost(order),
        ...amounts,
        commission: amounts.revenue ? Number(order.commission?.amount || 0) : 0,
        commissionPercentage: order.commission?.percentage ?? null,
        items: allocateOrderFinancials(order, amounts).map(line => ({
          productTitle: line.item.product?.title || `Товар #${line.item.productId}`,
          title: `${line.item.product?.title || `Товар #${line.item.productId}`}${line.item.dosage ? `, ${line.item.dosage}` : ''}${line.item.adminUnbilled ? ' (в админке, без изменения оплаты)' : ''}`,
          sku: line.item.product?.sku || '',
          quantity: line.item.quantity,
          price: Number(line.item.price || 0),
          gross: line.gross,
          discount: line.discount,
          net: line.net,
          paid: line.paid,
          sitePaid: line.sitePaid,
          externalPaid: line.externalPaid,
          tax: line.tax,
          acquiring: line.acquiring,
          acquiringSource: line.externalPaid && !line.sitePaid ? 'Вне сайта — эквайринг 0 ₽' : amounts.acquiringSource,
          paymentType: line.externalPaid && !line.sitePaid ? 'Вне сайта' : getPaymentTypeLabel(order.paymentType),
          manuallyAdded: Boolean(line.item.adminAddedById || line.item.adminAddedAt || line.item.adminUnbilled),
          commission: line.commission,
          balance: line.balance,
          profit: line.profit,
          unitCost: line.unitCost,
          cost: line.cost
        }))
      }
    })
    const totals = reportOrders.reduce((result, order) => {
      result.revenue += order.revenue
      result.siteRevenue += order.siteRevenue
      result.externalRevenue += order.externalRevenue
      result.tax += order.tax
      result.acquiring += order.acquiring
      result.productCost = Math.round((result.productCost + order.productCost) * 100) / 100
      if (order.paymentStatus === 'Оплачен') result.paidCount++
      if (order.revenue && order.acquiringSource !== 'Фактическая сумма') result.estimatedCount++
      return result
    }, { revenue: 0, siteRevenue: 0, externalRevenue: 0, tax: 0, acquiring: 0, productCost: 0, paidCount: 0, estimatedCount: 0 })
    if (format !== 'xlsx') {
      const report = {
        title: `${allOrders ? 'Отчёт по всем заказам' : 'Отчёт по заказам всех партнёров'}${periodLabel}`,
        emptyMessage: allOrders ? 'Заказов пока нет.' : 'Заказов партнёров пока нет.',
        showCustomer: allOrders,
        orders: reportOrders,
        totals
      }
      const file = format === 'pdf' ? await createPartnerOrdersPdf(report) : await createPartnerOrdersDocx(report)
      const contentType = format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      const fileName = `${allOrders ? 'all-orders' : 'partners-orders'}-${new Date().toISOString().slice(0, 10)}.${format}`
      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
      res.setHeader('Cache-Control', 'no-store')
      return res.send(file)
    }
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Angel Wings'
    workbook.created = new Date()
    // The first sheet follows the supplied per-product orders ledger.
    const summary = workbook.addWorksheet('Заказы', { views: [{ state: 'frozen', ySplit: 1 }] })
    const detail = workbook.addWorksheet('Состав заказов', { views: [{ state: 'frozen', ySplit: 1 }] })
    summary.addRow(['номер заказа', 'дата/время', 'имя', 'номер', 'почта', 'доставка', 'статус', 'позиции', 'кол-во', 'фулпрайс', 'итого', 'промокод', 'Партнер', '% скидки', 'после скидки', 'Итого заказа', '% комиссии', 'размер комиссии', 'способ оплаты', '% эквайринг', 'размер эквайринг', 'НДС', 'УСН', 'Прибыль грязь', 'себес шт', 'себес х кол-во', 'Прибыль'])
    detail.columns = [
      { header: 'Заказ', width: 12 }, { header: 'Дата', width: 19 }, { header: 'Партнёр', width: 28 },
      { header: 'Товар', width: 44 }, { header: 'Артикул', width: 18 }, { header: 'Количество, шт.', width: 13 },
      { header: 'Цена за шт.', width: 16 }, { header: 'Сумма товара', width: 17 },
      { header: 'Доля скидки', width: 16 }, { header: 'После скидки', width: 17 },
      { header: 'Себестоимость за шт.', width: 16 }, { header: 'Себестоимость позиции', width: 17 },
      { header: 'Добавлено вручную', width: 21 }
    ]

    for (const order of reportOrders) {
      const itemRows = order.items.length ? order.items : [null]
      itemRows.forEach(item => {
        const positionAmounts = item || {
          paid: order.revenue, tax: order.tax, acquiring: order.acquiring,
          commission: order.commission,
          balance: Math.round((order.balance - order.commission) * 100) / 100
        }
        const rowNumber = summary.rowCount + 1
        const vat = Math.min(positionAmounts.tax, Math.round(positionAmounts.paid * 5 / 105 * 100) / 100)
        const usn = Math.round((positionAmounts.tax - vat) * 100) / 100
        const discountPercent = item?.gross ? item.discount / item.gross : 0
        const commissionPercent = order.commissionPercentage == null ? 0 : Number(order.commissionPercentage) / 100
        const acquiringPercent = item?.sitePaid ? item.acquiring / item.sitePaid : 0
        const manualNote = item?.manuallyAdded
          ? item.externalPaid && !item.sitePaid ? ' (добавлено вручную, оплата вне сайта)' : ' (добавлено вручную)'
          : ''
        const productName = item ? `${item.title}${manualNote}` : 'Нет позиций'
        const summaryRow = summary.addRow([
          order.id, order.createdAt, order.customerName, order.customerPhone, order.customerEmail,
          order.status, order.paymentStatus, productName, item?.quantity ?? null, item?.price ?? null,
          item ? { formula: `J${rowNumber}*I${rowNumber}`, result: item.gross } : null,
          order.promoCode || '—', order.partnerName, discountPercent,
          item ? { formula: `K${rowNumber}*(1-N${rowNumber})`, result: item.net } : null,
          order.total, commissionPercent, positionAmounts.commission,
          item?.paymentType || order.paymentType, acquiringPercent, positionAmounts.acquiring,
          vat, usn, positionAmounts.balance, item?.unitCost ?? null,
          item ? { formula: `Y${rowNumber}*I${rowNumber}`, result: item.cost } : null,
          item?.profit == null ? null : { formula: `X${rowNumber}-Z${rowNumber}`, result: item.profit }
        ])
        summaryRow.getCell(8).alignment = { vertical: 'middle', wrapText: true }
        summaryRow.height = Math.max(20, Math.ceil(productName.length / 35) * 16)
      })
      order.items.forEach((item, index) => {
        detail.addRow([
          index === 0 ? order.id : null, index === 0 ? order.createdAt : null, index === 0 ? order.partnerName : null,
          item.title, item.sku, item.quantity, item.price,
          item.gross, item.discount, item.net, item.unitCost, item.cost,
          item.manuallyAdded ? 'Да, администратором' : 'Нет'
        ])
      })
    }

    summary.columns = [
      { width: 14 }, { width: 19 }, { width: 27 }, { width: 20 }, { width: 30 },
      { width: 18 }, { width: 18 }, { width: 48 }, { width: 11 }, { width: 14 }, { width: 16 },
      { width: 18 }, { width: 27 }, { width: 13 }, { width: 17 }, { width: 18 },
      { width: 15 }, { width: 20 }, { width: 19 }, { width: 17 }, { width: 19 },
      { width: 16 }, { width: 16 }, { width: 19 }, { width: 15 }, { width: 18 }, { width: 19 }
    ]
    for (const [sheet, headerRow] of [[summary, 1], [detail, 1]]) {
      const header = sheet.getRow(headerRow)
      header.font = sheet === summary ? { name: 'Arial', size: 10, color: { argb: 'FF202020' } } : { bold: true, color: { argb: 'FFFFFFFF' } }
      if (sheet === detail) header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF20283F' } }
      header.alignment = { vertical: 'middle', wrapText: sheet === detail }
      header.height = sheet === summary ? 24 : 46
      if (sheet === detail) sheet.autoFilter = { from: 'A1', to: 'M1' }
      for (let rowIndex = headerRow + 1; rowIndex <= sheet.rowCount; rowIndex++) {
        const row = sheet.getRow(rowIndex)
        row.getCell(2).numFmt = 'dd.mm.yyyy hh:mm'
        for (const col of sheet === summary ? [10, 11, 15, 16, 18, 21, 22, 23, 24, 25, 26, 27] : [7, 8, 9, 10, 11, 12]) {
          row.getCell(col).numFmt = '#,##0.00 [$₽-419]'
        }
        if (sheet === summary) for (const col of [14, 17, 20]) row.getCell(col).numFmt = col === 20 ? '0.00%' : '0.0%'
      }
    }
    for (const col of [9, 10, 14]) summary.getRow(1).getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCFE2F3' } }
    for (const col of [17, 20, 25]) summary.getRow(1).getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC9DAF8' } }
    for (let rowIndex = 2; rowIndex <= summary.rowCount; rowIndex++) {
      for (const col of [9, 10, 14]) summary.getRow(rowIndex).getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCFE2F3' } }
      for (const col of [17, 20, 25]) summary.getRow(rowIndex).getCell(col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC9DAF8' } }
    }

    const fileName = `${allOrders ? 'all-orders' : 'partners-orders'}-${new Date().toISOString().slice(0, 10)}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.setHeader('Cache-Control', 'no-store')
    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    next(error)
  }
})

router.get('/:id/orders-export', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const format = String(req.query.format || 'xlsx').toLowerCase()
    if (!['xlsx', 'docx', 'pdf'].includes(format)) {
      return res.status(400).json({ error: 'Доступные форматы: xlsx, docx, pdf' })
    }
    const periodWhere = parseReportPeriod(req.query)
    const periodLabel = req.query.dateFrom && req.query.dateTo ? ` · ${req.query.dateFrom} — ${req.query.dateTo}` : ''
    const partnerId = parseInt(req.params.id, 10)
    if (!Number.isInteger(partnerId)) {
      return res.status(400).json({ error: 'Некорректный ID партнёра' })
    }

    const partner = await prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        user: { select: { name: true, email: true } },
        promoCodes: { select: { id: true, code: true } }
      }
    })

    if (!partner) {
      return res.status(404).json({ error: 'Партнёр не найден' })
    }

    const promoCodeIds = partner.promoCodes.map(promoCode => promoCode.id)
    const orderWhere = promoCodeIds.length
      ? {
          OR: [
            { promoCodeId: { in: promoCodeIds } },
            { commission: { partnerId } }
          ]
        }
      : { commission: { partnerId } }

    const orders = await prisma.order.findMany({
      where: { ...orderWhere, ...periodWhere },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        items: {
          include: { product: { select: { title: true, sku: true, costPrice: true, specs: true } } }
        },
        commission: { select: { partnerId: true, amount: true, percentage: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    const acquiringSettings = await getAcquiringSettings(prisma)
    if (format !== 'xlsx') {
      const promoCodeById = new Map(partner.promoCodes.map(promoCode => [promoCode.id, promoCode.code]))
      const reportOrders = orders.map(order => {
        const amounts = getOrderReportAmounts(order, acquiringSettings)
        return {
          id: order.id,
          createdAt: order.createdAt,
          partnerName: partner.user?.name || `Партнёр #${partner.id}`,
          promoCode: promoCodeById.get(order.promoCodeId) || '',
          status: getOrderStatusLabel(order.status),
          paymentStatus: getPaymentStatusLabel(order.paymentStatus),
          paymentType: getPaymentTypeLabel(order.paymentType),
          total: Number(order.total || 0),
          productCost: getOrderProductCost(order),
          ...amounts,
          commission: amounts.revenue ? Number(order.commission?.amount || 0) : 0,
          commissionPercentage: order.commission?.percentage ?? null,
          items: allocateOrderItems(order).map(line => ({
            title: `${line.item.product?.title || `Товар #${line.item.productId}`}${line.item.dosage ? `, ${line.item.dosage}` : ''}${line.item.adminUnbilled ? ' (в админке, без изменения оплаты)' : ''}`,
            quantity: line.item.quantity,
            price: Number(line.item.price || 0),
            gross: line.gross,
            discount: line.discount,
            net: line.net,
            unitCost: line.unitCost,
            cost: line.cost
          }))
        }
      })
      const totals = reportOrders.reduce((result, order) => {
        result.revenue += order.revenue
        result.tax += order.tax
        result.acquiring += order.acquiring
        result.productCost = Math.round((result.productCost + order.productCost) * 100) / 100
        if (order.paymentStatus === 'Оплачен') result.paidCount++
        if (order.revenue && order.acquiringSource !== 'Фактическая сумма') result.estimatedCount++
        return result
      }, { revenue: 0, tax: 0, acquiring: 0, productCost: 0, paidCount: 0, estimatedCount: 0 })
      const report = { title: `Отчёт по заказам партнёра ${partner.user?.name || `№${partner.id}`}${periodLabel}`, orders: reportOrders, totals }
      const file = format === 'pdf' ? await createPartnerOrdersPdf(report) : await createPartnerOrdersDocx(report)
      const contentType = format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      const fileName = `partner-${partnerId}-orders-${new Date().toISOString().slice(0, 10)}.${format}`
      res.setHeader('Content-Type', contentType)
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
      res.setHeader('Cache-Control', 'no-store')
      return res.send(file)
    }

    const promoCodeById = new Map(partner.promoCodes.map(promoCode => [promoCode.id, promoCode.code]))
    const workbook = new ExcelJS.Workbook()
    workbook.creator = 'Angel Wings'
    workbook.created = new Date()

    const sheet = workbook.addWorksheet('Заказы', {
      views: [{ state: 'frozen', ySplit: 1 }]
    })
    sheet.columns = [
      { header: 'Заказ', key: 'id', width: 12 },
      { header: 'Дата', key: 'createdAt', width: 18 },
      { header: 'Клиент', key: 'customerName', width: 24 },
      { header: 'Email', key: 'customerEmail', width: 30 },
      { header: 'Телефон', key: 'customerPhone', width: 18 },
      { header: 'Промокод', key: 'promoCode', width: 22 },
      { header: 'Товар', key: 'productName', width: 36 },
      { header: 'Количество, шт.', key: 'quantity', width: 13 },
      { header: 'Сумма заказа целиком (справочно)', key: 'total', width: 17 },
      { header: 'Скидка', key: 'discountAmount', width: 16 },
      { header: 'Доставка', key: 'deliveryPrice', width: 16 },
      { header: 'Статус заказа', key: 'status', width: 20 },
      { header: 'Статус оплаты', key: 'paymentStatus', width: 20 },
      { header: 'Способ оплаты', key: 'paymentType', width: 18 },
      { header: 'Налог позиции', key: 'tax', width: 16 },
      { header: 'Эквайринг позиции', key: 'acquiring', width: 16 },
      { header: 'Источник эквайринга', key: 'acquiringSource', width: 42 },
      { header: 'Комиссия партнёра за позицию', key: 'commissionAmount', width: 16 },
      { header: 'Процент комиссии', key: 'commissionPercentage', width: 14 },
      { header: 'Себестоимость за шт.', key: 'unitCost', width: 16 },
      { header: 'Себестоимость позиции', key: 'itemCost', width: 17 },
      { header: 'Себестоимость заказа', key: 'productCost', width: 17 },
      { header: 'Состав позиции', key: 'composition', width: 48 },
      { header: 'Цена товара после скидки', key: 'itemNet', width: 17 },
      { header: 'Сумма позиции для расчёта', key: 'paid', width: 17 },
      { header: 'Остаток позиции после налога, эквайринга и комиссии', key: 'balance', width: 18 },
      { header: 'Оценка прибыли позиции после себестоимости', key: 'profit', width: 18 },
      { header: 'Добавлено вручную', key: 'manuallyAdded', width: 21 },
      { header: 'Через сайт, доля', key: 'sitePaid', width: 17 },
      { header: 'Вне сайта, доля', key: 'externalPaid', width: 17 }
    ]

    orders.forEach(order => {
      const amounts = getOrderReportAmounts(order, acquiringSettings)
      const itemRows = allocateOrderFinancials(order, amounts)
      ;(itemRows.length ? itemRows : [null]).forEach((line, index) => {
        const item = line?.item
        const positionAmounts = line || {
          paid: amounts.revenue, tax: amounts.tax, acquiring: amounts.acquiring,
          sitePaid: amounts.siteRevenue, externalPaid: amounts.externalRevenue,
          commission: amounts.revenue ? Number(order.commission?.amount || 0) : 0,
          balance: Math.round((amounts.balance - (amounts.revenue ? Number(order.commission?.amount || 0) : 0)) * 100) / 100
        }
        const firstItem = index === 0
        const orderValue = value => firstItem ? value : null
        sheet.addRow({
          id: order.id,
          createdAt: order.createdAt,
          customerName: order.user?.name || order.customerName || '—',
          customerEmail: order.user?.email || order.customerEmail || '—',
          customerPhone: order.user?.phone || order.customerPhone || '—',
          promoCode: promoCodeById.get(order.promoCodeId) || '—',
          productName: item?.product?.title || (item ? `Товар #${item.productId}` : '—'),
          quantity: item?.quantity ?? null,
          total: Number(order.total || 0),
          discountAmount: orderValue(Number(order.discountAmount || 0)),
          deliveryPrice: orderValue(Number(order.deliveryPrice || order.deliveryCost || 0)),
          status: getOrderStatusLabel(order.status),
          paymentStatus: line?.externalPaid && !line?.sitePaid ? 'Вне сайта (не подтверждено)' : getPaymentStatusLabel(order.paymentStatus),
          paymentType: line?.externalPaid && !line?.sitePaid ? 'Вне сайта' : getPaymentTypeLabel(order.paymentType),
          tax: positionAmounts.tax,
          acquiring: positionAmounts.acquiring,
          acquiringSource: line?.externalPaid && !line?.sitePaid ? 'Вне сайта — эквайринг 0 ₽' : amounts.acquiringSource,
          commissionAmount: positionAmounts.commission,
          commissionPercentage: order.commission?.percentage != null ? Number(order.commission.percentage) / 100 : null,
          unitCost: line?.unitCost ?? null,
          itemCost: line?.cost ?? null,
          productCost: orderValue(getOrderProductCost(order)),
          composition: item ? `${item.product?.title || `Товар #${item.productId}`}${item.dosage ? `, ${item.dosage}` : ''} × ${item.quantity}${item.adminUnbilled ? ' (в админке, без изменения оплаты)' : ''}` : '—',
          itemNet: line?.net ?? null,
          paid: positionAmounts.paid,
          balance: positionAmounts.balance,
          profit: line?.profit ?? null,
          manuallyAdded: item?.adminAddedById || item?.adminAddedAt ? 'Да, администратором' : 'Нет',
          sitePaid: positionAmounts.sitePaid,
          externalPaid: positionAmounts.externalPaid
        })
      })
    })
    sheet.addRow({ productName: 'Итого по выгрузке', productCost: orders.reduce((sum, order) => Math.round((sum + getOrderProductCost(order)) * 100) / 100, 0) })

    const header = sheet.getRow(1)
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF20283F' } }
    header.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
    header.height = 64
    sheet.autoFilter = { from: 'A1', to: 'AD1' }

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return
      row.alignment = { vertical: 'top', wrapText: true }
      row.getCell('createdAt').numFmt = 'dd.mm.yyyy hh:mm'
      ;['total', 'discountAmount', 'deliveryPrice', 'tax', 'acquiring', 'commissionAmount', 'unitCost', 'itemCost', 'productCost', 'itemNet', 'paid', 'balance', 'profit', 'sitePaid', 'externalPaid'].forEach(key => {
        row.getCell(key).numFmt = '#,##0.00 [$₽-419]'
      })
      row.getCell('commissionPercentage').numFmt = '0.0%'
    })

    const safeDate = new Date().toISOString().slice(0, 10)
    const fileName = `partner-${partnerId}-orders-${safeDate}.xlsx`
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    res.setHeader('Cache-Control', 'no-store')
    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    next(error)
  }
})

router.get('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
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
          where: { order: { paymentStatus: 'PAID', status: { notIn: ['CANCELLED', 'RETURNED'] } } },
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
    const balance = await calculatePartnerBalance(prisma, parseInt(req.params.id, 10))

    const recentOrders = await prisma.order.findMany({
      where: {
        commission: { partnerId: parseInt(req.params.id) },
        paymentStatus: 'PAID',
        status: { notIn: ['CANCELLED', 'RETURNED'] }
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
        balance,
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
    const id = Number(req.params.id)
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Некорректный ID партнёра' })

    const result = await prisma.$transaction(async tx => {
      const partner = await tx.partner.findUnique({ where: { id }, select: { userId: true, archivedAt: true } })
      if (!partner) return { status: 404, error: 'Партнёр не найден' }
      if (partner.archivedAt) return { message: 'Партнёр уже убран из программы.' }

      // Financial records and used codes keep their partnerId for reports. Only active
      // client bindings are released so clients can join another partner later.
      await tx.partner.update({ where: { id }, data: { isActive: false, archivedAt: new Date() } })
      await tx.promoCode.updateMany({ where: { partnerId: id }, data: { isActive: false } })
      await tx.partnerUser.deleteMany({ where: { partnerId: id } })
      await tx.user.updateMany({ where: { id: partner.userId, role: 'PARTNER' }, data: { role: 'USER' } })
      return { message: 'Партнёр убран из программы. Заказы, комиссии, выплаты и промокоды сохранены в истории.' }
    })
    if (result.status) return res.status(result.status).json({ error: result.error })
    res.json(result)
  } catch (error) {
    next(error)
  }
})

export default router
