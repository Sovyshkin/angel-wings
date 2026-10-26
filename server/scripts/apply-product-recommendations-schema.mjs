import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Curated from the supplied catalog. These are merchandising associations,
// not claims that the products have equivalent effects or may be used together.
const recommendations = {
  'aod-9674': { product: ['sermorelin', 'peg-mgf'], cart: ['sermorelin', 'peg-mgf'] },
  'sermorelin': { product: ['peg-mgf', 'aod-9674'], cart: ['peg-mgf', 'aod-9674'] },
  'tripeptid-medi-bpts-197': { product: ['bpts-157', 'kpv', 'uni-balzam-dlya-regeneratsii'], cart: ['uni-balzam-dlya-regeneratsii', 'bpts-157', 'kpv'] },
  'uni-balzam-dlya-regeneratsii': { product: ['tripeptid-medi-bpts-197', 'bpts-157', 'sod-1-karnozin'], cart: ['tripeptid-medi-bpts-197', 'sod-1-karnozin', 'bpts-157'] },
  'peg-mgf': { product: ['sermorelin', 'aod-9674'], cart: ['sermorelin', 'aod-9674'] },
  // No compatible pen is in the supplied export; avoid implying that these needles fit unrelated products.
  'igly-dlya-shprits-ruchek-2': { product: [], cart: [] },
  'kpv': { product: ['bpts-157', 'bpts-kpv', 'bpts-tb-kpv'], cart: ['bpts-kpv', 'bpts-157', 'bpts-tb-kpv'] },
  'bpts-157': { product: ['bpts-kpv', 'tb-500', 'tripeptid-medi-bpts-197'], cart: ['bpts-kpv', 'tb-500', 'uni-balzam-dlya-regeneratsii'] },
  'tb-500': { product: ['bpts-157', 'bpts-tb-kpv', 'bpts-kpv'], cart: ['bpts-tb-kpv', 'bpts-157', 'bpts-kpv'] },
  'pns-27': { product: ['plazmidnyy-hgf', 'sod-1-karnozin', 'flagellin'], cart: ['sod-1-karnozin', 'plazmidnyy-hgf', 'flagellin'] },
  'pt-141-epitalon': { product: ['pt-141', 'gonadoreks', 'melanotan-2'], cart: ['pt-141', 'gonadoreks', 'melanotan-2'] },
  'melanotan-2': { product: ['pt-141', 'pt-141-epitalon', 'uni-balzam-dlya-regeneratsii'], cart: ['pt-141', 'uni-balzam-dlya-regeneratsii', 'pt-141-epitalon'] },
  'pt-141': { product: ['pt-141-epitalon', 'gonadoreks', 'melanotan-2'], cart: ['pt-141-epitalon', 'gonadoreks', 'melanotan-2'] },
  'gonadoreks': { product: ['pt-141', 'pt-141-epitalon', 'sermorelin'], cart: ['pt-141', 'pt-141-epitalon', 'sermorelin'] },
  'plazmidnyy-hgf': { product: ['sod-1-karnozin', 'pns-27', 'flagellin'], cart: ['sod-1-karnozin', 'pns-27', 'flagellin'] },
  'sod-1-karnozin': { product: ['glut', 'plazmidnyy-hgf', 'uni-balzam-dlya-regeneratsii'], cart: ['glut', 'uni-balzam-dlya-regeneratsii', 'plazmidnyy-hgf'] },
  'flagellin': { product: ['plazmidnyy-hgf', 'sod-1-karnozin', 'pns-27'], cart: ['sod-1-karnozin', 'plazmidnyy-hgf', 'pns-27'] },
  'glut': { product: ['sod-1-karnozin', 'uni-balzam-dlya-regeneratsii', 'plazmidnyy-hgf'], cart: ['sod-1-karnozin', 'uni-balzam-dlya-regeneratsii', 'plazmidnyy-hgf'] },
  'bpts-kpv': { product: ['bpts-157', 'kpv', 'bpts-tb-kpv'], cart: ['bpts-157', 'kpv', 'bpts-tb-kpv'] },
  'bpts-tb-kpv': { product: ['bpts-kpv', 'tb-500', 'bpts-157'], cart: ['bpts-kpv', 'tb-500', 'bpts-157'] }
}

try {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "product_recommendations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "sourceProductId" INTEGER NOT NULL,
    "targetProductId" INTEGER NOT NULL,
    "placement" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    CONSTRAINT "product_recommendations_sourceProductId_fkey" FOREIGN KEY ("sourceProductId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "product_recommendations_targetProductId_fkey" FOREIGN KEY ("targetProductId") REFERENCES "products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`)
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS product_recommendations_sourceProductId_targetProductId_placement_key ON product_recommendations(sourceProductId, targetProductId, placement)')
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS product_recommendations_sourceProductId_placement_position_idx ON product_recommendations(sourceProductId, placement, position)')
  await prisma.$executeRawUnsafe('CREATE TABLE IF NOT EXISTS product_recommendation_seed_state (key TEXT NOT NULL PRIMARY KEY)')

  const alreadySeeded = await prisma.$queryRawUnsafe("SELECT key FROM product_recommendation_seed_state WHERE key = 'catalog_2026_10'")
  if (!alreadySeeded.length) {
    const slugs = [...new Set(Object.entries(recommendations).flatMap(([source, lists]) => [source, ...lists.product, ...lists.cart]))]
    const products = await prisma.product.findMany({ where: { slug: { in: slugs } }, select: { id: true, slug: true } })
    const ids = new Map(products.map(product => [product.slug, product.id]))
    const rows = []
    for (const [sourceSlug, lists] of Object.entries(recommendations)) {
      const sourceProductId = ids.get(sourceSlug)
      if (!sourceProductId) continue
      for (const [placement, targetSlugs] of Object.entries(lists)) {
        targetSlugs.forEach((slug, position) => {
          const targetProductId = ids.get(slug)
          if (targetProductId && targetProductId !== sourceProductId) {
            rows.push({ sourceProductId, targetProductId, placement: placement.toUpperCase(), position })
          }
        })
      }
    }
    if (rows.length) {
      await prisma.$transaction(async tx => {
        for (const row of rows) {
          await tx.productRecommendation.upsert({
            where: { sourceProductId_targetProductId_placement: {
              sourceProductId: row.sourceProductId,
              targetProductId: row.targetProductId,
              placement: row.placement
            } },
            update: {},
            create: row
          })
        }
        await tx.$executeRawUnsafe("INSERT INTO product_recommendation_seed_state (key) VALUES ('catalog_2026_10')")
      })
      console.log(`[DB] Seeded ${rows.length} product and cart recommendations`)
    } else {
      console.log('[DB] Recommendation table ready; catalog products are not present yet, rerun after import')
    }
  } else {
    console.log('[DB] Product recommendations are ready')
  }
} finally {
  await prisma.$disconnect()
}
