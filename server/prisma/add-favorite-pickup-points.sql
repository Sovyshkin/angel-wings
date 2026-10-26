CREATE TABLE IF NOT EXISTS "favorite_pickup_points" (
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
);

CREATE UNIQUE INDEX IF NOT EXISTS "favorite_pickup_points_userId_code_key" ON "favorite_pickup_points" ("userId", "code");
CREATE INDEX IF NOT EXISTS "favorite_pickup_points_userId_updatedAt_idx" ON "favorite_pickup_points" ("userId", "updatedAt");
