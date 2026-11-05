import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
try {
  await db.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS points_campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      settingsJson TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      createdById INTEGER,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)
  console.log('Таблица настраиваемых кампаний готова')
} finally {
  await db.$disconnect()
}
