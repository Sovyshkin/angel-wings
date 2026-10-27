import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
try {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "admin_roles" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "permissions" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS admin_roles_code_key ON admin_roles(code)')
  console.log('[DB] Admin roles schema is ready')
} finally {
  await prisma.$disconnect()
}
