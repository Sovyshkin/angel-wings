import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticate } from '../middleware/auth.js'

const router = Router()
const prisma = new PrismaClient()

function mapTransaction(transaction) {
  return {
    id: transaction.id,
    amount: transaction.amount,
    balanceAfter: transaction.balanceAfter,
    type: transaction.type,
    message: transaction.message,
    orderId: transaction.orderId,
    seenAt: transaction.seenAt,
    createdAt: transaction.createdAt
  }
}

router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const [user, recentTransactions, unseenCredits] = await Promise.all([
      prisma.user.findUnique({
        where: { id: req.user.id },
        select: { pointsBalance: true }
      }),
      prisma.userPointTransaction.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50
      }),
      prisma.userPointTransaction.findMany({
        where: {
          userId: req.user.id,
          type: 'ADMIN_CREDIT',
          amount: { gt: 0 },
          seenAt: null
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ])

    res.json({
      balance: Math.max(0, Number(user?.pointsBalance || 0)),
      transactions: recentTransactions.map(mapTransaction),
      unseenCredits: unseenCredits.map(mapTransaction)
    })
  } catch (error) {
    next(error)
  }
})

router.post('/seen', authenticate, async (req, res, next) => {
  try {
    const ids = Array.isArray(req.body?.ids)
      ? req.body.ids.map(id => parseInt(id, 10)).filter(id => Number.isInteger(id) && id > 0)
      : []

    const where = {
      userId: req.user.id,
      type: 'ADMIN_CREDIT',
      seenAt: null,
      ...(ids.length ? { id: { in: ids } } : {})
    }

    const result = await prisma.userPointTransaction.updateMany({
      where,
      data: { seenAt: new Date() }
    })

    res.json({ marked: result.count })
  } catch (error) {
    next(error)
  }
})

export default router
