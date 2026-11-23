import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
try {
  const fields = await db.$queryRawUnsafe('PRAGMA table_info("marketing_notices")')
  if (!fields.some(field => field.name === 'clickedAt')) await db.$executeRawUnsafe('ALTER TABLE "marketing_notices" ADD COLUMN "clickedAt" DATETIME')
  if (!fields.some(field => field.name === 'clickCount')) await db.$executeRawUnsafe('ALTER TABLE "marketing_notices" ADD COLUMN "clickCount" INTEGER NOT NULL DEFAULT 0')
  await db.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "marketing_notices_campaignId_clickedAt_idx" ON "marketing_notices"("campaignId", "clickedAt")')
  console.log('Campaign analytics schema is ready')
} finally { await db.$disconnect() }
