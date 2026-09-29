import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()
const STATUSES = new Set(['PENDING_PAYMENT', 'NEW', 'IN_PROGRESS', 'DONE', 'CANCELLED'])

function cleanText(value, maxLength = 1500) {
  const text = String(value || '').trim()
  return text ? text.slice(0, maxLength) : null
}

router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const status = String(req.query?.status || '').trim().toUpperCase()
    const where = STATUSES.has(status) ? { status } : {}
    const [consultations, total, newCount] = await Promise.all([
      prisma.consultationRequest.findMany({
        where,
        include: { handledBy: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        take: Math.min(200, Math.max(1, parseInt(req.query?.limit, 10) || 100)),
        skip: Math.max(0, parseInt(req.query?.offset, 10) || 0)
      }),
      prisma.consultationRequest.count({ where }),
      prisma.consultationRequest.count({ where: { status: 'NEW' } })
    ])
    res.json({ consultations, total, newCount })
  } catch (error) {
    next(error)
  }
})

router.patch('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10)
    const status = String(req.body?.status || '').trim().toUpperCase()
    if (!Number.isInteger(id) || id <= 0 || !STATUSES.has(status)) {
      return res.status(400).json({ error: 'Некорректные данные заявки' })
    }

    const request = await prisma.consultationRequest.update({
      where: { id },
      data: {
        status,
        adminNote: cleanText(req.body?.adminNote),
        handledById: req.user.id,
        handledAt: new Date(),
        ...(status === 'DONE' ? { completedAt: new Date() } : {})
      },
      include: { handledBy: { select: { id: true, name: true, email: true } } }
    })
    res.json({ request })
  } catch (error) {
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Заявка не найдена' })
    next(error)
  }
})

export default router
