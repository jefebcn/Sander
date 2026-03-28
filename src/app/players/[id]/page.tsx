export const dynamic = "force-dynamic"

import { getPlayer, getHeadToHeadStats } from "@/actions/players"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"
import { SanderCardFifa } from "@/components/player/SanderCardFifa"
import { PageHeader } from "@/components/layout/PageHeader"
import { Users, Swords } from "lucide-react"

async function getStreak(playerId: string): Promise<number> {
  const since = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
  const count = await db.sessionParticipant.count({
    where: {
      playerId,
      session: { status: "COMPLETED", date: { gte: since } },
    },
  })
  return Math.min(count, 10)
}

function pct(won: number, played: number) {
  if (played === 0) return "—"
  return `${Math.round((won / played) * 100)}%`
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [player, streak, me] = await Promise.all([
    getPlayer(id),
    getStreak(id),
    getCurrentPlayer(),
  ])

  // Only show H2H when a different logged-in player is viewing this profile
  const showH2H = me && me.id !== id
  const h2h = showH2H ? await getHeadToHeadStats(me.id, id) : null

  return (
    <div>
      <PageHeader title="SanderCard" backHref="/players" />
      <div className="px-4 pb-6 flex flex-col gap-4">
        <SanderCardFifa player={{
          name: player.name,
          firstName: player.firstName,
          lastName: player.lastName,
          avatarUrl: player.avatarUrl,
          avgRating: player.avgRating,
          glickoRating: player.glickoRating,
          level: player.level,
          xp: player.xp,
          winRatePct: player.winRatePct,
          matchesWon: player.matchesWon,
          matchesLost: player.matchesLost,
          sessionsPlayed: player.sessionsPlayed,
          tournamentsWon: player.tournamentsWon,
          organizedSessions: player._count.organizedSessions,
          streak,
          mvpCount: player.badgesReceived.length,
          attPct: player.attPct,
          difPct: player.difPct,
          murPct: player.murPct,
          alzPct: player.alzPct,
          ricPct: player.ricPct,
          staPct: player.staPct,
        }} />

        {/* ── Head-to-head stats ──────────────────────────────── */}
        {h2h && (h2h.together.played > 0 || h2h.versus.played > 0) && (
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
              Tu e {player.firstName ?? player.name.split(" ")[0]}
            </p>

            <div className="grid grid-cols-2 gap-3">
              {/* Together */}
              <div className="rounded-2xl bg-[var(--surface-2)] p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-[var(--accent)]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                    Insieme
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  {[
                    { label: "PLA", value: h2h.together.played },
                    { label: "WIN", value: h2h.together.won },
                    { label: "%",   value: pct(h2h.together.won, h2h.together.played) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col items-center gap-0.5">
                      <span className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--muted-text)]">
                        {label}
                      </span>
                      <span className="text-xl font-black text-white">{value}</span>
                    </div>
                  ))}
                </div>
                {h2h.together.played > 0 && (
                  <div className="h-1 rounded-full overflow-hidden bg-[var(--surface-3)]">
                    <div
                      className="h-full rounded-full bg-[var(--accent)]"
                      style={{ width: `${Math.max(2, Math.round((h2h.together.won / h2h.together.played) * 100))}%` }}
                    />
                  </div>
                )}
              </div>

              {/* Versus */}
              <div className="rounded-2xl bg-[var(--surface-2)] p-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Swords className="h-4 w-4 text-[var(--danger)]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--danger)]">
                    Contro
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1 text-center">
                  {[
                    { label: "PLA", value: h2h.versus.played },
                    { label: "WIN", value: h2h.versus.won },
                    { label: "%",   value: pct(h2h.versus.won, h2h.versus.played) },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col items-center gap-0.5">
                      <span className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--muted-text)]">
                        {label}
                      </span>
                      <span className="text-xl font-black text-white">{value}</span>
                    </div>
                  ))}
                </div>
                {h2h.versus.played > 0 && (
                  <div className="h-1 rounded-full overflow-hidden bg-[var(--surface-3)]">
                    <div
                      className="h-full rounded-full bg-[var(--danger)]"
                      style={{ width: `${Math.max(2, Math.round((h2h.versus.won / h2h.versus.played) * 100))}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Empty state when logged in but no matches together yet */}
        {h2h && h2h.together.played === 0 && h2h.versus.played === 0 && (
          <div className="rounded-2xl bg-[var(--surface-2)] p-5 text-center">
            <p className="text-sm text-[var(--muted-text)]">
              Non hai ancora giocato nessuna partita di torneo con o contro{" "}
              <span className="text-white font-semibold">
                {player.firstName ?? player.name.split(" ")[0]}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
