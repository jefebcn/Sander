-- Make playerId nullable
ALTER TABLE "session_participants" ALTER COLUMN "playerId" DROP NOT NULL;

-- Add guestName column
ALTER TABLE "session_participants" ADD COLUMN "guestName" TEXT;

-- Drop old unique index, replace with partial index (only when playerId is not null)
DROP INDEX IF EXISTS "session_participants_sessionId_playerId_key";
CREATE UNIQUE INDEX "session_participants_sessionId_playerId_key"
  ON "session_participants"("sessionId", "playerId")
  WHERE "playerId" IS NOT NULL;
