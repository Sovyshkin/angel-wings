import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

try {
  const columns = await prisma.$queryRawUnsafe("PRAGMA table_info('partners')")
  if (!columns.length) throw new Error('Таблица partners отсутствует')
  if (!columns.some(column => column.name === 'archivedAt')) {
    await prisma.$executeRawUnsafe('ALTER TABLE partners ADD COLUMN archivedAt DATETIME')
  }
  console.log('[DB] partner archive is ready')
} finally {
  await prisma.$disconnect()
}
