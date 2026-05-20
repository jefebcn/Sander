ALTER TABLE "tournament_registrations" ADD COLUMN "isSpectator" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "tournaments" ADD COLUMN "spectatorPriceCents" INTEGER;
