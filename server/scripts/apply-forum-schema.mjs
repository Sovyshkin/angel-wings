import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
try {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "forum_pages" ("id" INTEGER NOT NULL PRIMARY KEY, "content" TEXT NOT NULL, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`)
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "forum_applications" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL, "phone" TEXT NOT NULL DEFAULT '', "email" TEXT NOT NULL DEFAULT '', "company" TEXT NOT NULL DEFAULT '', "position" TEXT NOT NULL DEFAULT '', "message" TEXT NOT NULL DEFAULT '', "consentAt" DATETIME, "status" TEXT NOT NULL DEFAULT 'NEW', "adminNote" TEXT NOT NULL DEFAULT '', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`)
  const columns = await prisma.$queryRawUnsafe('PRAGMA table_info("forum_applications")')
  if (!columns.some(column => column.name === 'position')) await prisma.$executeRawUnsafe(`ALTER TABLE "forum_applications" ADD COLUMN "position" TEXT NOT NULL DEFAULT ''`)
  if (!columns.some(column => column.name === 'consentAt')) await prisma.$executeRawUnsafe(`ALTER TABLE "forum_applications" ADD COLUMN "consentAt" DATETIME`)
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS forum_applications_status_createdAt_idx ON forum_applications(status, createdAt)')
  console.log('[DB] Forum schema is ready')
} finally { await prisma.$disconnect() }
