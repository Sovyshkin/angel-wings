import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

try {
  const campaignColumns = await prisma.$queryRawUnsafe("PRAGMA table_info('email_campaigns')")
  if (!campaignColumns.length) throw new Error('Таблица email_campaigns отсутствует')
  if (!campaignColumns.some(column => column.name === 'settingsJson')) {
    await prisma.$executeRawUnsafe('ALTER TABLE "email_campaigns" ADD COLUMN "settingsJson" TEXT')
  }
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "marketing_notices" (
      "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
      "campaignId" INTEGER NOT NULL,
      "userId" INTEGER NOT NULL,
      "title" TEXT NOT NULL,
      "body" TEXT NOT NULL,
      "buttonText" TEXT NOT NULL,
      "buttonUrl" TEXT NOT NULL,
      "imageUrl" TEXT,
      "siteEnabled" BOOLEAN NOT NULL DEFAULT false,
      "seenAt" DATETIME,
      "emailStatus" TEXT NOT NULL DEFAULT 'SKIPPED',
      "emailError" TEXT,
      "emailSentAt" DATETIME,
      "telegramStatus" TEXT NOT NULL DEFAULT 'SKIPPED',
      "telegramError" TEXT,
      "telegramSentAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("campaignId") REFERENCES "email_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "marketing_notices_campaignId_userId_key" ON "marketing_notices"("campaignId", "userId")')
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "marketing_notices_userId_siteEnabled_seenAt_createdAt_idx" ON "marketing_notices"("userId", "siteEnabled", "seenAt", "createdAt")')
  console.log('[DB] marketing notices are ready')
} finally {
  await prisma.$disconnect()
}
