import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

try {
  const columns = await prisma.$queryRawUnsafe("PRAGMA table_info('orders')")
  if (!columns.length) throw new Error('Таблица orders отсутствует')
  if (!columns.some(column => column.name === 'paymentType')) {
    await prisma.$executeRawUnsafe('ALTER TABLE orders ADD COLUMN paymentType TEXT')
    console.log('[DB] added orders.paymentType')
  } else {
    console.log('[DB] orders.paymentType already exists')
  }
} finally {
  await prisma.$disconnect()
}
