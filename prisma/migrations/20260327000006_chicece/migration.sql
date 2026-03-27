-- Add CHICECE tournament type
ALTER TYPE "TournamentType" ADD VALUE IF NOT EXISTS 'CHICECE';

-- Add Chicece fields to tournaments
ALTER TABLE "tournaments" ADD COLUMN IF NOT EXISTS "chiceceMatchCount" INTEGER NOT NULL DEFAULT 4;
ALTER TABLE "tournaments" ADD COLUMN IF NOT EXISTS "chicecePhase" TEXT NOT NULL DEFAULT 'GROUP';

-- Add Chicece scoring fields to tournament_registrations
ALTER TABLE "tournament_registrations" ADD COLUMN IF NOT EXISTS "chicecePlusMinus" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "tournament_registrations" ADD COLUMN IF NOT EXISTS "chiceceMatchesPlayed" INTEGER NOT NULL DEFAULT 0;
