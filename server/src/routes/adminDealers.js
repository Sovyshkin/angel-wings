import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate, requireAdmin } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

router.use(authenticate, requireAdmin)

function cleanOptional(value) {
  const text = String(value ?? '').trim()
  return text || null
}

function normalizePayload(body, { partial = false } = {}) {
  const payload = {}

  if (!partial || body.city !== undefined) {
    const city = String(body.city ?? '').trim()
    if (!city) {
      const error = new Error('Укажите город дилера')
      error.status = 400
      throw error
    }
    payload.city = city
  }

  ;['phone', 'address', 'telegram', 'instagram', 'max'].forEach((field) => {
    if (!partial || body[field] !== undefined) {
      payload[field] = cleanOptional(body[field])
    }
  })

  if (!partial || body.isActive !== undefined) {
    payload.isActive = body.isActive === true || body.isActive === 'true'
  }

  return payload
}

router.get('/', async (req, res, next) => {
  try {
    const dealers = await prisma.dealer.findMany({
      orderBy: [
        { isActive: 'desc' },
        { city: 'asc' },
        { id: 'asc' }
      ]
    })

    res.json({ dealers })
  } catch (error) {
    next(error)
  }
})

router.post('/', async (req, res, next) => {
  try {
    const dealer = await prisma.dealer.create({
      data: normalizePayload(req.body)
    })

    res.status(201).json({ dealer })
  } catch (error) {
    next(error)
  }
})

router.put('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Некорректный ID дилера' })
    }

    const dealer = await prisma.dealer.update({
      where: { id },
      data: normalizePayload(req.body, { partial: true })
    })

    res.json({ dealer })
  } catch (error) {
    next(error)
  }
})

router.delete('/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id)
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Некорректный ID дилера' })
    }

    await prisma.dealer.delete({ where: { id } })
    res.json({ message: 'Dealer deleted' })
  } catch (error) {
    next(error)
  }
})

export default router
