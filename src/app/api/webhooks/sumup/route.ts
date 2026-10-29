import { NextResponse } from "next/server"
import { z } from "zod"
import { sumupConfigured } from "@/lib/sumup"
import { settleSumUpCheckout } from "@/lib/sumupCheckout"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const Body = z.object({ id: z.string().min(1).max(100) }).passthrough()

/**
 * SumUp posts here when a checkout's status changes. The body is only a hint
 * (anyone could post it): settleSumUpCheckout asks SumUp for the checkout and
 * grants nothing unless SumUp itself says it is ours and paid in full.
 */
export async function POST(req: Request) {
  if (!sumupConfigured()) return new NextResponse(null, { status: 503 })
  const parsed = Body.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return new NextResponse(null, { status: 400 })
  try {
    const result = await settleSumUpCheckout(parsed.data.id)
    return NextResponse.json({ ok: true, result })
  } catch (e) {
    console.error("[sumup webhook] settle failed", parsed.data.id, e)
    // A 5xx makes SumUp try again later.
    return new NextResponse(null, { status: 500 })
  }
}
