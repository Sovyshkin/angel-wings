import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()
const STATUSES = new Set(['NEW', 'IN_PROGRESS', 'DONE', 'ARCHIVED'])

function normalizeStatus(value, fallback = 'NEW') {
  const status = String(value || '').trim().toUpperCase()
  return STATUSES.has(status) ? status : fallback
}

function cleanText(value, maxLength = 1000) {
  const text = String(value || '').trim()
  return text ? text.slice(0, maxLength) : null
}

router.get('/', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const { status = 'NEW', limit = 100, offset = 0 } = req.query
    const normalizedStatus = String(status || '').trim().toUpperCase()
    const where = STATUSES.has(normalizedStatus) ? { status: normalizedStatus } : {}

    const [requests, total, newCount] = await Promise.all([
      prisma.contactRequest.findMany({
        where,
        include: {
          handledBy: { select: { id: true, name: true, email: true } }
        },
        take: Math.min(100, Math.max(1, parseInt(limit, 10) || 100)),
        skip: Math.max(0, parseInt(offset, 10) || 0),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.contactRequest.count({ where }),
      prisma.contactRequest.count({ where: { status: 'NEW' } })
    ])

    res.json({ requests, total, newCount })
  } catch (error) {
    next(error)
  }
})

router.patch('/:id', authenticate, requireAdmin, async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10)
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Некорректный ID заявки' })
    }

    const status = normalizeStatus(req.body?.status, null)
    if (!status) {
      return res.status(400).json({ error: 'Некорректный статус заявки' })
    }

    const request = await prisma.contactRequest.update({
      where: { id },
      data: {
        status,
        adminNote: cleanText(req.body?.adminNote, 1200),
        handledById: req.user.id,
        handledAt: new Date()
      },
      include: {
        handledBy: { select: { id: true, name: true, email: true } }
      }
    })

    res.json({ request })
  } catch (error) {
    if (error?.code === 'P2025') {
      return res.status(404).json({ error: 'Заявка не найдена' })
    }
    next(error)
  }
})

export default router
