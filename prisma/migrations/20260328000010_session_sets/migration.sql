CREATE TABLE "session_sets" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "teamAScore" INTEGER NOT NULL,
    "teamBScore" INTEGER NOT NULL,
    CONSTRAINT "session_sets_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "session_sets" ADD CONSTRAINT "session_sets_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
