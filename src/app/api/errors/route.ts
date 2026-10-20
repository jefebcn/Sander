import { NextResponse } from "next/server"
import { ClientErrorSchema } from "@/lib/validators/error.schema"
import { recordError } from "@/lib/errorLog"

export const runtime = "nodejs"

/** Browser errors from ErrorReporter and the error boundary. Same-site only. */
export async function POST(req: Request) {
  const origin = req.headers.get("origin")
  const host = req.headers.get("host")
  if (!origin || !host || new URL(origin).host !== host) {
    return new NextResponse(null, { status: 403 })
  }
  const body = await req.json().catch(() => null)
  const parsed = ClientErrorSchema.safeParse(body)
  if (!parsed.success) return new NextResponse(null, { status: 400 })
  await recordError({ source: "client", ...parsed.data, userAgent: req.headers.get("user-agent") })
  return new NextResponse(null, { status: 204 })
}
