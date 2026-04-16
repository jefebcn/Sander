-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('FREE', 'PENDING', 'PAID', 'FAILED', 'REFUNDED', 'CANCELLED');

-- AlterTable Tournament: add registration & payment fields
ALTER TABLE "tournaments"
  ADD COLUMN "location"              TEXT,
  ADD COLUMN "description"           TEXT,
  ADD COLUMN "registrationDeadline"  TIMESTAMP(3),
  ADD COLUMN "prizePool"             TEXT,
  ADD COLUMN "priceCents"            INTEGER,
  ADD COLUMN "priceCurrency"         TEXT NOT NULL DEFAULT 'EUR',
  ADD COLUMN "isOpenForRegistration" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable TournamentRegistration: add payment tracking
ALTER TABLE "tournament_registrations"
  ADD COLUMN "paymentStatus"         "PaymentStatus" NOT NULL DEFAULT 'FREE',
  ADD COLUMN "paymentMethod"         TEXT,
  ADD COLUMN "paidAt"                TIMESTAMP(3),
  ADD COLUMN "amountPaidCents"       INTEGER,
  ADD COLUMN "stripeSessionId"       TEXT,
  ADD COLUMN "stripePaymentIntentId" TEXT,
  ADD COLUMN "adminNotes"            TEXT;

-- Backfill: all existing registrations are pre-payment system
UPDATE "tournament_registrations"
  SET "paymentStatus" = 'FREE', "paymentMethod" = 'FREE'
  WHERE "paymentMethod" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "tournament_registrations_stripeSessionId_key"
  ON "tournament_registrations"("stripeSessionId");
CREATE UNIQUE INDEX "tournament_registrations_stripePaymentIntentId_key"
  ON "tournament_registrations"("stripePaymentIntentId");
CREATE INDEX "tournament_registrations_tournamentId_paymentStatus_idx"
  ON "tournament_registrations"("tournamentId", "paymentStatus");

-- CreateTable StripeWebhookEvent (idempotency)
CREATE TABLE "stripe_webhook_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "payload" JSONB NOT NULL,

    CONSTRAINT "stripe_webhook_events_pkey" PRIMARY KEY ("id")
);
