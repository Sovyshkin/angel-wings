CREATE TABLE IF NOT EXISTS "dealers" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "city" TEXT NOT NULL,
  "phone" TEXT,
  "address" TEXT,
  "telegram" TEXT,
  "instagram" TEXT,
  "max" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "dealers_isActive_city_idx" ON "dealers"("isActive", "city");
