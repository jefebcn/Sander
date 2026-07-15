import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getWeeklyRecap } from "@/actions/recap"
import { db } from "@/lib/db"
import { notifyPlayers } from "@/lib/push"

export const runtime = "nodejs"

/**
 * Weekly recap cron — scheduled Monday morning via vercel.json.
 *
 * Computes the weekly recap and pushes a notification to every player with a
 * linked account, deep-linking to /settimana. Vercel automatically attaches
 * `Authorization: Bearer $CRON_SECRET`; we verify it when the secret is set.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
  }

  const recap = await getWeeklyRecap()

  if (recap.activePlayers === 0) {
    return NextResponse.json({ ok: true, skipped: "no activity this week" })
  }

  const players = await db.player.findMany({
    where: { userId: { not: null } },
    select: { id: true },
  })

  const potw = recap.playerOfWeek
  await notifyPlayers(
    players.map((p) => p.id),
    {
      title: "🏐 Recap della settimana SANDER",
      body: potw
        ? `${potw.name} è il giocatore della settimana (+${potw.ratingDelta})! Guarda dove sei finito tu.`
        : `${recap.totalEvents} partite questa settimana. Guarda la classifica!`,
      url: "/settimana",
    },
  )

  return NextResponse.json({ ok: true, notified: players.length, playerOfWeek: potw?.name ?? null })
}
