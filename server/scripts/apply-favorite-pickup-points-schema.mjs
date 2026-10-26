import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { ensureFavoritePickupPointsTable } from '../src/utils/favoritePickupPoints.js'

const prisma = new PrismaClient()
try {
  await ensureFavoritePickupPointsTable(prisma)
  console.log('[DB] favorite_pickup_points is ready')
} finally {
  await prisma.$disconnect()
}
