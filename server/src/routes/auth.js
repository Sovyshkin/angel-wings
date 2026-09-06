import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'
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
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    address: user.address,
    emailVerified: user.emailVerified
  }
}

function createSessionToken(userId) {
  return jwt.sign({ userId, purpose: 'session' }, process.env.JWT_SECRET, { expiresIn: SESSION_TOKEN_TTL })
}

function getClientUrl() {
  return String(process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '')
}

function createPasswordResetToken() {
  return crypto.randomBytes(32).toString('hex')
}

function createLoginChallenge(userId) {
  return jwt.sign(
    { userId, purpose: 'login_verification' },
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
    const { password, name, phone } = req.body
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
        emailVerified: false
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        emailVerified: true,
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
      if (user.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Доступ в админку разрешён только администраторам' })
      }

      let expiresAt
      try {
        expiresAt = await createOrReuseLoginCode(user)
      } catch (error) {
        if (!isEmailDeliveryError(error)) throw error
        console.warn('[AUTH] Admin login email verification bypassed because email delivery failed', JSON.stringify({
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
      return res.status(202).json({
        requiresLoginVerification: true,
        email: user.email,
        challengeToken: createLoginChallenge(user.id),
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
    if (purpose === 'login_verification') {
      const challenge = readLoginChallenge(req.body.challengeToken)
      if (!challenge) {
        return res.status(401).json({ error: 'Сессия подтверждения истекла. Введите email и пароль ещё раз.' })
      }
      user = await prisma.user.findUnique({ where: { id: Number(challenge.userId) } })
    } else {
      if (!email) return res.status(400).json({ error: 'Укажите email' })
      user = await findUserByEmail(prisma, email)
    }

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    if (purpose === 'login_verification' && req.body.adminLogin === true && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Доступ в админку разрешён только администраторам' })
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
      token: createSessionToken(verifiedUser.id)
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

    if (purpose === 'login_verification') {
      const challenge = readLoginChallenge(req.body.challengeToken)
      if (!challenge) {
        return res.status(401).json({ error: 'Сессия подтверждения истекла. Выполните вход заново.' })
      }
      user = await prisma.user.findUnique({ where: { id: Number(challenge.userId) } })
    } else {
      const email = normalizeEmail(req.body.email)
      user = await findUserByEmail(prisma, email)
    }

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    if (purpose === 'login_verification' && req.body.adminLogin === true && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Доступ в админку разрешён только администраторам' })
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

    const passwordError = resetRecord.user?.role === 'ADMIN'
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
  res.json({ user: req.user })
})

router.put('/me', authenticate, async (req, res, next) => {
  try {
    const { name, phone, address } = req.body
    
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone, address },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        address: true
      }
    })
    
    res.json({ user })
  } catch (error) {
    next(error)
  }
})

router.put('/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body

    const user = await prisma.user.findUnique({ where: { id: req.user.id } })

    const passwordError = user?.role === 'ADMIN'
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
