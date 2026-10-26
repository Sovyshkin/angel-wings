import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

try {
  const columns = await prisma.$queryRawUnsafe("PRAGMA table_info('orders')")
  if (!columns.length) throw new Error('Таблица orders отсутствует')
  if (!columns.some(column => column.name === 'origin')) {
    await prisma.$executeRawUnsafe("ALTER TABLE orders ADD COLUMN origin TEXT NOT NULL DEFAULT 'CHECKOUT'")
  }
  console.log('[DB] order origin is ready')
} finally {
  await prisma.$disconnect()
}
