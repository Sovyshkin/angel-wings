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
import emailService from '../services/email.js'

const router = Router()
const prisma = new PrismaClient()
const ALLOWED_USER_ROLES = ['USER', 'ADMIN', 'PARTNER']
const ADMIN_PASSWORD_LENGTH = 18

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
    const { password, name, role = 'USER', phone } = req.body
    const email = normalizeEmail(req.body.email)
    const normalizedRole = String(role || 'USER').toUpperCase()

    if (!ALLOWED_USER_ROLES.includes(normalizedRole)) {
      return res.status(400).json({ error: 'Некорректная роль пользователя' })
    }

    const generatedAdminPassword = normalizedRole === 'ADMIN' ? generateSecureAdminPassword() : null
    const effectivePassword = generatedAdminPassword || password
    const passwordError = generatedAdminPassword ? null : validateBasicPassword(effectivePassword)
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
          createdAt: true
        }
      })

      if (normalizedRole === 'PARTNER') {
        await ensurePartnerForUser(tx, createdUser.id)
      }

      return createdUser
    })

    if (generatedAdminPassword) {
      try {
        await emailService.sendAdminInvite({
          to: user.email,
          name: user.name,
          password: generatedAdminPassword,
          adminUrl: getAdminLoginUrl()
        })
      } catch (emailError) {
        await prisma.user.delete({ where: { id: user.id } }).catch(() => null)
        throw emailError
      }
    }
    
    res.status(201).json({ user, adminInviteSent: Boolean(generatedAdminPassword) })
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

    if (user.role !== 'ADMIN') {
      return res.status(400).json({ error: 'Повторная отправка доступна только для администраторов' })
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
        adminUrl: getAdminLoginUrl()
      })
    } catch (emailError) {
      await prisma.user.update({
        where: { id: userId },
        data: { password: user.password }
      }).catch(() => null)
      throw emailError
    }

    res.json({ message: 'Письмо с новыми данными администратора отправлено', adminInviteSent: true })
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

    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, password: true }
    })

    if (!currentUser || currentUser.role === 'DELETED') {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }
    
    const passwordUpdate = {}
    const generatedAdminPassword = normalizedRole === 'ADMIN' && currentUser.role !== 'ADMIN'
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
          adminUrl: getAdminLoginUrl()
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

    const recipients = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        email: true,
        name: true
      },
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
        await emailService.sendCampaignEmail({
          to: recipient.email,
          subject,
          body: body.replace(/\{\{\s*name\s*\}\}/gi, recipient.name || 'клиент')
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

router.get('/orders', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0, q = '' } = req.query
    const search = String(q || '').trim()
    const where = status ? { status } : {}

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
    
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: { select: { title: true, image: true } }
            }
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
          await syncPartnerCommissionForOrder(prisma, order.id)
          await sendCloudKassirIncomeReceiptOnPaidTransition(
            prisma,
            order.id,
            order.paymentStatus,
            normalized,
            'admin-orders-auto-sync'
          )
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

    await attachPartnerBonusInfoToOrders(orders)

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

    const previousOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { paymentStatus: true }
    })

    const order = await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: normalizedStatus }
    })

    await syncPartnerCommissionForOrder(prisma, order.id)
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
