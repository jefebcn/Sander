-- AlterTable: add cover image and display metadata to tournaments
ALTER TABLE "tournaments" ADD COLUMN "coverUrl"   TEXT;
ALTER TABLE "tournaments" ADD COLUMN "skillLevel" TEXT;
ALTER TABLE "tournaments" ADD COLUMN "gender"     TEXT;
ALTER TABLE "tournaments" ADD COLUMN "maxTeams"   INTEGER;
