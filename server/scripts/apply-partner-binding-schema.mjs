import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

try {
  const columns = await prisma.$queryRawUnsafe("PRAGMA table_info('users')")
  if (!columns.length) throw new Error('Таблица users отсутствует')
  if (!columns.some(column => column.name === 'partnerBindingDisabled')) {
    await prisma.$executeRawUnsafe('ALTER TABLE users ADD COLUMN partnerBindingDisabled BOOLEAN NOT NULL DEFAULT 0')
  }
  console.log('[DB] partner binding preference is ready')
} finally {
  await prisma.$disconnect()
}
