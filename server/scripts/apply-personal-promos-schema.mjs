import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

try {
  const columns = await prisma.$queryRawUnsafe("PRAGMA table_info('promo_codes')")
  if (!columns.length) throw new Error('Таблица promo_codes отсутствует')
  const existing = new Set(columns.map(column => column.name))
  for (const [name, type] of [
    ['recipientUserId', 'INTEGER'],
    ['analyticsActionKey', 'TEXT'],
    ['notificationSeenAt', 'DATETIME'],
    ['emailSentAt', 'DATETIME'],
    ['emailError', 'TEXT']
  ]) {
    if (!existing.has(name)) await prisma.$executeRawUnsafe(`ALTER TABLE promo_codes ADD COLUMN ${name} ${type}`)
  }
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS promo_codes_analyticsActionKey_key ON promo_codes(analyticsActionKey)')
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS promo_codes_recipientUserId_notificationSeenAt_idx ON promo_codes(recipientUserId, notificationSeenAt)')
  console.log('[DB] персональные промокоды готовы')
} finally {
  await prisma.$disconnect()
}
