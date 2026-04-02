-- Add matchMode flag to sessions
ALTER TABLE "sessions" ADD COLUMN "matchMode" BOOLEAN NOT NULL DEFAULT false;

-- Create session_matches table
CREATE TABLE "session_matches" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "round" INTEGER NOT NULL,
    "matchNumber" INTEGER NOT NULL,
    "teamAScore" INTEGER,
    "teamBScore" INTEGER,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "session_matches_pkey" PRIMARY KEY ("id")
);

-- Create session_match_players table
CREATE TABLE "session_match_players" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "team" INTEGER NOT NULL,

    CONSTRAINT "session_match_players_pkey" PRIMARY KEY ("id")
);

-- Unique constraint: one player per match
ALTER TABLE "session_match_players" ADD CONSTRAINT "session_match_players_matchId_playerId_key" UNIQUE ("matchId", "playerId");

-- Foreign keys
ALTER TABLE "session_matches" ADD CONSTRAINT "session_matches_sessionId_fkey"
    FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "session_match_players" ADD CONSTRAINT "session_match_players_matchId_fkey"
    FOREIGN KEY ("matchId") REFERENCES "session_matches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "session_match_players" ADD CONSTRAINT "session_match_players_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
