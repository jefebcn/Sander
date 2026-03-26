-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('OPEN', 'FULL', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SessionFormat" AS ENUM ('TWO_VS_TWO', 'THREE_VS_THREE', 'FOUR_VS_FOUR');

-- CreateEnum
CREATE TYPE "RatingType" AS ENUM ('SUPER', 'TOP', 'FLOP');

-- CreateTable: NextAuth User
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable: NextAuth Account
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable: NextAuth Session
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: NextAuth VerificationToken
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- AlterTable: Player new fields
ALTER TABLE "players"
    ADD COLUMN "userId" TEXT,
    ADD COLUMN "level" INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN "xp" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "superVotes" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "topVotes" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "flopVotes" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "avgRating" INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN "sessionsPlayed" INTEGER NOT NULL DEFAULT 0;

-- CreateTable: Session
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizerId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "format" "SessionFormat" NOT NULL DEFAULT 'TWO_VS_TWO',
    "maxPlayers" INTEGER NOT NULL,
    "courtCost" INTEGER,
    "notes" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'OPEN',
    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable: SessionParticipant
CREATE TABLE "session_participants" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "team" INTEGER,
    CONSTRAINT "session_participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PlayerRating
CREATE TABLE "player_ratings" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "ratedId" TEXT NOT NULL,
    "type" "RatingType" NOT NULL,
    CONSTRAINT "player_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");
CREATE UNIQUE INDEX "auth_sessions_sessionToken_key" ON "auth_sessions"("sessionToken");
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");
CREATE UNIQUE INDEX "players_userId_key" ON "players"("userId");
CREATE UNIQUE INDEX "session_participants_sessionId_playerId_key" ON "session_participants"("sessionId", "playerId");
CREATE UNIQUE INDEX "player_ratings_sessionId_raterId_ratedId_key" ON "player_ratings"("sessionId", "raterId", "ratedId");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "players" ADD CONSTRAINT "players_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "players"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "session_participants" ADD CONSTRAINT "session_participants_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_ratings" ADD CONSTRAINT "player_ratings_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_ratings" ADD CONSTRAINT "player_ratings_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "player_ratings" ADD CONSTRAINT "player_ratings_ratedId_fkey" FOREIGN KEY ("ratedId") REFERENCES "players"("id") ON DELETE CASCADE ON UPDATE CASCADE;
