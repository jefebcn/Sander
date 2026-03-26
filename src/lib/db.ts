import { PrismaClient } from "@/generated/prisma/client"

/**
 * Prisma client factory — auto-selects adapter based on DATABASE_URL.
 * Checks multiple env var names used by different Vercel/Neon integration methods.
 */
function createPrismaClient(): PrismaClient {
  const url =
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.POSTGRES_URL ??
    ""

  if (url.includes("neon.tech") || url.includes("neon.") || process.env.NEON_DB === "1") {
    // Neon serverless HTTP driver — no WebSocket needed, ideal for Vercel
    const { PrismaNeonHttp } = require("@prisma/adapter-neon")
    const adapter = new PrismaNeonHttp(url)
    return new PrismaClient({ adapter })
  }

  // Standard pg Pool — for local Docker/Supabase/self-hosted Postgres
  const { Pool } = require("pg")
  const { PrismaPg } = require("@prisma/adapter-pg")
  const pool = new Pool({ connectionString: url })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adapter = new PrismaPg(pool as any)
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
