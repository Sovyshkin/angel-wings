import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
try {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "product_price_changes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "productId" INTEGER NOT NULL,
    "before" TEXT NOT NULL,
    "after" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "product_price_changes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`)
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "product_price_changes_productId_createdAt_idx" ON "product_price_changes"("productId", "createdAt")')
  console.log('Product price history schema is ready')
} finally {
  await prisma.$disconnect()
}
