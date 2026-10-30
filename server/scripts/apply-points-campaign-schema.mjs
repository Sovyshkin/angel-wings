import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

try {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS point_campaign_offers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      campaignKey TEXT NOT NULL,
      userId INTEGER NOT NULL,
      amount INTEGER NOT NULL DEFAULT 4000,
      claimedAt DATETIME,
      expiresAt DATETIME,
      expiredAt DATETIME,
      remainingPoints INTEGER NOT NULL DEFAULT 0,
      emailStatus TEXT NOT NULL DEFAULT 'PENDING',
      emailSentAt DATETIME,
      emailError TEXT,
      telegramStatus TEXT NOT NULL DEFAULT 'PENDING',
      telegramSentAt DATETIME,
      telegramError TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS point_campaign_offers_campaignKey_userId_key ON point_campaign_offers(campaignKey, userId)')
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS point_campaign_offers_claimedAt_expiresAt_remainingPoints_idx ON point_campaign_offers(claimedAt, expiresAt, remainingPoints)')
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS point_campaign_spends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      offerId INTEGER NOT NULL,
      orderId INTEGER NOT NULL,
      amount INTEGER NOT NULL,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (offerId) REFERENCES point_campaign_offers(id) ON DELETE CASCADE,
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
    )
  `)
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS point_campaign_spends_offerId_orderId_key ON point_campaign_spends(offerId, orderId)')
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS point_campaign_spends_orderId_idx ON point_campaign_spends(orderId)')
  console.log('Таблицы кампании баллов готовы')
} finally {
  await prisma.$disconnect()
}
