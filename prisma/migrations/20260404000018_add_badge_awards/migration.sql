-- CreateEnum
CREATE TYPE "BadgeType" AS ENUM (
  'MURO_IMPENETRABILE',
  'DIFESA_ACROBATICA',
  'LEADER_CARISMATICO',
  'SCHIACCIATA_POTENTE',
  'SERVIZIO_PRECISO',
  'SPIRITO_DI_SQUADRA',
  'MVP_PARTITA',
  'FAIR_PLAY'
);

-- CreateTable
CREATE TABLE "badge_awards" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "giverId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "badge" "BadgeType" NOT NULL,

    CONSTRAINT "badge_awards_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_sessionId_fkey"
  FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_giverId_fkey"
  FOREIGN KEY ("giverId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "badge_awards" ADD CONSTRAINT "badge_awards_receiverId_fkey"
  FOREIGN KEY ("receiverId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateUniqueIndex
CREATE UNIQUE INDEX "badge_awards_sessionId_giverId_receiverId_badge_key"
  ON "badge_awards"("sessionId", "giverId", "receiverId", "badge");
