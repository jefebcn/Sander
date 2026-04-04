-- AlterTable
ALTER TABLE "users" ADD COLUMN "invitedByPlayerId" TEXT;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_invitedByPlayerId_fkey" FOREIGN KEY ("invitedByPlayerId") REFERENCES "players"("id") ON DELETE SET NULL ON UPDATE CASCADE;
