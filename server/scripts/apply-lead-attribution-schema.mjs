import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()
try {
  for (const table of ['orders', 'partner_applications', 'contact_requests', 'consultation_requests']) {
    const columns = await db.$queryRawUnsafe(`PRAGMA table_info("${table}")`)
    if (!columns.length) throw new Error(`Таблица ${table} отсутствует`)
    const attributionColumns = table === 'orders' ? [] : ['utmSource', 'utmMedium', 'utmCampaign']
    for (const column of [...attributionColumns, 'directCampaignId', 'directGroupId', 'directAdId', 'directPhraseId', 'yclid']) {
      if (!columns.some(field => field.name === column)) {
        await db.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN "${column}" TEXT`)
      }
    }
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "${table}_directAdId_createdAt_idx" ON "${table}"("directAdId", "createdAt")`)
  }
  console.log('Lead attribution schema is ready')
} finally {
  await db.$disconnect()
}
