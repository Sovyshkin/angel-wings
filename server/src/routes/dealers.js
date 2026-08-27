import { Router } from 'express'
import { PrismaClient } from '@prisma/client'

const router = Router()
const prisma = new PrismaClient()

function formatDealer(dealer) {
  return {
    id: dealer.id,
    city: dealer.city,
    phone: dealer.phone,
    address: dealer.address,
    telegram: dealer.telegram,
    instagram: dealer.instagram,
    max: dealer.max
  }
}

router.get('/', async (req, res, next) => {
  try {
    const dealers = await prisma.dealer.findMany({
      where: { isActive: true },
      orderBy: [
        { city: 'asc' },
        { id: 'asc' }
      ]
    })

    res.json({ dealers: dealers.map(formatDealer) })
  } catch (error) {
    next(error)
  }
})

export default router
