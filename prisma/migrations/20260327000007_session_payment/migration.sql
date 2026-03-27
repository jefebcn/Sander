-- Add payment fields to sessions
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "paymentType" TEXT NOT NULL DEFAULT 'FREE';
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "quotaAmount" INTEGER;
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "loserPays" TEXT;
