export const MAX_FAVORITE_PICKUPS = 10

export async function ensureFavoritePickupPointsTable(prisma) {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "favorite_pickup_points" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "cityCode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT '',
    "countryCode" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "favorite_pickup_points_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
  )`)
  await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "favorite_pickup_points_userId_code_key" ON "favorite_pickup_points" ("userId", "code")')
  await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "favorite_pickup_points_userId_updatedAt_idx" ON "favorite_pickup_points" ("userId", "updatedAt")')
}

export function favoritePickupFromCdek(point) {
  if (!point?.code) return null
  const cityCode = point.location?.city_code ?? point.location?.cityCode ?? point.city_code ?? point.cityCode
  if (!cityCode || !point.location?.city) return null
  return {
    code: String(point.code).slice(0, 40),
    name: String(point.name || point.code).slice(0, 100),
    address: String(point.location.address_full || point.location.address || '').slice(0, 200),
    city: String(point.location.city).slice(0, 100),
    cityCode: String(cityCode).slice(0, 30),
    country: String(point.location.country || '').slice(0, 80),
    countryCode: String(point.location.country_code || '').slice(0, 10)
  }
}
