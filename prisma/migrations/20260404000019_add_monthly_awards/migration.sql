-- CreateTable
CREATE TABLE "monthly_awards" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "playerId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,

    CONSTRAINT "monthly_awards_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "monthly_awards" ADD CONSTRAINT "monthly_awards_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateUniqueIndex
CREATE UNIQUE INDEX "monthly_awards_playerId_month_year_key" ON "monthly_awards"("playerId", "month", "year");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "monthly_awards_position_month_year_key" ON "monthly_awards"("position", "month", "year");
