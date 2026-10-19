import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * Liveness check plus the database round trip as seen from the function.
 * A few ms means the function runs next to the database; ~90 ms means they
 * are on different continents and every query pays for it. The database is
 * in Frankfurt, hence `"regions": ["fra1"]` in vercel.json (from iad1 every
 * query took 93 ms).
 */
export async function GET() {
  const roundTrips: number[] = []
  try {
    for (let i = 0; i < 3; i++) {
      const t = performance.now()
      await db.$queryRaw`SELECT 1`
      roundTrips.push(Math.round(performance.now() - t))
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 503, headers: { "Cache-Control": "no-store" } })
  }
  return NextResponse.json(
    { ok: true, region: process.env.VERCEL_REGION ?? "local", dbMs: roundTrips },
    { headers: { "Cache-Control": "no-store" } },
  )
}
