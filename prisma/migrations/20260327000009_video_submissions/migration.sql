CREATE TABLE IF NOT EXISTS "video_submissions" (
  "id"         TEXT NOT NULL,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "playerId"   TEXT NOT NULL,
  "blobUrl"    TEXT NOT NULL,
  "status"     TEXT NOT NULL DEFAULT 'PENDING',
  "note"       TEXT,
  "reviewedAt" TIMESTAMP(3),
  CONSTRAINT "video_submissions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "video_submissions_playerId_fkey"
    FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
