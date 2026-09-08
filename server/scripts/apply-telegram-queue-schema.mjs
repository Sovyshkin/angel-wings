import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

try {
  const ordersTable = await prisma.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'orders'"
  )
  if (!ordersTable.length) {
    throw new Error('Таблица orders отсутствует')
  }

  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "telegram_notifications" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "orderId" INTEGER NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'PENDING',
      "attempts" INTEGER NOT NULL DEFAULT 0,
      "maxAttempts" INTEGER NOT NULL DEFAULT 12,
      "nextAttemptAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "processingAt" DATETIME,
      "sentAt" DATETIME,
      "telegramMessageId" INTEGER,
      "lastError" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "telegram_notifications_orderId_fkey"
        FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe(
    'CREATE UNIQUE INDEX IF NOT EXISTS "telegram_notifications_orderId_key" ON "telegram_notifications"("orderId")'
  )
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS "telegram_notifications_status_nextAttemptAt_idx" ON "telegram_notifications"("status", "nextAttemptAt")'
  )
  console.log('[DB] telegram notification queue schema is ready')
} finally {
  await prisma.$disconnect()
}
