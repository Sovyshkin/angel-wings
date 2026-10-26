import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'
import { upload } from '../utils/fileUpload.js'
import tochkaService from '../services/tochka.js'
import { v4 as uuidv4 } from 'uuid'
import { validateBasicPassword } from '../utils/passwordPolicy.js'
import { findUserByEmail, normalizeEmail } from '../utils/userEmail.js'
import { syncPartnerCommissionForOrder } from '../utils/partnerCommission.js'
import { calculatePartnerBalance } from '../utils/partnerBalance.js'
import { sendCloudKassirIncomeReceiptOnPaidTransition } from '../utils/cloudKassirReceipt.js'
import { deleteProductForAdmin } from '../utils/productDeletion.js'
import { refundUserPointsForOrder } from '../utils/userPoints.js'
import emailService from '../services/email.js'
import { queueCdekWaybillAfterPayment } from '../services/cdekWaybill.js'
import { grantConsultationRewardsForPaidOrder } from '../utils/consultationReward.js'
import { buildOrderWaybill, createOrderWaybillDocx, createOrderWaybillPdf } from '../utils/orderWaybill.js'
import { applyStockAdjustments, parseStockAdjustmentRequest } from '../utils/stockAdjustments.js'
import { getAcquiringSettings, parseAcquiringSettings } from '../utils/acquiringSettings.js'
import { calculateOrderEditAmounts, getBilledOrderTotal } from '../utils/orderEditAmounts.js'
import { resolveManualOrderPromo, claimManualOrderPromo } from '../utils/manualOrderPromo.js'

const router = Router()
const prisma = new PrismaClient()
const ALLOWED_USER_ROLES = ['USER', 'ADMIN', 'PARTNER', 'COPYWRITER']
const ADMIN_PASSWORD_LENGTH = 18

router.get('/acquiring-settings', authenticate, requireAdmin, async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store')
    res.json(await getAcquiringSettings(prisma))
  } catch (error) {
    next(error)
  }
})

router.put('/acquiring-settings', authenticate, requireAdmin, async (req, res, next) => {
  try {
    let rates
    try {
      rates = parseAcquiringSettings(req.body)
    } catch (error) {
      return res.status(400).json({ error: error.message })
    }
    const settings = await prisma.acquiringSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...rates },
      update: rates
    })
    res.set('Cache-Control', 'no-store')
    res.json({ sbpPercent: settings.sbpPercent, cardPercent: settings.cardPercent })
  } catch (error) {
    next(error)
  }
})

function getAdminLoginUrl() {
  return String(process.env.ADMIN_LOGIN_URL || process.env.ADMIN_URL || 'https://admin.angel-wings.ru').trim()
}

function getClientUrl() {
  return String(process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://angel-wings.ru').trim()
}

function pickRandom(chars) {
  return chars[crypto.randomInt(0, chars.length)]
}

function shuffleSecure(chars) {
  const result = [...chars]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1)
    const current = result[i]
    result[i] = result[j]
    result[j] = current
  }
  return result.join('')
}

function generateSecureAdminPassword(length = ADMIN_PASSWORD_LENGTH) {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const digits = '23456789'
  const symbols = '!@#$%^&*()-_=+'
  const all = `${upper}${lower}${digits}${symbols}`
  const required = [
    pickRandom(upper),
    pickRandom(lower),
    pickRandom(digits),
    pickRandom(symbols)
  ]
  const rest = Array.from({ length: Math.max(0, length - required.length) }, () => pickRandom(all))
  return shuffleSecure([...required, ...rest])
}

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

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

async function sendPartnerWelcomeEmail({ to, name, password, partnerUrl }) {
  const rawName = String(name || 'партнёр')
  const safeName = escapeHtml(rawName)
  const safeEmail = escapeHtml(to)
  const safePassword = password ? escapeHtml(password) : ''
  const safePartnerUrl = escapeHtml(partnerUrl)
  const hasPassword = Boolean(password)

  return emailService.sendMail({
    to,
    subject: 'Ваша заявка в партнёрскую программу Angel Wings одобрена',
    text: [
      `Здравствуйте, ${rawName}!`,
      '',
      'Ваша заявка в партнёрскую программу Angel Wings одобрена.',
      `Личный кабинет партнёра: ${partnerUrl}`,
      `Email для входа: ${to}`,
      hasPassword ? `Временный пароль: ${password}` : 'Используйте ваш текущий пароль от сайта для входа.',
      '',
      hasPassword ? 'После входа рекомендуем сменить пароль в профиле.' : 'Партнёрский кабинет уже доступен в вашем аккаунте.'
    ].join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:28px;background:#f6f7fb;color:#151722">
        <div style="background:#fff;border-radius:24px;padding:30px;border:1px solid #e7e9f2">
          <div style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#8da2ff;font-weight:700;margin-bottom:12px">Angel Wings</div>
          <h1 style="margin:0 0 14px;font-size:25px;line-height:1.2">Заявка одобрена</h1>
          <p style="margin:0 0 18px;font-size:16px;line-height:1.55">Здравствуйте, ${safeName}! Мы подключили для вас партнёрский кабинет.</p>
          <div style="background:#f3f5ff;border-radius:18px;padding:20px;margin:0 0 20px;border:1px solid #dfe5ff">
            <p style="margin:0 0 8px;color:#687087;font-size:14px">Email для входа</p>
            <div style="font-size:17px;font-weight:700;color:#22305f;margin-bottom:16px">${safeEmail}</div>
            ${hasPassword ? `
              <p style="margin:0 0 8px;color:#687087;font-size:14px">Временный пароль</p>
              <div style="font-family:Menlo,Consolas,monospace;font-size:20px;font-weight:700;letter-spacing:.04em;background:#151722;color:#fff;border-radius:14px;padding:14px 16px">${safePassword}</div>
            ` : `
              <p style="margin:0;color:#687087;font-size:14px;line-height:1.5">Используйте ваш текущий пароль от сайта. Партнёрский кабинет уже доступен в аккаунте.</p>
            `}
          </div>
          <a href="${safePartnerUrl}" style="display:block;text-align:center;background:#9fb3ff;color:#10131f;text-decoration:none;font-weight:700;border-radius:16px;padding:16px 20px">Открыть кабинет партнёра</a>
        </div>
      </div>
    `
  })
}

async function sendPartnerApplicationRejectedEmail({ to, name, adminNote }) {
  const rawName = String(name || 'партнёр')
  const rawNote = String(adminNote || '').trim()
  const safeName = escapeHtml(rawName)
  const safeNote = escapeHtml(rawNote)

  return emailService.sendMail({
    to,
    subject: 'Статус заявки в партнёрскую программу Angel Wings',
    text: [
      `Здравствуйте, ${rawName}!`,
      '',
      'Спасибо за интерес к партнёрской программе Angel Wings.',
      'По итогам проверки сейчас мы не можем принять вашу заявку.',
      rawNote ? `Комментарий: ${rawNote}` : '',
      '',
      'Если появятся новые вводные по формату сотрудничества, вы можете подать заявку повторно позже.'
    ].filter(Boolean).join('\n'),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:620px;margin:0 auto;padding:28px;background:#f6f7fb;color:#151722">
        <div style="background:#fff;border-radius:24px;padding:30px;border:1px solid #e7e9f2">
          <div style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#8da2ff;font-weight:700;margin-bottom:12px">Angel Wings</div>
          <h1 style="margin:0 0 14px;font-size:25px;line-height:1.2">Заявка рассмотрена</h1>
          <p style="margin:0 0 18px;font-size:16px;line-height:1.55">Здравствуйте, ${safeName}! Спасибо за интерес к партнёрской программе.</p>
          <div style="background:#fff6f6;border-radius:18px;padding:20px;margin:0 0 20px;border:1px solid #ffdada">
            <p style="margin:0;color:#6f3b3b;font-size:15px;line-height:1.55">По итогам проверки сейчас мы не можем принять вашу заявку.</p>
            ${safeNote ? `<p style="margin:16px 0 8px;color:#8a5454;font-size:14px">Комментарий</p><div style="font-size:15px;line-height:1.55;color:#151722">${safeNote}</div>` : ''}
          </div>
          <p style="margin:0;color:#73788a;font-size:14px;line-height:1.5">Если появятся новые вводные по формату сотрудничества, вы можете подать заявку повторно позже.</p>
        </div>
      </div>
    `
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

async function attachPartnerBonusInfoToOrders(orders) {
  const ordersWithBonus = (orders || []).filter(order =>
    Math.max(0, Number(order?.partnerBonusAmount || 0)) > 0 && order?.user?.partner?.id
  )
  if (!ordersWithBonus.length) return orders

  const partnerIds = [...new Set(ordersWithBonus.map(order => order.user.partner.id))]
  const balances = new Map()

  await Promise.all(partnerIds.map(async (partnerId) => {
    balances.set(partnerId, await calculatePartnerBalance(prisma, partnerId))
  }))

  for (const order of ordersWithBonus) {
    const partner = order.user.partner
    order.partnerBonusInfo = {
      amount: Math.max(0, Number(order.partnerBonusAmount || 0)),
      partnerId: partner.id,
      partnerName: partner.user?.name || null,
      partnerEmail: partner.user?.email || null,
      balance: balances.get(partner.id) || null
    }
  }

  return orders
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
          pointsBalance: true,
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

router.get('/partner-applications', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status = 'PENDING', limit = 50, offset = 0 } = req.query
    const normalizedStatus = String(status || '').trim().toUpperCase()
    const where = ['PENDING', 'APPROVED', 'REJECTED'].includes(normalizedStatus)
      ? { status: normalizedStatus }
      : {}

    const [applications, total, pendingCount] = await Promise.all([
      prisma.partnerApplication.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, name: true, role: true } },
          partner: { select: { id: true, referralCode: true, percentage: true, isActive: true } },
          reviewedBy: { select: { id: true, name: true, email: true } }
        },
        take: Math.min(100, Math.max(1, parseInt(limit, 10) || 50)),
        skip: Math.max(0, parseInt(offset, 10) || 0),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.partnerApplication.count({ where }),
      prisma.partnerApplication.count({ where: { status: 'PENDING' } })
    ])

    res.json({ applications, total, pendingCount })
  } catch (error) {
    next(error)
  }
})

router.post('/partner-applications/:id/approve', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const applicationId = parseInt(req.params.id, 10)
    const adminNote = String(req.body.adminNote || '').trim() || null
    const partnerUrl = `${getClientUrl().replace(/\/$/, '')}/partner`
    let createdUser = false
    let generatedPassword = null

    const result = await prisma.$transaction(async (tx) => {
      const application = await tx.partnerApplication.findUnique({
        where: { id: applicationId }
      })

      if (!application) {
        const error = new Error('Заявка не найдена')
        error.status = 404
        throw error
      }

      if (application.status !== 'PENDING') {
        const error = new Error('Эта заявка уже обработана')
        error.status = 400
        throw error
      }

      let user = await findUserByEmail(tx, application.email)

      if (user?.role === 'DELETED') {
        user = null
      }

      if (!user) {
        createdUser = true
        generatedPassword = generateSecureAdminPassword()
        const hashedPassword = await bcrypt.hash(generatedPassword, 10)

        user = await tx.user.create({
          data: {
            email: application.email,
            password: hashedPassword,
            name: application.name,
            role: 'PARTNER',
            phone: application.phone,
            emailVerified: true
          }
        })
      } else if (user.role !== 'PARTNER') {
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            role: 'PARTNER',
            name: user.name || application.name,
            phone: user.phone || application.phone || null
          }
        })
      }

      const partner = await ensurePartnerForUser(tx, user.id)

      const updatedApplication = await tx.partnerApplication.update({
        where: { id: application.id },
        data: {
          status: 'APPROVED',
          adminNote,
          userId: user.id,
          partnerId: partner.id,
          reviewedById: req.user.id,
          reviewedAt: new Date()
        },
        include: {
          user: { select: { id: true, email: true, name: true, role: true } },
          partner: { select: { id: true, referralCode: true, percentage: true, isActive: true } },
          reviewedBy: { select: { id: true, name: true, email: true } }
        }
      })

      return { application: updatedApplication, user, partner }
    })

    let welcomeEmailSent = false
    try {
      await sendPartnerWelcomeEmail({
        to: result.user.email,
        name: result.user.name,
        password: createdUser ? generatedPassword : null,
        partnerUrl
      })
      welcomeEmailSent = true
    } catch (emailError) {
      console.error('[PARTNER_APPLICATION] approval email failed', emailError?.message || emailError)
    }

    res.json({
      ...result,
      createdUser,
      welcomeEmailSent
    })
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message })
    }
    next(error)
  }
})

router.post('/partner-applications/:id/reject', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const applicationId = parseInt(req.params.id, 10)
    const adminNote = String(req.body.adminNote || '').trim()

    if (!adminNote) {
      return res.status(400).json({ error: 'Укажите причину или комментарий к отклонению' })
    }

    const current = await prisma.partnerApplication.findUnique({
      where: { id: applicationId },
      select: { id: true, status: true }
    })

    if (!current) {
      return res.status(404).json({ error: 'Заявка не найдена' })
    }

    if (current.status !== 'PENDING') {
      return res.status(400).json({ error: 'Эта заявка уже обработана' })
    }

    const application = await prisma.partnerApplication.update({
      where: { id: applicationId },
      data: {
        status: 'REJECTED',
        adminNote,
        reviewedById: req.user.id,
        reviewedAt: new Date()
      },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } },
        partner: { select: { id: true, referralCode: true, percentage: true, isActive: true } },
        reviewedBy: { select: { id: true, name: true, email: true } }
      }
    })

    let rejectionEmailSent = false
    try {
      await sendPartnerApplicationRejectedEmail({
        to: application.email,
        name: application.name,
        adminNote
      })
      rejectionEmailSent = true
    } catch (emailError) {
      console.error('[PARTNER_APPLICATION] rejection email failed', emailError?.message || emailError)
    }

    res.json({ application, rejectionEmailSent })
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
        pointsBalance: true,
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
    const totalSpent = successfulOrders.reduce((sum, order) => sum + getBilledOrderTotal(order), 0)
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
    const { password, name, role = 'USER', phone } = req.body
    const email = normalizeEmail(req.body.email)
    const normalizedRole = String(role || 'USER').toUpperCase()

    if (!ALLOWED_USER_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ error: 'Некорректная роль пользователя' })
    }

    const generatedStaffPassword = ['ADMIN', 'COPYWRITER'].includes(normalizedRole) ? generateSecureAdminPassword() : null
    const effectivePassword = generatedStaffPassword || password
    const passwordError = generatedStaffPassword ? null : validateBasicPassword(effectivePassword)
    if (passwordError) return res.status(400).json({ error: passwordError })
    
    const existing = await findUserByEmail(prisma, email)
    if (existing) {
      return res.status(400).json({ error: 'Пользователь с таким email уже существует' })
    }
    
    const hashedPassword = await bcrypt.hash(effectivePassword, 10)
    
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: { email, password: hashedPassword, name, role: normalizedRole, phone },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          pointsBalance: true,
          createdAt: true
        }
      })

      if (normalizedRole === 'PARTNER') {
        await ensurePartnerForUser(tx, createdUser.id)
      }

      return createdUser
    })

    if (generatedStaffPassword) {
      try {
        await emailService.sendAdminInvite({
          to: user.email,
          name: user.name,
          password: generatedStaffPassword,
          adminUrl: getAdminLoginUrl(),
          role: normalizedRole
        })
      } catch (emailError) {
        await prisma.user.delete({ where: { id: user.id } }).catch(() => null)
        throw emailError
      }
    }
    
    res.status(201).json({ user, adminInviteSent: Boolean(generatedStaffPassword) })
  } catch (error) {
    next(error)
  }
})

router.post('/users/:id/resend-admin-invite', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.id)

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Нельзя переотправить данные самому себе. Для своей учётной записи используйте смену пароля.' })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        password: true
      }
    })

    if (!user || user.role === 'DELETED') {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    if (!['ADMIN', 'COPYWRITER'].includes(user.role)) {
      return res.status(400).json({ error: 'Повторная отправка доступна только для сотрудников админки' })
    }

    const generatedAdminPassword = generateSecureAdminPassword()
    const hashedPassword = await bcrypt.hash(generatedAdminPassword, 10)

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    })

    try {
      await emailService.sendAdminInvite({
        to: user.email,
        name: user.name,
        password: generatedAdminPassword,
        adminUrl: getAdminLoginUrl(),
        role: user.role
      })
    } catch (emailError) {
      await prisma.user.update({
        where: { id: userId },
        data: { password: user.password }
      }).catch(() => null)
      throw emailError
    }

    res.json({ message: 'Письмо с новыми данными для входа отправлено', adminInviteSent: true })
  } catch (error) {
    next(error)
  }
})

router.put('/users/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { name, role, phone } = req.body
    const userId = parseInt(req.params.id)
    const normalizedRole = role !== undefined ? String(role).toUpperCase() : undefined

    if (normalizedRole !== undefined && !ALLOWED_USER_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ error: 'Некорректная роль пользователя' })
    }

    if (userId === req.user.id && normalizedRole && normalizedRole !== 'ADMIN') {
      return res.status(400).json({ error: 'Нельзя изменить собственную роль администратора' })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, password: true }
    })

    if (!currentUser || currentUser.role === 'DELETED') {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }
    
    const passwordUpdate = {}
    const generatedAdminPassword = ['ADMIN', 'COPYWRITER'].includes(normalizedRole) && normalizedRole !== currentUser.role
      ? generateSecureAdminPassword()
      : null

    if (generatedAdminPassword) {
      passwordUpdate.password = await bcrypt.hash(generatedAdminPassword, 10)
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
          pointsBalance: true,
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

    if (generatedAdminPassword) {
      try {
        await emailService.sendAdminInvite({
          to: user.email,
          name: user.name,
          password: generatedAdminPassword,
          adminUrl: getAdminLoginUrl(),
          role: normalizedRole
        })
      } catch (emailError) {
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: userId },
            data: {
              role: currentUser.role,
              password: currentUser.password
            }
          })

          if (currentUser.role === 'PARTNER') {
            await tx.partner.updateMany({
              where: { userId },
              data: { isActive: true }
            })
          } else {
            await tx.partner.updateMany({
              where: { userId },
              data: { isActive: false }
            })
          }
        }).catch(() => null)

        throw emailError
      }
    }
    
    res.json({ user, adminInviteSent: Boolean(generatedAdminPassword) })
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

router.get('/email-campaigns', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const campaigns = await prisma.emailCampaign.findMany({
      take: Math.min(100, Number(req.query.limit) || 50),
      orderBy: { createdAt: 'desc' }
    })

    res.json({ campaigns })
  } catch (error) {
    next(error)
  }
})

router.post('/email-campaigns', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const subject = String(req.body.subject || '').trim()
    const body = String(req.body.body || '').trim()
    const audience = String(req.body.audience || 'all').trim()

    if (!subject || subject.length < 3) {
      return res.status(400).json({ error: 'Укажите тему письма' })
    }

    if (!body || body.length < 10) {
      return res.status(400).json({ error: 'Текст письма должен быть не короче 10 символов' })
    }

    const userWhere = {
      role: { not: 'DELETED' },
      emailVerified: true
    }

    if (audience === 'partners') {
      userWhere.role = 'PARTNER'
    } else if (audience === 'clients') {
      userWhere.role = 'USER'
    }

    const recipients = audience === 'blog'
      ? await prisma.blogSubscriber.findMany({ where: { active: true }, select: { id: true, email: true }, orderBy: { createdAt: 'desc' } })
      : await prisma.user.findMany({
        where: userWhere,
        select: { id: true, email: true, name: true },
        orderBy: { createdAt: 'desc' }
      })

    if (!recipients.length) {
      return res.status(400).json({ error: 'Не найдено получателей для выбранной аудитории' })
    }

    const campaign = await prisma.emailCampaign.create({
      data: {
        subject,
        body,
        audience,
        total: recipients.length,
        status: 'SENDING',
        createdById: req.user.id
      }
    })

    let sent = 0
    let failed = 0
    const errors = []

    for (const recipient of recipients) {
      try {
        const unsubscribeToken = audience === 'blog'
          ? crypto.createHmac('sha256', process.env.JWT_SECRET).update(String(recipient.id)).digest('hex')
          : null
        const unsubscribe = unsubscribeToken ? `\n\nОтписаться от рассылки блога: https://angel-wings.ru/blog?unsubscribe=${recipient.id}.${unsubscribeToken}` : ''
        await emailService.sendCampaignEmail({
          to: recipient.email,
          subject,
          body: body.replace(/\{\{\s*name\s*\}\}/gi, recipient.name || 'читатель') + unsubscribe
        })
        sent += 1
      } catch (error) {
        failed += 1
        errors.push(`${recipient.email}: ${error.message || error}`)
      }
    }

    const updatedCampaign = await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        sent,
        failed,
        status: failed > 0 ? (sent > 0 ? 'PARTIAL' : 'FAILED') : 'SENT',
        errorLog: errors.length ? errors.slice(0, 30).join('\n') : null,
        sentAt: new Date()
      }
    })

    res.status(201).json({ campaign: updatedCampaign })
  } catch (error) {
    next(error)
  }
})

router.post('/orders/promo/validate', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const userId = Number(req.body.userId)
    const subtotal = Number(req.body.subtotal)
    const requestedPartnerId = req.body.partnerId === undefined || req.body.partnerId === null || req.body.partnerId === '' ? null : Number(req.body.partnerId)
    if (!Number.isInteger(userId) || userId <= 0 || !Number.isFinite(subtotal) || subtotal < 0 || (requestedPartnerId !== null && (!Number.isInteger(requestedPartnerId) || requestedPartnerId <= 0))) {
      return res.status(400).json({ error: 'Выберите клиента и проверьте сумму товаров' })
    }
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true, partnerUser: { select: { partnerId: true } } } })
    if (!user || user.role === 'DELETED') return res.status(404).json({ error: 'Клиент не найден' })
    const historical = !user.partnerUser ? await prisma.order.findFirst({ where: { userId, partnerId: { not: null } }, orderBy: { createdAt: 'desc' }, select: { partnerId: true } }) : null
    const boundPartnerId = user.partnerUser?.partnerId || historical?.partnerId || null
    if (boundPartnerId && requestedPartnerId && boundPartnerId !== requestedPartnerId) return res.status(409).json({ error: 'Клиент уже закреплён за другим партнёром' })
    const result = await resolveManualOrderPromo(prisma, { code: req.body.promoCode, userId, subtotal, boundPartnerId, requestedPartnerId })
    res.set('Cache-Control', 'no-store')
    res.json({ promoCode: result.promoCode?.code || null, discountAmount: result.discountAmount, partnerId: result.partnerId })
  } catch (error) {
    next(error)
  }
})

router.post('/orders', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const rawUserId = req.body.userId
    const userId = rawUserId === null || rawUserId === undefined || rawUserId === '' ? null : Number(rawUserId)
    const paymentStatus = String(req.body.paymentStatus || 'PENDING').toUpperCase()
    const status = String(req.body.status || 'PENDING').toUpperCase()
    const items = req.body.items
    if (userId !== null && (!Number.isInteger(userId) || userId <= 0)) return res.status(400).json({ error: 'Некорректный клиент' })
    if (!['PENDING', 'PAID', 'FAILED', 'CASH_ON_DELIVERY'].includes(paymentStatus)) return res.status(400).json({ error: 'Некорректный статус оплаты' })
    if (!['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(status)) return res.status(400).json({ error: 'Некорректный статус заказа' })
    if (!Array.isArray(items) || !items.length || items.length > 100 || items.some(item => !item || !Number.isInteger(Number(item.productId)) || !Number.isInteger(Number(item.quantity)) || Number(item.quantity) <= 0 || !Number.isFinite(Number(item.price)) || Number(item.price) < 0 || Math.abs(Math.round(Number(item.price) * 100) - Number(item.price) * 100) > 1e-6 || String(item.dosage || '').length > 200)) {
      return res.status(400).json({ error: 'Проверьте состав заказа' })
    }
    const deliveryPrice = Number(req.body.deliveryPrice || 0)
    if (!Number.isFinite(deliveryPrice) || deliveryPrice < 0) return res.status(400).json({ error: 'Некорректная стоимость доставки' })
    const user = userId ? await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, phone: true, address: true, role: true, partnerUser: { select: { partnerId: true } } } }) : null
    if (userId && (!user || user.role === 'DELETED')) return res.status(404).json({ error: 'Клиент не найден' })
    const requestedPartnerId = req.body.partnerId === undefined || req.body.partnerId === null || req.body.partnerId === '' ? null : Number(req.body.partnerId)
    if (requestedPartnerId !== null && (!Number.isInteger(requestedPartnerId) || requestedPartnerId <= 0)) return res.status(400).json({ error: 'Некорректный партнёр' })
    if (requestedPartnerId !== null && !userId) return res.status(400).json({ error: 'Для начисления партнёру выберите зарегистрированного клиента' })
    const historical = user && !user.partnerUser ? await prisma.order.findFirst({ where: { userId, partnerId: { not: null } }, orderBy: { createdAt: 'desc' }, select: { partnerId: true } }) : null
    const boundPartnerId = user?.partnerUser?.partnerId || historical?.partnerId || null
    if (boundPartnerId && requestedPartnerId && boundPartnerId !== requestedPartnerId) return res.status(409).json({ error: 'Клиент уже закреплён за другим партнёром' })
    const partnerId = boundPartnerId || requestedPartnerId
    if (partnerId) {
      const partner = await prisma.partner.findUnique({ where: { id: partnerId }, select: { isActive: true } })
      if (!partner?.isActive) return res.status(400).json({ error: 'Партнёр не найден или неактивен' })
    }
    const productIds = [...new Set(items.map(item => Number(item.productId)))]
    const products = await prisma.product.findMany({ where: { id: { in: productIds } }, select: { id: true } })
    if (products.length !== productIds.length) return res.status(400).json({ error: 'Один из товаров не найден' })
    const customerName = String(req.body.customerName || user?.name || '').trim()
    const customerEmail = String(req.body.customerEmail || user?.email || '').trim()
    const customerPhone = String(req.body.customerPhone || user?.phone || '').trim()
    if (!customerName || !customerEmail || !customerPhone) return res.status(400).json({ error: 'Укажите имя, email и телефон клиента' })
    if ([customerName, customerEmail, customerPhone].some(value => value.length > 500) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) return res.status(400).json({ error: 'Проверьте данные клиента' })
    const normalizedItems = items.map(item => ({ productId: Number(item.productId), quantity: Number(item.quantity), price: Number(item.price), dosage: String(item.dosage || '').trim() || null }))
    const subtotal = normalizedItems.reduce((sum, item) => sum + item.quantity * item.price, 0)
    const promoCode = String(req.body.promoCode || '').trim()
    const deliveryTariffCode = req.body.deliveryTariffCode === '' || req.body.deliveryTariffCode == null ? null : Number(req.body.deliveryTariffCode)
    if (deliveryTariffCode !== null && (!Number.isInteger(deliveryTariffCode) || deliveryTariffCode < 0)) return res.status(400).json({ error: 'Некорректный тариф доставки' })
    const deliveryPickupPoint = String(req.body.deliveryPickupPoint || '').trim() || null
    const siteDelivery = deliveryTariffCode || deliveryPickupPoint ? 0 : deliveryPrice
    const order = await prisma.$transaction(async tx => {
      const promo = await resolveManualOrderPromo(tx, { code: promoCode, userId, subtotal, boundPartnerId, requestedPartnerId })
      const effectivePartnerId = promo.partnerId
      const total = Math.round((subtotal + siteDelivery - promo.discountAmount) * 100) / 100
      if (paymentStatus === 'PAID' && total <= 0) throw Object.assign(new Error('Для оплаченного заказа сумма должна быть больше нуля'), { status: 400 })
      const counts = new Map()
      for (const item of normalizedItems) counts.set(item.productId, (counts.get(item.productId) || 0) + item.quantity)
      for (const [productId, quantity] of counts) {
        const result = await tx.product.updateMany({ where: { id: productId, stock: { gte: quantity } }, data: { stock: { decrement: quantity } } })
        if (!result.count) throw Object.assign(new Error(`Недостаточно товара #${productId} на складе`), { status: 409 })
      }
      if (effectivePartnerId && !user?.partnerUser && !historical) {
        await tx.partnerUser.create({ data: { userId, partnerId: effectivePartnerId, promoCodeId: promo.promoCode?.id || null, referralSource: promo.promoCode?.partnerId ? 'promo_code' : 'admin' } })
      }
      await claimManualOrderPromo(tx, promo.promoCode)
      const created = await tx.order.create({
        data: {
          origin: 'ADMIN_MANUAL', userId, partnerId: effectivePartnerId, promoCodeId: promo.promoCode?.id || null,
          discountAmount: promo.discountAmount, customerName, customerEmail, customerPhone,
          shippingAddress: String(req.body.shippingAddress || '').trim() || null,
          notes: String(req.body.notes || '').trim() || null,
          status, paymentStatus, total, paymentAmount: paymentStatus === 'PAID' ? total : null,
          deliveryPrice, deliveryTariffCode,
          deliveryTariffName: String(req.body.deliveryTariffName || '').trim() || null,
          deliveryCity: String(req.body.deliveryCity || '').trim() || null,
          deliveryPickupPoint,
          deliveryPickupName: String(req.body.deliveryPickupName || '').trim() || null,
          items: { create: normalizedItems }
        }
      })
      if (paymentStatus === 'PAID') {
        await syncPartnerCommissionForOrder(tx, created.id)
      }
      return created
    })
    if (paymentStatus === 'PAID') {
      try {
        await sendCloudKassirIncomeReceiptOnPaidTransition(prisma, order.id, 'PENDING', 'PAID', 'admin-manual-order')
      } catch (receiptError) {
        console.error('[ADMIN] Manual order receipt failed', { orderId: order.id, error: receiptError })
      }
    }
    res.status(201).json({ order })
  } catch (error) {
    next(error)
  }
})

router.get('/orders/:id/waybill', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const id = Number.parseInt(req.params.id, 10)
    const format = String(req.query.format || '').toLowerCase()
    if (!Number.isSafeInteger(id) || id < 1) return res.status(400).json({ error: 'Некорректный номер заказа' })
    if (!['pdf', 'docx'].includes(format)) return res.status(400).json({ error: 'Доступны форматы pdf и docx' })
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: { select: { title: true } } }, orderBy: { id: 'asc' } } }
    })
    if (!order) return res.status(404).json({ error: 'Заказ не найден' })
    const data = buildOrderWaybill(order)
    const buffer = format === 'pdf' ? await createOrderWaybillPdf(data) : await createOrderWaybillDocx(data)
    res.set({
      'Content-Type': format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="waybill-order-${id}.${format}"`,
      'Content-Length': buffer.length,
      'Cache-Control': 'no-store'
    })
    res.send(buffer)
  } catch (error) {
    next(error)
  }
})

router.get('/orders', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status, favorites, limit = 50, offset = 0, q = '' } = req.query
    const search = String(q || '').trim()
    const where = status ? { status } : {}
    if (String(favorites || '').toLowerCase() === 'true') where.isFavorite = true

    if (search) {
      const numericId = Number.parseInt(search.replace(/^#/, ''), 10)
      const digitsSearch = search.replace(/\D/g, '')
      const promoCodes = await prisma.promoCode.findMany({
        where: { code: { contains: search.toUpperCase() } },
        select: { id: true }
      })
      const promoCodeIds = promoCodes.map(promoCode => promoCode.id)

      where.OR = [
        ...(Number.isFinite(numericId) ? [{ id: numericId }] : []),
        { customerName: { contains: search } },
        { customerEmail: { contains: search } },
        { customerPhone: { contains: search } },
        ...(digitsSearch ? [{ customerPhone: { contains: digitsSearch } }] : []),
        { shippingAddress: { contains: search } },
        { deliveryTariffName: { contains: search } },
        { deliveryCity: { contains: search } },
        { deliveryPickupPoint: { contains: search } },
        { deliveryPickupName: { contains: search } },
        { paymentStatus: { contains: search.toUpperCase() } },
        { status: { contains: search.toUpperCase() } },
        { paymentId: { contains: search } },
        { cdekOrderUuid: { contains: search } },
        ...(promoCodeIds.length ? [{ promoCodeId: { in: promoCodeIds } }] : [])
      ]
    }
    
    const [orders, total, statusGroups] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: { select: { title: true, image: true } }
            }
          },
          commission: {
            select: {
              amount: true,
              percentage: true,
              partner: { select: { id: true, user: { select: { name: true, email: true } } } }
            }
          },
          pointTransactions: {
            where: { type: 'CONSULTATION_REWARD', amount: { gt: 0 } },
            select: { id: true, amount: true, type: true, createdAt: true }
          },
          user: {
            select: {
              email: true,
              name: true,
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
          }
        },
        take: parseInt(limit),
        skip: parseInt(offset),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.order.count({ where }),
      prisma.order.groupBy({
        by: ['status'],
        _count: { _all: true }
      })
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
          const paymentType = normalized === 'PAID' ? statusResult.paymentType : null
          if (normalized === order.paymentStatus && (!paymentType || order.paymentType === paymentType)) return null

          await prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: normalized, ...(paymentType ? { paymentType } : {}) }
          })
          await syncPartnerCommissionForOrder(prisma, order.id)
          queueCdekWaybillAfterPayment({ ...order, paymentStatus: normalized }, order.paymentStatus)
          return { id: order.id, paymentStatus: normalized, paymentType }
        })
      )

      const updates = new Map(
        syncResults
          .filter(item => item.status === 'fulfilled' && item.value)
          .map(item => [item.value.id, item.value])
      )
      if (updates.size) {
        for (const order of orders) {
          if (updates.has(order.id)) {
            order.paymentStatus = updates.get(order.id).paymentStatus
            if (updates.get(order.id).paymentType) order.paymentType = updates.get(order.id).paymentType
          }
        }
      }
    }

    await attachPartnerBonusInfoToOrders(orders)

    const stats = statusGroups.reduce((result, group) => {
      result[group.status] = group._count._all
      return result
    }, {})

    res.json({ orders, total, stats })
  } catch (error) {
    next(error)
  }
})

router.put('/orders/:id/favorite', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id, 10)
    const { isFavorite } = req.body

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return res.status(400).json({ error: 'Некорректный ID заказа' })
    }
    if (typeof isFavorite !== 'boolean') {
      return res.status(400).json({ error: 'Некорректная отметка избранного' })
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { isFavorite }
    })

    res.json({ order })
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

    const orderId = parseInt(req.params.id, 10)
    const order = await prisma.$transaction(async (tx) => {
      const previousOrder = await tx.order.findUnique({
        where: { id: orderId },
        select: { id: true, userId: true, status: true, userPointsUsed: true }
      })

      if (!previousOrder) {
        throw Object.assign(new Error('Заказ не найден'), { status: 404 })
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          status: normalizedStatus,
          cancelReason: normalizedStatus === 'CANCELLED'
            ? (String(cancelReason || 'other').trim() || 'other')
            : null
        }
      })

      const wasFinalNegativeStatus = ['CANCELLED', 'RETURNED'].includes(String(previousOrder.status || '').toUpperCase())
      const isFinalNegativeStatus = ['CANCELLED', 'RETURNED'].includes(normalizedStatus)
      if (!wasFinalNegativeStatus && isFinalNegativeStatus) {
        await refundUserPointsForOrder(tx, {
          order: previousOrder,
          createdById: req.user.id
        })
      }

      return updatedOrder
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

    const previousOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { paymentStatus: true, cdekOrderUuid: true }
    })

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: normalizedStatus }
    })

    await syncPartnerCommissionForOrder(prisma, order.id)
    queueCdekWaybillAfterPayment(order, previousOrder?.paymentStatus)
    if (normalizedStatus === 'PAID') {
      await grantConsultationRewardsForPaidOrder(prisma, order)
    }
    await sendCloudKassirIncomeReceiptOnPaidTransition(
      prisma,
      order.id,
      previousOrder?.paymentStatus,
      normalizedStatus,
      'admin-payment-status'
    )

    res.json({ order })
  } catch (error) {
    next(error)
  }
})

router.put('/orders/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const orderId = Number(req.params.id)
    if (!Number.isInteger(orderId) || orderId <= 0) return res.status(400).json({ error: 'Некорректный ID заказа' })

    const editableText = ['customerName', 'customerEmail', 'customerPhone', 'shippingAddress', 'notes', 'deliveryTariffName', 'deliveryCity', 'deliveryPickupPoint', 'deliveryPickupName']
    const data = {}
    for (const field of editableText) {
      if (req.body[field] === undefined) continue
      if (req.body[field] !== null && typeof req.body[field] !== 'string') return res.status(400).json({ error: `Некорректное поле ${field}` })
      const value = String(req.body[field] || '').trim()
      if (value.length > (field === 'notes' ? 4000 : 500)) return res.status(400).json({ error: `Поле ${field} слишком длинное` })
      if (['customerName', 'customerEmail', 'customerPhone'].includes(field) && !value) return res.status(400).json({ error: `Поле ${field} обязательно` })
      data[field] = value || (['customerName', 'customerEmail', 'customerPhone'].includes(field) ? value : null)
    }
    if (data.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerEmail)) return res.status(400).json({ error: 'Некорректный email' })
    if (req.body.cdekOrderUuid !== undefined) {
      if (req.body.cdekOrderUuid !== null && typeof req.body.cdekOrderUuid !== 'string') return res.status(400).json({ error: 'Некорректный UUID СДЭК' })
      data.cdekOrderUuid = req.body.cdekOrderUuid || null
    }
    if (req.body.deliveryTariffCode !== undefined) {
      const code = Number(req.body.deliveryTariffCode)
      if (req.body.deliveryTariffCode !== null && (!Number.isInteger(code) || code < 0)) return res.status(400).json({ error: 'Некорректный код тарифа' })
      data.deliveryTariffCode = req.body.deliveryTariffCode === null ? null : code
    }
    if (req.body.deliveryPrice !== undefined) {
      const price = Number(req.body.deliveryPrice)
      if (req.body.deliveryPrice !== null && (!Number.isFinite(price) || price < 0)) return res.status(400).json({ error: 'Некорректная стоимость доставки' })
      data.deliveryPrice = req.body.deliveryPrice === null ? null : Math.round(price * 100) / 100
    }

    const wantsItems = req.body.items !== undefined
    if (wantsItems && (!Array.isArray(req.body.items) || !req.body.items.length || req.body.items.length > 100)) {
      return res.status(400).json({ error: 'Добавьте хотя бы один товар' })
    }
    if (wantsItems && (typeof req.body.expectedUpdatedAt !== 'string' || !Number.isFinite(Date.parse(req.body.expectedUpdatedAt)))) {
      return res.status(400).json({ error: 'Обновите заказ перед изменением состава' })
    }
    if (wantsItems && (!Number.isInteger(req.body.expectedEditVersion) || req.body.expectedEditVersion < 0)) {
      return res.status(400).json({ error: 'Обновите заказ перед изменением состава' })
    }
    const order = await prisma.$transaction(async tx => {
      const previous = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } })
      if (!previous) throw Object.assign(new Error('Заказ не найден'), { status: 404 })
      if (wantsItems && (previous.editVersion !== req.body.expectedEditVersion || previous.updatedAt.toISOString() !== new Date(req.body.expectedUpdatedAt).toISOString())) {
        throw Object.assign(new Error('Заказ уже изменён другим администратором. Обновите страницу и повторите изменение'), { status: 409 })
      }
      const changesDeliveryAmount = (data.deliveryPrice !== undefined && data.deliveryPrice !== previous.deliveryPrice) ||
        (data.deliveryTariffCode !== undefined && data.deliveryTariffCode !== previous.deliveryTariffCode) ||
        (data.deliveryPickupPoint !== undefined && data.deliveryPickupPoint !== previous.deliveryPickupPoint)
      const finalized = ['CANCELLED', 'RETURNED', 'SHIPPED', 'DELIVERED'].includes(previous.status)
      const financialLocked = Boolean(previous.paymentId || previous.paymentLinkId || previous.paymentUrl || ['PAID', 'APPROVED', 'SUCCESS', 'SUCCEEDED', 'COMPLETED'].includes(String(previous.paymentStatus || '').toUpperCase()) || (previous.paymentStatus === 'CASH_ON_DELIVERY' && ['SHIPPED', 'DELIVERED', 'RETURNED'].includes(previous.status)))
      if (changesDeliveryAmount && (financialLocked || previous.cdekOrderUuid || finalized)) {
        throw Object.assign(new Error('Стоимость доставки нельзя менять после создания счёта, оплаты или отправки'), { status: 409 })
      }
      if (previous.cdekOrderUuid && ['customerName', 'customerEmail', 'customerPhone', 'shippingAddress', 'deliveryTariffCode', 'deliveryTariffName', 'deliveryCity', 'deliveryPickupPoint', 'deliveryPickupName'].some(field => data[field] !== undefined && data[field] !== previous[field])) {
        throw Object.assign(new Error('Данные доставки уже переданы в СДЭК. Измените их сначала в СДЭК'), { status: 409 })
      }
      if (wantsItems) {
        if (req.body.items.some(item => !item || typeof item !== 'object' || Array.isArray(item) || item.productId == null || item.quantity == null || item.price == null || item.productId === '' || item.quantity === '' || item.price === '')) {
          throw Object.assign(new Error('Некорректный состав заказа'), { status: 400 })
        }
        const nextItems = req.body.items.map(item => ({
          id: item.id == null ? null : Number(item.id),
          productId: Number(item.productId),
          quantity: Number(item.quantity),
          price: Number(item.price),
          dosage: item.dosage ? String(item.dosage).trim() : null
        }))
        if (nextItems.some(item => (item.id !== null && (!Number.isInteger(item.id) || item.id <= 0)) || !Number.isInteger(item.productId) || item.productId <= 0 || !Number.isInteger(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.price) || item.price < 0 || Math.abs(Math.round(item.price * 100) - item.price * 100) > 1e-6 || (item.dosage && item.dosage.length > 200))) {
          throw Object.assign(new Error('Проверьте товары, количество и цены'), { status: 400 })
        }
        const previousById = new Map(previous.items.map(item => [item.id, item]))
        const providedIds = nextItems.filter(item => item.id !== null).map(item => item.id)
        if (new Set(providedIds).size !== providedIds.length) {
          throw Object.assign(new Error('Одна позиция указана дважды'), { status: 400 })
        }
        if (providedIds.some(id => !previousById.has(id))) {
          throw Object.assign(new Error('Состав заказа уже изменился. Обновите страницу перед сохранением'), { status: 409 })
        }
        const productIds = [...new Set(nextItems.map(item => item.productId))]
        const products = await tx.product.findMany({ where: { id: { in: productIds } }, select: { id: true } })
        if (products.length !== productIds.length) throw Object.assign(new Error('Один из товаров не найден'), { status: 400 })
        const oldCounts = new Map()
        const newCounts = new Map()
        for (const item of previous.items) oldCounts.set(item.productId, (oldCounts.get(item.productId) || 0) + item.quantity)
        for (const item of nextItems) newCounts.set(item.productId, (newCounts.get(item.productId) || 0) + item.quantity)
        for (const productId of new Set([...oldCounts.keys(), ...newCounts.keys()])) {
          const delta = (newCounts.get(productId) || 0) - (oldCounts.get(productId) || 0)
          if (delta > 0) {
            const updated = await tx.product.updateMany({ where: { id: productId, stock: { gte: delta } }, data: { stock: { decrement: delta } } })
            if (!updated.count) throw Object.assign(new Error(`Недостаточно товара #${productId} на складе`), { status: 409 })
          } else if (delta < 0) {
            await tx.product.update({ where: { id: productId }, data: { stock: { increment: -delta } } })
          }
        }
        await tx.orderItem.deleteMany({ where: { orderId } })
        await tx.orderItem.createMany({ data: nextItems.map(({ id, ...item }) => {
          const oldItem = id === null ? null : previousById.get(id)
          const sameProduct = oldItem?.productId === item.productId
          const changed = !oldItem || oldItem.productId !== item.productId || oldItem.dosage !== item.dosage || oldItem.quantity !== item.quantity || Math.round(oldItem.price * 100) !== Math.round(item.price * 100)
          return {
            ...item,
            orderId,
            adminAddedAt: sameProduct ? oldItem.adminAddedAt : new Date(),
            adminAddedById: sameProduct ? oldItem.adminAddedById : req.user.id,
            adminUnbilled: Boolean(oldItem?.adminUnbilled || (financialLocked && changed))
          }
        }) })
        const nextTariffCode = data.deliveryTariffCode !== undefined ? data.deliveryTariffCode : previous.deliveryTariffCode
        const nextPickupPoint = data.deliveryPickupPoint !== undefined ? data.deliveryPickupPoint : previous.deliveryPickupPoint
        const amounts = calculateOrderEditAmounts({
          items: nextItems,
          deliveryPrice: data.deliveryPrice ?? previous.deliveryPrice,
          deliveryTariffCode: nextTariffCode,
          deliveryPickupPoint: nextPickupPoint,
          discountAmount: previous.discountAmount,
          financialLocked,
          previousTotal: previous.total,
          previousUnbilledAdjustment: previous.unbilledAdjustment
        })
        if (!amounts) throw Object.assign(new Error('Скидка и списанные баллы превышают новую стоимость заказа'), { status: 400 })
        data.total = amounts.total
        data.unbilledAdjustment = amounts.unbilledAdjustment
        if (!financialLocked) data.paymentAmount = amounts.paymentAmount
      } else if (changesDeliveryAmount) {
        const subtotal = previous.items.reduce((sum, item) => sum + item.quantity * item.price, 0)
        const nextTariffCode = data.deliveryTariffCode !== undefined ? data.deliveryTariffCode : previous.deliveryTariffCode
        const nextPickupPoint = data.deliveryPickupPoint !== undefined ? data.deliveryPickupPoint : previous.deliveryPickupPoint
        const siteDelivery = nextTariffCode || nextPickupPoint ? 0 : (data.deliveryPrice ?? previous.deliveryPrice ?? 0)
        if (subtotal + siteDelivery < Number(previous.discountAmount || 0)) throw Object.assign(new Error('Скидка и списанные баллы превышают новую стоимость заказа'), { status: 400 })
        data.total = Math.round(Math.max(0, subtotal + siteDelivery - Number(previous.discountAmount || 0)) * 100) / 100
        data.paymentAmount = data.total
      }
      if (wantsItems) data.editVersion = { increment: 1 }
      const updated = await tx.order.update({ where: { id: orderId }, data, include: { items: { include: { product: { select: { title: true, image: true } } } } } })
      if (wantsItems) {
        await tx.orderEditLog.create({
          data: {
            orderId,
            adminId: req.user.id,
            beforeJson: JSON.stringify({ total: previous.total, paymentAmount: previous.paymentAmount, unbilledAdjustment: previous.unbilledAdjustment, items: previous.items.map(({ id, productId, dosage, quantity, price, adminAddedById, adminUnbilled }) => ({ id, productId, dosage, quantity, price, adminAddedById, adminUnbilled })) }),
            afterJson: JSON.stringify({ total: updated.total, paymentAmount: updated.paymentAmount, unbilledAdjustment: updated.unbilledAdjustment, items: updated.items.map(({ id, productId, dosage, quantity, price, adminAddedById, adminUnbilled }) => ({ id, productId, dosage, quantity, price, adminAddedById, adminUnbilled })) })
          }
        })
        await syncPartnerCommissionForOrder(tx, updated.id)
      }
      return updated
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
    const { active, limit = 100, offset = 0, q = '' } = req.query
    const search = String(q || '').trim()

    const where = {}
    if (active !== undefined) {
      where.active = active === 'true'
    }

    if (search) {
      const numericId = Number.parseInt(search, 10)
      const numericPrice = Number.parseFloat(search.replace(',', '.'))
      const normalizedSearch = search.toLowerCase()
      const isHiddenSearch = ['скрыт', 'hidden', 'inactive', 'неактив'].some(token => normalizedSearch.includes(token))
      const isActiveSearch = !isHiddenSearch && ['актив', 'active', 'видим', 'visible'].some(token => normalizedSearch.includes(token))

      where.OR = [
        ...(Number.isFinite(numericId) ? [{ id: numericId }, { stock: numericId }, { weight: numericId }] : []),
        ...(Number.isFinite(numericPrice) ? [{ price: numericPrice }] : []),
        { title: { contains: search } },
        { slug: { contains: search } },
        { sku: { contains: search } },
        { country: { contains: search } },
        { categories: { some: { name: { contains: search } } } },
        { categories: { some: { slug: { contains: search } } } },
        ...(isActiveSearch ? [{ active: true }] : []),
        ...(isHiddenSearch ? [{ active: false }] : [])
      ]
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

router.post('/products/stock-adjustments', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { mode, entries } = parseStockAdjustmentRequest(req.body)
    const changes = await prisma.$transaction(tx => applyStockAdjustments(tx, { mode, entries }))
    res.json({ changes })
  } catch (error) {
    if (error.status === 409 && error.productId) {
      const current = await prisma.product.findUnique({ where: { id: error.productId }, select: { stock: true } })
      return res.status(409).json({ error: error.message, productId: error.productId, currentStock: current?.stock ?? null })
    }
    next(error)
  }
})

router.get('/products/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        categories: { select: { id: true, name: true, slug: true } },
        recommendationsFrom: { orderBy: [{ placement: 'asc' }, { position: 'asc' }] }
      }
    })

    if (!product) {
      return res.status(404).json({ error: 'Товар не найден' })
    }

    const parsedProduct = {
      ...product,
      productRecommendationIds: product.recommendationsFrom.filter(item => item.placement === 'PRODUCT').map(item => item.targetProductId),
      cartRecommendationIds: product.recommendationsFrom.filter(item => item.placement === 'CART').map(item => item.targetProductId),
      recommendationsFrom: undefined,
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
    const productId = parseInt(req.params.id, 10)
    const result = await deleteProductForAdmin(prisma, productId)
    res.json(result)
  } catch (error) {
    next(error)
  }
})

export default router
