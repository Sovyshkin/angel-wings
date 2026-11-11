import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { createGiveawayTicketId, GIVEAWAY_MARKER, normalizeGiveawayPhone } from '../src/utils/giveawayTicket.js'
const prisma = new PrismaClient()
try {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "forum_pages" ("id" INTEGER NOT NULL PRIMARY KEY, "content" TEXT NOT NULL, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`)
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "forum_applications" ("id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, "name" TEXT NOT NULL, "phone" TEXT NOT NULL DEFAULT '', "email" TEXT NOT NULL DEFAULT '', "company" TEXT NOT NULL DEFAULT '', "position" TEXT NOT NULL DEFAULT '', "message" TEXT NOT NULL DEFAULT '', "consentAt" DATETIME, "status" TEXT NOT NULL DEFAULT 'NEW', "adminNote" TEXT NOT NULL DEFAULT '', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP)`)
  const columns = await prisma.$queryRawUnsafe('PRAGMA table_info("forum_applications")')
  if (!columns.some(column => column.name === 'position')) await prisma.$executeRawUnsafe(`ALTER TABLE "forum_applications" ADD COLUMN "position" TEXT NOT NULL DEFAULT ''`)
  if (!columns.some(column => column.name === 'consentAt')) await prisma.$executeRawUnsafe(`ALTER TABLE "forum_applications" ADD COLUMN "consentAt" DATETIME`)
  for (const column of ['ticketId', 'giveawayEmail', 'giveawayPhone']) {
    if (!columns.some(existing => existing.name === column)) await prisma.$executeRawUnsafe(`ALTER TABLE "forum_applications" ADD COLUMN "${column}" TEXT`)
    await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "forum_applications_${column}_key" ON "forum_applications"("${column}")`)
  }
  for (const column of ['ticketEmailSentAt', 'ticketEmailLastAttemptAt', 'ticketEmailError']) {
    if (!columns.some(existing => existing.name === column)) await prisma.$executeRawUnsafe(`ALTER TABLE "forum_applications" ADD COLUMN "${column}" ${column === 'ticketEmailError' ? 'TEXT' : 'DATETIME'}`)
  }
  if (!columns.some(existing => existing.name === 'ticketEmailAttempts')) await prisma.$executeRawUnsafe('ALTER TABLE "forum_applications" ADD COLUMN "ticketEmailAttempts" INTEGER NOT NULL DEFAULT 0')
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "forum_browser_tickets" ("browserId" TEXT NOT NULL PRIMARY KEY, "applicationId" INTEGER NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY ("applicationId") REFERENCES "forum_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE)`)
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS forum_browser_tickets_applicationId_idx ON forum_browser_tickets(applicationId)')
  const previousEntries = await prisma.$queryRawUnsafe('SELECT id, email, phone, ticketId, giveawayEmail, giveawayPhone FROM forum_applications WHERE message LIKE ? ORDER BY id ASC', `${GIVEAWAY_MARKER}%`)
  for (const entry of previousEntries) {
    if (entry.ticketId && entry.giveawayEmail && entry.giveawayPhone) continue
    const email = String(entry.email || '').trim().toLowerCase()
    const phone = normalizeGiveawayPhone(entry.phone)
    if (!email || !phone) continue
    try {
      await prisma.$executeRawUnsafe('UPDATE forum_applications SET ticketId = ?, giveawayEmail = ?, giveawayPhone = ? WHERE id = ?', entry.ticketId || createGiveawayTicketId(), email, phone, entry.id)
    } catch (error) {
      if (!String(error.message).includes('UNIQUE constraint failed')) throw error
    }
  }
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS forum_applications_status_createdAt_idx ON forum_applications(status, createdAt)')
  console.log('[DB] Forum schema is ready')
} finally { await prisma.$disconnect() }
