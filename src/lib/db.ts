import { PrismaClient } from "@/generated/prisma/client"

/**
 * Prisma client using pg.Pool (supports transactions).
 * PrismaNeonHttp was removed — it doesn't support db.$transaction() or
 * nested creates (which Prisma wraps in implicit transactions).
 *
 * Priority order for connection URL:
 *  1. POSTGRES_URL_NON_POOLING — Neon direct connection (full SQL features)
 *  2. DATABASE_URL             — standard pooled connection
 *  3. POSTGRES_PRISMA_URL      — Vercel Neon integration pooled URL
 *  4. POSTGRES_URL             — fallback
 */
function createPrismaClient(): PrismaClient {
  const url =
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    process.env.POSTGRES_URL ??
    ""

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { Pool } = require("pg")
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaPg } = require("@prisma/adapter-pg")
  const pool = new Pool({ connectionString: url, max: 5 })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
