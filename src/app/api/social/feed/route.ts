import { NextResponse } from "next/server"
import { socialFeed } from "@/lib/social/feed"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/social/feed — public, read-only data for the Instagram kit
 * (scripts/content-instagram): upcoming tournaments, open matches of the next
 * days and the FIPAV calendar. Nothing here is not already on public pages.
 */
export async function GET() {
  const feed = await socialFeed()
  return NextResponse.json(feed, { headers: { "cache-control": "public, max-age=300, s-maxage=300" } })
}
