-- Apply once before deploying the email-linked Telegram Mini App backend.
ALTER TABLE "users" ADD COLUMN "telegramPhotoUrl" TEXT;
