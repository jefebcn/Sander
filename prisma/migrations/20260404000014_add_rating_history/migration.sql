-- CreateTable
CREATE TABLE "rating_history" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playerId" TEXT NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "rd" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,

    CONSTRAINT "rating_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "rating_history" ADD CONSTRAINT "rating_history_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "rating_history_playerId_createdAt_idx" ON "rating_history"("playerId", "createdAt");
