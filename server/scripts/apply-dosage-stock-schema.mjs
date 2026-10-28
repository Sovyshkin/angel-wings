import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

try {
  const columns = await prisma.$queryRawUnsafe("PRAGMA table_info('order_items')")
  if (!columns.length) throw new Error('Таблица order_items отсутствует')
  if (!columns.some(column => column.name === 'dosageStockDeducted')) {
    await prisma.$executeRawUnsafe('ALTER TABLE order_items ADD COLUMN dosageStockDeducted INTEGER NOT NULL DEFAULT 0')
  }
  console.log('[DB] учёт списаний по дозировкам готов')
} finally {
  await prisma.$disconnect()
}
