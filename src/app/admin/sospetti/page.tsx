export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeft } from "lucide-react"
import { db } from "@/lib/db"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { formatDate } from "@/lib/utils"
import { SAME_OPPONENT_WEEKLY_CAP, suspicion, type SuspicionSignals } from "@/lib/rankingGuard"
import { ExcludeButton, VoidSessionButton } from "@/components/admin/FairPlayButtons"

const DAY = 86_400_000

/**
 * Fair play: players whose results look farmed (same opponents over the weekly
 * cap, wins against new accounts, disputed scores, sudden rating jumps), with
 * the tools to void a match or leave a player out of the leaderboards.
 */
export default async function AdminSuspectsPage() {
  const session = await getCurrentSession()
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/admin/sospetti")
  if (!isAdminEmail(session.user.email)) redirect("/admin/accesso")

  const now = Date.now()
  const since30 = new Date(now - 30 * DAY)
  const since7 = new Date(now - 7 * DAY)

  const [flags, disputes, recentHistory, excludedPlayers] = await Promise.all([
    db.ratingFlag.groupBy({ by: ["playerId", "kind"], where: { createdAt: { gte: since30 } }, _count: { _all: true } }),
    db.session.groupBy({ by: ["scoreSubmittedById"], where: { scoreDisputedAt: { gte: since30 }, scoreSubmittedById: { not: null } }, _count: { _all: true } }),
    db.ratingHistory.findMany({ where: { createdAt: { gte: since7 } }, orderBy: { createdAt: "asc" }, select: { playerId: true, rating: true } }),
    db.player.findMany({ where: { rankingExcluded: true }, select: { id: true } }),
  ])

  // Rating gained this week: last value now against the last value before the week.
  const lastInWeek = new Map<string, number>()
  for (const r of recentHistory) lastInWeek.set(r.playerId, r.rating)
  const baselines = lastInWeek.size
    ? await db.ratingHistory.findMany({
        where: { playerId: { in: [...lastInWeek.keys()] }, createdAt: { lt: since7 } },
        orderBy: { createdAt: "desc" },
        distinct: ["playerId"],
        select: { playerId: true, rating: true },
      })
    : []
  const baseline = new Map(baselines.map((b) => [b.playerId, b.rating]))
  // No history before the week (new player): the rating before their first counted game of the week.
  const firstGames = lastInWeek.size
    ? await db.sessionResult.findMany({
        where: { playerId: { in: [...lastInWeek.keys()] }, createdAt: { gte: since7 }, ratingBefore: { not: null } },
        orderBy: { createdAt: "asc" },
        distinct: ["playerId"],
        select: { playerId: true, ratingBefore: true },
      })
    : []
  for (const g of firstGames) if (!baseline.has(g.playerId) && g.ratingBefore != null) baseline.set(g.playerId, g.ratingBefore)
  const firstInWeek = new Map<string, number>()
  for (const r of recentHistory) if (!firstInWeek.has(r.playerId)) firstInWeek.set(r.playerId, r.rating)

  const signals = new Map<string, SuspicionSignals>()
  const get = (id: string) => {
    if (!signals.has(id)) signals.set(id, { sameOpponents: 0, newOpponentWins: 0, guestOnly: 0, disputed: 0, ratingGain7d: 0 })
    return signals.get(id)!
  }
  for (const f of flags) {
    const s = get(f.playerId)
    if (f.kind === "SAME_OPPONENTS") s.sameOpponents += f._count._all
    else if (f.kind === "NEW_OPPONENTS") s.newOpponentWins += f._count._all
    else if (f.kind === "GUESTS") s.guestOnly += f._count._all
  }
  for (const d of disputes) if (d.scoreSubmittedById) get(d.scoreSubmittedById).disputed += d._count._all
  for (const [id, last] of lastInWeek) {
    const gain = last - (baseline.get(id) ?? firstInWeek.get(id) ?? last)
    if (gain > 0) get(id).ratingGain7d = gain
  }

  const scored = [...signals.entries()]
    .map(([id, s]) => ({ id, ...suspicion(s) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 30)
  const ids = [...new Set([...scored.map((x) => x.id), ...excludedPlayers.map((p) => p.id)])]
  const [players, results] = await Promise.all([
    db.player.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, glickoRating: true, matchesWon: true, matchesLost: true, rankingExcluded: true, createdAt: true } }),
    db.sessionResult.findMany({
      where: { playerId: { in: ids } },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { playerId: true, won: true, lost: true, ratingBefore: true, ratingAfter: true, session: { select: { id: true, title: true, date: true, voidedAt: true } } },
    }),
  ])
  const byId = new Map(players.map((p) => [p.id, p]))
  const rows = [
    ...scored,
    ...excludedPlayers.filter((p) => !scored.some((x) => x.id === p.id)).map((p) => ({ id: p.id, score: 0, reasons: ["Escluso dalle classifiche"] })),
  ]

  return (
    <div className="min-h-dvh pb-10">
      <div className="flex items-center gap-3 px-4 pb-3" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}>
        <Link href="/admin" aria-label="Indietro" className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-2)] text-white active:bg-[var(--surface-3)]">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-black text-white">Fair play</h1>
      </div>
      <div className="flex flex-col gap-4 px-4">
        <p className="text-base text-[var(--muted-text)]">
          Le regole automatiche bloccano già i trucchi più comuni: partite contro soli ospiti, più di {SAME_OPPONENT_WEEKLY_CAP} partite a settimana contro le stesse persone, account nuovi che fanno salire gli altri. Qui trovi chi ci prova lo stesso, negli ultimi 30 giorni.
        </p>
        {rows.length === 0 && <p className="rounded-2xl bg-[var(--surface-1)] p-4 text-base text-white">Nessun giocatore sospetto. 👌</p>}
        {rows.map((r) => {
          const p = byId.get(r.id)
          if (!p) return null
          const mine = results.filter((x) => x.playerId === r.id).slice(0, 8)
          return (
            <section key={r.id} className="flex flex-col gap-3 rounded-2xl bg-[var(--surface-1)] p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/players/${p.id}`} className="text-lg font-black text-white">{p.name}</Link>
                  <p className="text-sm text-[var(--muted-text)]">
                    Rating {Math.round(p.glickoRating)} · {p.matchesWon}V {p.matchesLost}S · iscritto il {formatDate(p.createdAt)}
                  </p>
                </div>
                {r.score > 0 && <span className="shrink-0 rounded-full bg-[var(--danger)]/20 px-3 py-1 text-sm font-bold text-[var(--danger)]">{r.score}</span>}
              </div>
              <ul className="flex list-disc flex-col gap-1 pl-5 text-base text-white">
                {r.reasons.map((reason) => <li key={reason}>{reason}</li>)}
              </ul>
              {mine.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="eyebrow text-[var(--muted-text)]">Ultime partite che hanno contato</p>
                  {mine.map((m) => (
                    <div key={m.session.id} className="flex items-center gap-2 rounded-xl bg-[var(--surface-2)] p-2 pl-3">
                      <Link href={`/sessions/${m.session.id}`} className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-white">{m.session.title}</p>
                        <p className="text-sm text-[var(--muted-text)]">
                          {formatDate(m.session.date)} · {m.won ? "vinta" : m.lost ? "persa" : "—"}
                          {m.ratingBefore != null && m.ratingAfter != null ? ` · ${m.ratingAfter >= m.ratingBefore ? "+" : ""}${Math.round(m.ratingAfter - m.ratingBefore)}` : ""}
                        </p>
                      </Link>
                      {m.session.voidedAt ? <span className="shrink-0 px-2 text-sm text-[var(--muted-text)]">Annullata</span> : <VoidSessionButton sessionId={m.session.id} title={m.session.title} />}
                    </div>
                  ))}
                </div>
              )}
              <ExcludeButton playerId={p.id} name={p.name} excluded={p.rankingExcluded} />
            </section>
          )
        })}
      </div>
    </div>
  )
}
