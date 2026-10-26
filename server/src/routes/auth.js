import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { authenticate, isAdminPanelRole } from '../middleware/auth.js'
import { validateBasicPassword, validatePasswordPolicy } from '../utils/passwordPolicy.js'
import emailService, { generateEmailCode, hashEmailCode } from '../services/email.js'
import { findUserByEmail, normalizeEmail } from '../utils/userEmail.js'

const router = Router()
const prisma = new PrismaClient()
const EMAIL_CODE_TTL_MINUTES = Number(process.env.EMAIL_CODE_TTL_MINUTES || 15)
const PASSWORD_RESET_TTL_MINUTES = Number(process.env.PASSWORD_RESET_TTL_MINUTES || 30)
const SESSION_TOKEN_TTL = process.env.SESSION_TOKEN_TTL || '30d'

function getPublicUser(user) {
  return {
    id: user.id,
    telegramId: user.telegramId,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    address: user.address,
    pointsBalance: Math.max(0, Number(user.pointsBalance || 0)),
    emailVerified: user.emailVerified,
    marketingConsent: Boolean(user.marketingConsentAt && !user.marketingUnsubscribedAt)
  }
}

// Telegram Mini App data is signed by the bot. Never trust initDataUnsafe.
function inspectTelegramInitData(initData, botToken, now = Date.now()) {
  if (typeof initData !== 'string' || !initData || initData.length > 8192) return { reason: 'MISSING_DATA' }
  if (!botToken) return { reason: 'BOT_TOKEN_MISSING' }
  const params = new URLSearchParams(initData)
  const entries = [...params.entries()]
  if (new Set(entries.map(([key]) => key)).size !== entries.length) return { reason: 'DUPLICATE_FIELDS' }
  const hash = params.get('hash') || ''
  if (!/^[a-f\d]{64}$/i.test(hash)) return { reason: 'INVALID_HASH_FORMAT' }
  const authDateRaw = params.get('auth_date')
  const authDate = Number(authDateRaw)
  if (!authDateRaw || !/^\d+$/.test(authDateRaw) || !Number.isSafeInteger(authDate)) return { reason: 'INVALID_AUTH_DATE' }
  const age = now / 1000 - authDate
  if (age < -60 || age > 24 * 60 * 60) return { reason: 'EXPIRED' }
  const checkString = entries
    // Bot-token validation includes signature when Telegram supplies it.
    // Excluding signature applies only to third-party Ed25519 validation.
    .filter(([key]) => key !== 'hash')
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
  const secret = crypto.createHmac('sha256', 'WebAppData').update(botToken).digest()
  const expected = crypto.createHmac('sha256', secret).update(checkString).digest()
  if (!crypto.timingSafeEqual(Buffer.from(hash, 'hex'), expected)) return { reason: 'INVALID_SIGNATURE' }
  try {
    const user = JSON.parse(params.get('user') || 'null')
    if (!user || !/^[1-9]\d*$/.test(String(user.id))) return { reason: 'INVALID_USER' }
    return { user }
  } catch {
    return { reason: 'INVALID_USER' }
  }
}

export function verifyTelegramInitData(initData, botToken, now = Date.now()) {
  return inspectTelegramInitData(initData, botToken, now).user || null
}

router.post('/telegram', async (req, res, next) => {
  try {
    const botToken = String(process.env.TELEGRAM_MINI_APP_BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || '').trim()
    if (!botToken) return res.status(503).json({ error: 'Telegram авторизация не настроена' })
    const validation = inspectTelegramInitData(req.body?.initData, botToken)
    if (!validation.user) {
      const params = typeof req.body?.initData === 'string' ? new URLSearchParams(req.body.initData) : null
      console.warn('[AUTH] Telegram initData rejected', validation.reason, {
        hasHash: params?.has('hash') || false,
        hashLength: params?.get('hash')?.length || 0,
        hasAuthDate: params?.has('auth_date') || false,
        hasUser: params?.has('user') || false,
        hasSignature: params?.has('signature') || false,
        dataLength: typeof req.body?.initData === 'string' ? req.body.initData.length : 0
      })
      const error = validation.reason === 'EXPIRED'
        ? 'Сессия Telegram устарела. Закройте приложение и откройте снова через бота.'
        : validation.reason === 'INVALID_SIGNATURE'
          ? 'Подпись Telegram не совпадает. Проверьте токен бота мини-приложения на сервере.'
          : 'Не удалось проверить данные Telegram. Откройте приложение снова через бота.'
      return res.status(401).json({ error, code: validation.reason })
    }
    const telegramUser = validation.user
    const telegramId = String(telegramUser.id)
    const name = [telegramUser.first_name, telegramUser.last_name].filter(Boolean).join(' ').trim().slice(0, 120) || 'Пользователь Telegram'
    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {},
      create: {
        telegramId,
        email: `tg-${telegramId}@telegram.invalid`,
        password: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
        name,
        emailVerified: false
      }
    })
    if (user.role === 'DELETED') return res.status(403).json({ error: 'Учётная запись недоступна' })
    res.json({ user: getPublicUser(user), token: createSessionToken(user.id) })
  } catch (error) {
    next(error)
  }
})

function createSessionToken(userId, adminPanel = false) {
  return jwt.sign({ userId, purpose: 'session', ...(adminPanel ? { adminPanel: true } : {}) }, process.env.JWT_SECRET, { expiresIn: SESSION_TOKEN_TTL })
}

function getClientUrl() {
  return String(process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '')
}

function createPasswordResetToken() {
  return crypto.randomBytes(32).toString('hex')
}

function createLoginChallenge(userId, adminPanel = false) {
  return jwt.sign(
    { userId, purpose: 'login_verification', ...(adminPanel ? { adminPanel: true } : {}) },
    process.env.JWT_SECRET,
    { expiresIn: `${EMAIL_CODE_TTL_MINUTES}m` }
  )
}

function readLoginChallenge(token) {
  try {
    const payload = jwt.verify(String(token || ''), process.env.JWT_SECRET)
    if (payload?.purpose !== 'login_verification' || !payload?.userId) return null
    return payload
  } catch {
    return null
  }
}

function isEmailDeliveryError(error) {
  return error?.name === 'EmailDeliveryError' ||
    [
      'EMAIL_DELIVERY_FAILED',
      'EMAIL_RELAY_REJECTED',
      'EMAIL_RELAY_NOT_CONFIGURED',
      'SMTP_NOT_CONFIGURED',
      'SMTP_CONNECTION_FAILED',
      'SMTP_AUTH_FAILED',
      'SMTP_DELIVERY_FAILED'
    ].includes(error?.code)
}

async function createAuthResponse(user, message, extra = {}) {
  const actualUser = user.emailVerified
    ? user
    : await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true }
    })

  return {
    user: getPublicUser(actualUser),
    token: createSessionToken(actualUser.id),
    message,
    emailVerificationBypassed: true,
    ...extra
  }
}

async function createAndSendEmailCode(user, purpose = 'email_verification') {
  const code = generateEmailCode()
  const expiresAt = new Date(Date.now() + EMAIL_CODE_TTL_MINUTES * 60 * 1000)

  const verification = await prisma.emailVerificationCode.create({
    data: {
      userId: user.id,
      email: user.email,
      codeHash: hashEmailCode(code),
      purpose,
      expiresAt
    }
  })

  try {
    await emailService.sendVerificationCode({
      to: user.email,
      name: user.name,
      code,
      purpose
    })
  } catch (error) {
    await prisma.emailVerificationCode.delete({
      where: { id: verification.id }
    }).catch(() => {})
    throw error
  }

  return expiresAt
}

async function createOrReuseLoginCode(user) {
  const recentCode = await prisma.emailVerificationCode.findFirst({
    where: {
      userId: user.id,
      purpose: 'login_verification',
      usedAt: null,
      expiresAt: { gt: new Date() },
      createdAt: { gt: new Date(Date.now() - 60 * 1000) }
    },
    orderBy: { createdAt: 'desc' }
  })

  return recentCode?.expiresAt || createAndSendEmailCode(user, 'login_verification')
}

router.post('/register', async (req, res, next) => {
  try {
    const { password, name, phone, marketingConsent } = req.body
    const email = normalizeEmail(req.body.email)

    const passwordError = validateBasicPassword(password)
    if (passwordError) return res.status(400).json({ error: passwordError })
    
    const existing = await findUserByEmail(prisma, email)
    if (existing) {
      return res.status(400).json({ error: 'Email уже зарегистрирован' })
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
        emailVerified: false,
        marketingConsentAt: marketingConsent === true ? new Date() : null
      },
      select: {
        id: true,
        telegramId: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        emailVerified: true,
        marketingConsentAt: true,
        marketingUnsubscribedAt: true,
        createdAt: true
      }
    })

    let expiresAt
    try {
      expiresAt = await createAndSendEmailCode(user)
    } catch (error) {
      if (!isEmailDeliveryError(error)) throw error
      console.warn('[AUTH] Email verification bypassed after register because email delivery failed', JSON.stringify({
        userId: user.id,
        email: user.email,
        code: error.code || null
      }))
      return res.status(201).json(await createAuthResponse(
        user,
        'Регистрация завершена. Почта временно недоступна, поэтому код подтверждения пропущен.',
        { emailDeliveryUnavailable: true }
      ))
    }

    res.status(201).json({
      requiresEmailVerification: true,
      email: user.email,
      expiresAt,
      message: 'Мы отправили код подтверждения на вашу почту'
    })
  } catch (error) {
    next(error)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const { password } = req.body
    const isAdminLogin = req.body.adminLogin === true
    const email = normalizeEmail(req.body.email)
    
    const user = await findUserByEmail(prisma, email)
    if (!user) {
      return res.status(401).json({ error: 'Неверные учётные данные' })
    }
    
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ error: 'Неверные учётные данные' })
    }

    if (isAdminLogin) {
      if (!isAdminPanelRole(user.role)) {
        return res.status(403).json({ error: 'Доступ в админку запрещён' })
      }

      let expiresAt
      try {
        expiresAt = await createOrReuseLoginCode(user)
      } catch (error) {
        if (!isEmailDeliveryError(error)) throw error
        return res.status(503).json({ error: 'Не удалось отправить код подтверждения. Попробуйте позже.' })
      }
      return res.status(202).json({
        requiresLoginVerification: true,
        email: user.email,
        challengeToken: createLoginChallenge(user.id, true),
        expiresAt,
        message: 'Введите код подтверждения, отправленный на вашу почту'
      })
    }

    if (!user.emailVerified) {
      try {
        await createAndSendEmailCode(user)
      } catch (error) {
        if (!isEmailDeliveryError(error)) throw error
        console.warn('[AUTH] Email verification bypassed on unverified login because email delivery failed', JSON.stringify({
          userId: user.id,
          email: user.email,
          code: error.code || null
        }))
        return res.json(await createAuthResponse(
          user,
          'Вход выполнен. Почтовый сервис временно недоступен, поэтому код подтверждения пропущен.',
          { emailDeliveryUnavailable: true }
        ))
      }
      return res.status(403).json({
        error: 'Email не подтверждён. Мы отправили новый код подтверждения на почту.',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email
      })
    }

    let expiresAt
    try {
      expiresAt = await createOrReuseLoginCode(user)
    } catch (error) {
      if (!isEmailDeliveryError(error)) throw error
      console.warn('[AUTH] Login email verification bypassed because email delivery failed', JSON.stringify({
        userId: user.id,
        email: user.email,
        code: error.code || null
      }))
      return res.json(await createAuthResponse(
        user,
        'Вход выполнен. Почтовый сервис временно недоступен, поэтому код подтверждения пропущен.',
        { emailDeliveryUnavailable: true }
      ))
    }
    res.status(202).json({
      requiresLoginVerification: true,
      email: user.email,
      challengeToken: createLoginChallenge(user.id),
      expiresAt,
      message: 'Введите код подтверждения, отправленный на вашу почту'
    })
  } catch (error) {
    next(error)
  }
})

router.post('/verify-email', async (req, res, next) => {
  try {
    const purpose = req.body.purpose === 'login_verification'
      ? 'login_verification'
      : 'email_verification'
    const email = normalizeEmail(req.body.email)
    const code = String(req.body.code || '').trim()

    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Введите корректный код из 6 цифр' })
    }

    let user
    let challenge = null
    if (purpose === 'login_verification') {
      challenge = readLoginChallenge(req.body.challengeToken)
      if (!challenge) {
        return res.status(401).json({ error: 'Сессия подтверждения истекла. Введите email и пароль ещё раз.' })
      }
      if (req.body.adminLogin === true && challenge.adminPanel !== true) {
        return res.status(403).json({ error: 'Войдите через страницу админки заново' })
      }
      user = await prisma.user.findUnique({ where: { id: Number(challenge.userId) } })
    } else {
      if (!email) return res.status(400).json({ error: 'Укажите email' })
      user = await findUserByEmail(prisma, email)
    }

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    if (purpose === 'login_verification' && challenge.adminPanel === true && !isAdminPanelRole(user.role)) {
      return res.status(403).json({ error: 'Доступ в админку запрещён' })
    }

    if (purpose === 'email_verification' && user.emailVerified) {
      return res.status(400).json({ error: 'Email уже подтверждён. Выполните вход заново.' })
    }

    const verification = await prisma.emailVerificationCode.findFirst({
      where: {
        userId: user.id,
        email: user.email,
        purpose,
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (!verification) {
      return res.status(400).json({ error: 'Код истёк. Запросите новый код подтверждения.' })
    }

    if (verification.attempts >= 5) {
      return res.status(429).json({ error: 'Слишком много попыток. Запросите новый код.' })
    }

    const codeMatches = verification.codeHash === hashEmailCode(code)
    if (!codeMatches) {
      await prisma.emailVerificationCode.update({
        where: { id: verification.id },
        data: { attempts: { increment: 1 } }
      })
      return res.status(400).json({ error: 'Неверный код подтверждения' })
    }

    const verifiedUser = await prisma.$transaction(async (tx) => {
      await tx.emailVerificationCode.update({
        where: { id: verification.id },
        data: { usedAt: new Date() }
      })

      if (purpose === 'email_verification') {
        return tx.user.update({
          where: { id: user.id },
          data: { emailVerified: true }
        })
      }

      return user
    })

    res.json({
      user: getPublicUser(verifiedUser),
      token: createSessionToken(verifiedUser.id, purpose === 'login_verification' && challenge?.adminPanel === true)
    })
  } catch (error) {
    next(error)
  }
})

router.post('/resend-verification', async (req, res, next) => {
  try {
    const purpose = req.body.purpose === 'login_verification'
      ? 'login_verification'
      : 'email_verification'
    let user
    let challenge = null

    if (purpose === 'login_verification') {
      challenge = readLoginChallenge(req.body.challengeToken)
      if (!challenge) {
        return res.status(401).json({ error: 'Сессия подтверждения истекла. Выполните вход заново.' })
      }
      if (req.body.adminLogin === true && challenge.adminPanel !== true) {
        return res.status(403).json({ error: 'Войдите через страницу админки заново' })
      }
      user = await prisma.user.findUnique({ where: { id: Number(challenge.userId) } })
    } else {
      const email = normalizeEmail(req.body.email)
      user = await findUserByEmail(prisma, email)
    }

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    if (purpose === 'login_verification' && challenge.adminPanel === true && !isAdminPanelRole(user.role)) {
      return res.status(403).json({ error: 'Доступ в админку запрещён' })
    }

    if (purpose === 'email_verification' && user.emailVerified) {
      return res.json({ message: 'Email уже подтверждён' })
    }

    const recentCode = await prisma.emailVerificationCode.findFirst({
      where: {
        userId: user.id,
        purpose,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (recentCode) {
      return res.status(429).json({ error: 'Новый код можно запросить через минуту' })
    }

    const expiresAt = await createAndSendEmailCode(user, purpose)
    res.json({ message: 'Код отправлен повторно', expiresAt })
  } catch (error) {
    next(error)
  }
})

router.post('/forgot-password', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email)
    const genericResponse = {
      message: 'Если такой email зарегистрирован, мы отправили ссылку для восстановления пароля.'
    }

    if (!email) return res.json(genericResponse)

    const user = await findUserByEmail(prisma, email)
    if (!user) return res.json(genericResponse)

    const recentReset = await prisma.emailVerificationCode.findFirst({
      where: {
        userId: user.id,
        purpose: 'password_reset',
        usedAt: null,
        createdAt: { gt: new Date(Date.now() - 60 * 1000) }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (recentReset) return res.json(genericResponse)

    const token = createPasswordResetToken()
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000)
    const resetUrl = `${getClientUrl()}/reset-password?token=${encodeURIComponent(token)}`

    const resetRecord = await prisma.emailVerificationCode.create({
      data: {
        userId: user.id,
        email: user.email,
        codeHash: hashEmailCode(token),
        purpose: 'password_reset',
        expiresAt
      }
    })

    try {
      await emailService.sendPasswordResetLink({
        to: user.email,
        name: user.name,
        resetUrl
      })
    } catch (error) {
      await prisma.emailVerificationCode.delete({ where: { id: resetRecord.id } }).catch(() => {})
      throw error
    }

    res.json(genericResponse)
  } catch (error) {
    next(error)
  }
})

router.post('/reset-password', async (req, res, next) => {
  try {
    const token = String(req.body.token || '').trim()
    const newPassword = String(req.body.password || '')

    if (!token || token.length < 32) {
      return res.status(400).json({ error: 'Ссылка восстановления недействительна или повреждена.' })
    }

    const tokenHash = hashEmailCode(token)
    const resetRecord = await prisma.emailVerificationCode.findFirst({
      where: {
        codeHash: tokenHash,
        purpose: 'password_reset',
        usedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: { user: true },
      orderBy: { createdAt: 'desc' }
    })

    if (!resetRecord) {
      return res.status(400).json({ error: 'Ссылка восстановления истекла или уже была использована.' })
    }

    if (resetRecord.attempts >= 5) {
      return res.status(429).json({ error: 'Слишком много попыток. Запросите новую ссылку восстановления.' })
    }

    const passwordError = isAdminPanelRole(resetRecord.user?.role)
      ? validatePasswordPolicy(newPassword, resetRecord.user)
      : validateBasicPassword(newPassword)
    if (passwordError) {
      await prisma.emailVerificationCode.update({
        where: { id: resetRecord.id },
        data: { attempts: { increment: 1 } }
      })
      return res.status(400).json({ error: passwordError })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: {
          password: hashedPassword,
          emailVerified: true
        }
      })

      await tx.emailVerificationCode.updateMany({
        where: {
          userId: resetRecord.userId,
          purpose: 'password_reset',
          usedAt: null
        },
        data: { usedAt: new Date() }
      })
    })

    res.json({ message: 'Пароль успешно обновлён. Теперь можно войти с новым паролем.' })
  } catch (error) {
    next(error)
  }
})

router.get('/me', authenticate, async (req, res) => {
  res.json({ user: getPublicUser(req.user), adminPanel: req.auth?.adminPanel === true })
})

router.put('/me', authenticate, async (req, res, next) => {
  try {
    const { name, phone, address } = req.body
    
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone, address },
      select: {
        id: true,
        telegramId: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true,
        pointsBalance: true,
        emailVerified: true,
        marketingConsentAt: true,
        marketingUnsubscribedAt: true
      }
    })
    
    res.json({ user: getPublicUser(user) })
  } catch (error) {
    next(error)
  }
})

router.put('/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })

    const passwordError = isAdminPanelRole(user?.role)
      ? validatePasswordPolicy(newPassword, user)
      : validateBasicPassword(newPassword)
    if (passwordError) return res.status(400).json({ error: passwordError })
    
    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) {
      return res.status(400).json({ error: 'Текущий пароль неверный' })
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    })
    
    res.json({ message: 'Password updated successfully' })
  } catch (error) {
    next(error)
  }
})

export default router
