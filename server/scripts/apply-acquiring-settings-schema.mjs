import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

try {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "acquiring_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY,
    "sbpPercent" REAL NOT NULL DEFAULT 0.4,
    "cardPercent" REAL NOT NULL DEFAULT 2.5,
    "fallbackPercent" REAL NOT NULL DEFAULT 2.7,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)
  console.log('[DB] acquiring_settings is ready')
} finally {
  await prisma.$disconnect()
}
