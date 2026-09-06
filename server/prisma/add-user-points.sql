ALTER TABLE "users" ADD COLUMN "pointsBalance" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "orders" ADD COLUMN "userPointsUsed" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS "user_point_transactions" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "userId" INTEGER NOT NULL,
  "amount" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "type" TEXT NOT NULL,
  "message" TEXT,
  "orderId" INTEGER,
  "batchId" TEXT,
  "createdById" INTEGER,
  "seenAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "user_point_transactions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "user_point_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "user_point_transactions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "user_point_transactions_userId_createdAt_idx" ON "user_point_transactions"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "user_point_transactions_userId_seenAt_idx" ON "user_point_transactions"("userId", "seenAt");
CREATE INDEX IF NOT EXISTS "user_point_transactions_batchId_idx" ON "user_point_transactions"("batchId");
