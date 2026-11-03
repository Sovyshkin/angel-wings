import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
try {
  const columns = await prisma.$queryRawUnsafe('PRAGMA table_info("users")')
  if (!columns.some(column => column.name === 'telegramPhotoUrl')) {
    await prisma.$executeRawUnsafe('ALTER TABLE "users" ADD COLUMN "telegramPhotoUrl" TEXT')
  }
  console.log('Поле аватара Telegram готово')
} finally {
  await prisma.$disconnect()
}
