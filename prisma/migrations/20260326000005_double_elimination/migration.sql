-- Add DOUBLE_ELIMINATION tournament type
ALTER TYPE "TournamentType" ADD VALUE IF NOT EXISTS 'DOUBLE_ELIMINATION';

-- Add bracket metadata columns to matches
ALTER TABLE "matches"
  ADD COLUMN IF NOT EXISTS "bracketSection"   TEXT NOT NULL DEFAULT 'WB',
  ADD COLUMN IF NOT EXISTS "loserNextMatchId"  TEXT,
  ADD COLUMN IF NOT EXISTS "loserNextMatchSlot" INTEGER;
