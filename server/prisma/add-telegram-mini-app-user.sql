-- Apply before starting the server version with Telegram Mini App support.
ALTER TABLE "users" ADD COLUMN "telegramId" TEXT;
CREATE UNIQUE INDEX "users_telegramId_key" ON "users"("telegramId");
