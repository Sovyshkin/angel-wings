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

// A read-only preview. Order creation independently rechecks the actual payable
// amount and spends points atomically, so this endpoint never reserves balance.
router.post('/spend/preview', authenticate, async (req, res, next) => {
  try {
    const amount = Number(req.body?.amount)
    const maxSpendable = Number(req.body?.maxSpendable)
    if (!Number.isSafeInteger(amount) || amount <= 0) {
      return res.status(400).json({ error: 'Укажите целое количество баллов больше нуля' })
    }
    if (!Number.isFinite(maxSpendable) || maxSpendable <= 0) {
      return res.status(400).json({ error: 'Баллы нельзя списать на этот заказ' })
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { pointsBalance: true }
    })
    const balance = Math.max(0, Number(user?.pointsBalance || 0))
    if (amount > balance) {
      return res.status(400).json({ error: `Доступно только ${balance.toLocaleString('ru-RU')} баллов`, balance })
    }
    if (amount > Math.floor(maxSpendable)) {
      return res.status(400).json({ error: 'Сумма списания превышает допустимую сумму заказа', balance })
    }
    res.json({ amount, balance })
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
