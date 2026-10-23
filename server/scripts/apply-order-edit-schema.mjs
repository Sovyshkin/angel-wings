import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

try {
  const orderColumns = await prisma.$queryRawUnsafe("PRAGMA table_info('orders')")
  if (!orderColumns.length) throw new Error('Таблица orders отсутствует')
  if (!orderColumns.some(column => column.name === 'editVersion')) {
    await prisma.$executeRawUnsafe('ALTER TABLE orders ADD COLUMN editVersion INTEGER NOT NULL DEFAULT 0')
  }
  if (!orderColumns.some(column => column.name === 'unbilledAdjustment')) {
    await prisma.$executeRawUnsafe('ALTER TABLE orders ADD COLUMN unbilledAdjustment REAL NOT NULL DEFAULT 0')
  }
  const columns = await prisma.$queryRawUnsafe("PRAGMA table_info('order_items')")
  if (!columns.length) throw new Error('Таблица order_items отсутствует')
  if (!columns.some(column => column.name === 'adminAddedAt')) {
    await prisma.$executeRawUnsafe('ALTER TABLE order_items ADD COLUMN adminAddedAt DATETIME')
  }
  if (!columns.some(column => column.name === 'adminAddedById')) {
    await prisma.$executeRawUnsafe('ALTER TABLE order_items ADD COLUMN adminAddedById INTEGER')
  }
  if (!columns.some(column => column.name === 'adminUnbilled')) {
    await prisma.$executeRawUnsafe('ALTER TABLE order_items ADD COLUMN adminUnbilled BOOLEAN NOT NULL DEFAULT 0')
  }
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "order_edit_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "orderId" INTEGER NOT NULL,
    "adminId" INTEGER NOT NULL,
    "beforeJson" TEXT NOT NULL,
    "afterJson" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS order_edit_logs_orderId_createdAt_idx ON order_edit_logs(orderId, createdAt)')
  console.log('[DB] order item admin markers and edit log are ready')
} finally {
  await prisma.$disconnect()
}
