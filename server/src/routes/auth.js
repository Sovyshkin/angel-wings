import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'
import { validateBasicPassword, validatePasswordPolicy } from '../utils/passwordPolicy.js'
import emailService, { generateEmailCode, hashEmailCode } from '../services/email.js'

const router = Router()
const prisma = new PrismaClient()
const EMAIL_CODE_TTL_MINUTES = Number(process.env.EMAIL_CODE_TTL_MINUTES || 15)

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
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
      code
    })
  } catch (error) {
    await prisma.emailVerificationCode.delete({
      where: { id: verification.id }
    }).catch(() => {})
    throw error
  }

  return expiresAt
}

router.post('/register', async (req, res, next) => {
  try {
    const { password, name, phone } = req.body
    const email = normalizeEmail(req.body.email)

    const passwordError = validateBasicPassword(password)
    if (passwordError) return res.status(400).json({ error: passwordError })
    
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(400).json({ error: 'Email уже зарегистрирован' })
    }
    
    const hashedPassword = await bcrypt.hash(password, 10)
    
    let user
    let expiresAt
    try {
      user = await prisma.user.create({
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

      expiresAt = await createAndSendEmailCode(user)
    } catch (error) {
      if (user?.id) {
        await prisma.user.delete({ where: { id: user.id } }).catch(() => {})
      }
      throw error
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
    const email = normalizeEmail(req.body.email)
    
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ error: 'Неверные учётные данные' })
    }
    
    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ error: 'Неверные учётные данные' })
    }

    if (!user.emailVerified && user.role !== 'ADMIN') {
      await createAndSendEmailCode(user)
      return res.status(403).json({
        error: 'Email не подтверждён. Мы отправили новый код подтверждения на почту.',
        code: 'EMAIL_NOT_VERIFIED',
        email: user.email
      })
    }
    
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        address: user.address,
        emailVerified: user.emailVerified
      },
      token
    })
  } catch (error) {
    next(error)
  }
})

router.post('/verify-email', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email)
    const code = String(req.body.code || '').trim()

    if (!email || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Введите корректный код из 6 цифр' })
    }

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    if (user.emailVerified) {
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })
      return res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          address: user.address,
          emailVerified: true
        },
        token
      })
    }

    const verification = await prisma.emailVerificationCode.findFirst({
      where: {
        userId: user.id,
        email: user.email,
        purpose: 'email_verification',
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

    const updatedUser = await prisma.$transaction(async (tx) => {
      await tx.emailVerificationCode.update({
        where: { id: verification.id },
        data: { usedAt: new Date() }
      })

      return tx.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          phone: true,
          address: true,
          emailVerified: true
        }
      })
    })

    const token = jwt.sign({ userId: updatedUser.id }, process.env.JWT_SECRET, { expiresIn: '7d' })

    res.json({ user: updatedUser, token })
  } catch (error) {
    next(error)
  }
})

router.post('/resend-verification', async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email)
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return res.status(404).json({ error: 'Пользователь не найден' })
    }

    if (user.emailVerified) {
      return res.json({ message: 'Email уже подтверждён' })
    }

    const recentCode = await prisma.emailVerificationCode.findFirst({
      where: {
        userId: user.id,
        purpose: 'email_verification',
        createdAt: { gt: new Date(Date.now() - 60 * 1000) }
      },
      orderBy: { createdAt: 'desc' }
    })

    if (recentCode) {
      return res.status(429).json({ error: 'Новый код можно запросить через минуту' })
    }

    const expiresAt = await createAndSendEmailCode(user)
    res.json({ message: 'Код отправлен повторно', expiresAt })
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
