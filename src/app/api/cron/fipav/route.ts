import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cronAuthorized } from "@/lib/cronAuth"
import { syncFipav } from "@/lib/fipav/sync"

export const runtime = "nodejs"
export const maxDuration = 300

/**
 * Runs the FIPAV sync on demand (same secret as the crons). The daily run is
 * part of /api/cron/content; this is for a manual refresh.
 */
export async function GET(req: NextRequest) {
  if (!cronAuthorized(req.headers.get("authorization"))) {
    return new NextResponse("Unauthorized", { status: 401 })
  }
  return NextResponse.json(await syncFipav())
}
