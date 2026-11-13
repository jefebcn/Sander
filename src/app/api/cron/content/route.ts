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
import { confirmDueScores } from "@/lib/sessionScore"
import { tournamentReminders } from "@/lib/tournamentReminders"
import { sweepStaleSumUpSeats } from "@/actions/registration"
import { releaseExpiredShopHolds } from "@/lib/shopOrders"
import { plusPassReminders } from "@/lib/scopri/passReminder"
import { syncFipav } from "@/lib/fipav/sync"

export const runtime = "nodejs"
// The FIPAV copy (calendar, rankings, next week's details) adds up to a minute or two.
export const maxDuration = 300

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

  // Scores the other team left unanswered for 24 hours count from now (the
  // match page also confirms them when opened; this catches the rest).
  const scoresConfirmed = await confirmDueScores().catch((e) => {
    console.error("[cron] score confirmation sweep failed", e)
    return 0
  })

  // Tomorrow's tournaments: "domani si gioca" to every player, with the fee
  // to bring when it is paid at the court.
  const tournamentReminded = await tournamentReminders().catch((e) => {
    console.error("[cron] tournament reminders failed", e)
    return 0
  })

  // Card sign-ups abandoned on SumUp's page: free their seats (Stripe has an
  // expiry webhook, SumUp doesn't; sign-up pages also do this on the spot).
  const seatsFreed = await sweepStaleSumUpSeats(process.env.CRON_SECRET ?? "").catch((e) => {
    console.error("[cron] SumUp seat sweep failed", e)
    return 0
  })

  // SANDER+ by card is a 30-day pass with no renewal: a reminder before it ends.
  const passReminded = await plusPassReminders().catch((e) => {
    console.error("[cron] pass reminders failed", e)
    return 0
  })

  // Shop orders left unpaid on SumUp's page: their pieces go back on sale
  // (the shop pages also do this when someone buys).
  const shopHoldsFreed = await releaseExpiredShopHolds(50).catch((e) => {
    console.error("[cron] shop hold release failed", e)
    return 0
  })

  // FIPAV beach calendar and rankings (lib/fipav): after FIPAV regenerates its
  // files (about 05:00 UTC). Same cron, so the Vercel cron count stays the same.
  const fipav = await syncFipav().catch((e) => {
    console.error("[cron] FIPAV sync failed", e)
    return null
  })

  return NextResponse.json({ ok: true, created, nudged, staleCancelled, scopri, scoresConfirmed, tournamentReminded, seatsFreed, passReminded, shopHoldsFreed, fipav })
}
