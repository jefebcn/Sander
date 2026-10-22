import { COMUNI } from "@/lib/comuni"

// The list only changes with a deploy: built once, cached by browsers for a day.
export const dynamic = "force-static"

export function GET() {
  return Response.json(COMUNI, { headers: { "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800" } })
}
