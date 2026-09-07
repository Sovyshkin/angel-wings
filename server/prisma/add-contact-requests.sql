CREATE TABLE IF NOT EXISTS "contact_requests" (
  "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "goal" TEXT,
  "message" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "adminNote" TEXT,
  "handledById" INTEGER,
  "handledAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "contact_requests_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "contact_requests_status_createdAt_idx" ON "contact_requests"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "contact_requests_email_idx" ON "contact_requests"("email");
