import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { cronAuthorized } from "@/lib/cronAuth"
import { generateContent } from "@/lib/content/generate"
import { db } from "@/lib/db"
import { notifyPlayer } from "@/lib/push"
import { isAdminEmail } from "@/lib/isAdmin"
import { nudgeSweep } from "@/lib/nudges"
import { cancelStaleSessions } from "@/lib/sessionRefunds"
import { scopriMorning } from "@/lib/scopri/digest"

export const runtime = "nodejs"

/**
 * Daily content cron (scheduled via vercel.json). Generates ready-to-post
 * social content and pings the admin(s) so they can publish in one tap.
 */
export async function GET(req: NextRequest) {
  if (!cronAuthorized(req.headers.get("authorization"))) {
    return new NextResponse("Unauthorized", { status: 401 })
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

  // Same morning run: today's and tomorrow's matches still missing players.
  // Kept in this cron instead of a new one so the Vercel cron count is unchanged.
  const nudged = await nudgeSweep().catch(() => 0)

  // Matches nobody closed a week after their date: cancel and refund credits,
  // so lists don't fill up with dead "Aperta" matches.
  const staleCancelled = await cancelStaleSessions().catch((e) => {
    console.error("[cron] stale session sweep failed", e)
    return 0
  })

  // Scopri morning: today's pairing and picks, "tocca a te", pair challenges,
  // newcomers / invites. Same cron, so the Vercel cron count stays the same.
  const scopri = await scopriMorning().catch((e) => {
    console.error("[cron] scopri morning failed", e)
    return null
  })

  return NextResponse.json({ ok: true, created, nudged, staleCancelled, scopri })
}
