import dotenv from 'dotenv'
import { PrismaClient } from '@prisma/client'

dotenv.config()
const prisma = new PrismaClient()

try {
  const table = await prisma.$queryRawUnsafe(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'recovery_email_logs'"
  )
  if (!table.length) {
    throw new Error('Таблица recovery_email_logs отсутствует. Сначала примените prisma/add-recovery-reminders.sql')
  }

  const columns = await prisma.$queryRawUnsafe("PRAGMA table_info('recovery_email_logs')")
  const names = new Set(columns.map(column => column.name))
  if (!names.has('scheduledFor')) {
    await prisma.$executeRawUnsafe('ALTER TABLE recovery_email_logs ADD COLUMN scheduledFor DATETIME')
    console.log('[DB] added recovery_email_logs.scheduledFor')
  }
  if (!names.has('processingAt')) {
    await prisma.$executeRawUnsafe('ALTER TABLE recovery_email_logs ADD COLUMN processingAt DATETIME')
    console.log('[DB] added recovery_email_logs.processingAt')
  }
  await prisma.$executeRawUnsafe(
    'CREATE INDEX IF NOT EXISTS recovery_email_logs_status_scheduledFor_idx ON recovery_email_logs(status, scheduledFor)'
  )
  console.log('[DB] recovery worker schema is ready')
} finally {
  await prisma.$disconnect()
}
