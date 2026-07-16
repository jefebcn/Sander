import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { generateContent } from "@/actions/content"
import { db } from "@/lib/db"
import { notifyPlayer } from "@/lib/push"
import { isAdminEmail } from "@/lib/isAdmin"

export const runtime = "nodejs"

/**
 * Daily content cron (scheduled via vercel.json). Generates ready-to-post
 * social content and pings the admin(s) so they can publish in one tap.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) return new NextResponse("Unauthorized", { status: 401 })
  }

  const created = await generateContent()

  if (created > 0) {
    // Notify every admin player (linked account whose email is an admin email)
    const linked = await db.player.findMany({
      where: { userId: { not: null } },
      select: { id: true, user: { select: { email: true } } },
    })
    const admins = linked.filter((p) => isAdminEmail(p.user?.email))
    await Promise.allSettled(
      admins.map((a) =>
        notifyPlayer(a.id, {
          title: "📣 Nuovo contenuto pronto",
          body: `${created} post pronti da pubblicare su TikTok/Instagram. Un tap e via.`,
          url: "/profile?tab=admin",
        }),
      ),
    )
  }

  return NextResponse.json({ ok: true, created })
}
