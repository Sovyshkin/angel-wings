import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

try {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "blog_categories" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS blog_categories_slug_key ON blog_categories(slug)')
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "blog_posts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL DEFAULT '',
    "slug" TEXT NOT NULL,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "cover" TEXT,
    "coverAlt" TEXT NOT NULL DEFAULT '',
    "author" TEXT NOT NULL DEFAULT 'ANGEL WINGS',
    "categoryId" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "metaTitle" TEXT NOT NULL DEFAULT '',
    "metaDescription" TEXT NOT NULL DEFAULT '',
    "readingMinutes" INTEGER NOT NULL DEFAULT 1,
    "publishedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blog_posts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "blog_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE
  )`)
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_key ON blog_posts(slug)')
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS blog_posts_status_publishedAt_idx ON blog_posts(status, publishedAt)')
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS blog_posts_categoryId_status_idx ON blog_posts(categoryId, status)')
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "blog_post_categories" (
    "postId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    PRIMARY KEY ("postId", "categoryId"),
    CONSTRAINT "blog_post_categories_postId_fkey" FOREIGN KEY ("postId") REFERENCES "blog_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blog_post_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "blog_categories"("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`)
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS blog_post_categories_categoryId_postId_idx ON blog_post_categories(categoryId, postId)')
  await prisma.$executeRawUnsafe('INSERT OR IGNORE INTO blog_post_categories (postId, categoryId) SELECT id, categoryId FROM blog_posts WHERE categoryId IS NOT NULL')
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "blog_subscribers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "confirmationTokenHash" TEXT,
    "confirmationExpiresAt" DATETIME,
    "confirmedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`)
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS blog_subscribers_email_key ON blog_subscribers(email)')
  const subscriberColumns = await prisma.$queryRawUnsafe('PRAGMA table_info(blog_subscribers)')
  for (const [column, sql] of [
    ['confirmationTokenHash', 'ALTER TABLE blog_subscribers ADD COLUMN confirmationTokenHash TEXT'],
    ['confirmationExpiresAt', 'ALTER TABLE blog_subscribers ADD COLUMN confirmationExpiresAt DATETIME'],
    ['confirmedAt', 'ALTER TABLE blog_subscribers ADD COLUMN confirmedAt DATETIME']
  ]) {
    if (!subscriberColumns.some(item => item.name === column)) await prisma.$executeRawUnsafe(sql)
  }
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS blog_subscribers_confirmationTokenHash_key ON blog_subscribers(confirmationTokenHash)')
  for (const [position, name, slug] of [
    [0, 'Пептиды', 'peptidy'], [1, 'Здоровье', 'zdorove'], [2, 'Восстановление', 'vosstanovlenie'],
    [3, 'Исследования', 'issledovaniya'], [4, 'Советы', 'sovety']
  ]) {
    await prisma.blogCategory.upsert({ where: { slug }, create: { name, slug, position }, update: {} })
  }
  console.log('[DB] Blog schema is ready')
} finally {
  await prisma.$disconnect()
}
