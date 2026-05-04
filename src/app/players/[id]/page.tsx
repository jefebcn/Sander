export const dynamic = "force-dynamic"

import { getPlayer, getHeadToHeadStats, getPlayerAdvancedStats, getTournamentWins } from "@/actions/players"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { getStreak } from "@/lib/streak"
import { db } from "@/lib/db"
import { SanderCardFut, playerToCardData } from "@/components/player/SanderCardFut"
import { RatingChart } from "@/components/player/RatingChart"
import { PlayerStats } from "@/components/player/PlayerStats"
import { PageHeader } from "@/components/layout/PageHeader"
import { Users, Swords } from "lucide-react"

function pct(won: number, played: number) {
  if (played === 0) return "—"
  return `${Math.round((won / played) * 100)}%`
}

const MONTH_NAMES_IT = [
  "", "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
]

const AWARD_META: Record<number, { emoji: string; label: string; color: string }> = {
  1: { emoji: "👑", label: "1° Posto", color: "#FFD700" },
  2: { emoji: "🥈", label: "2° Posto", color: "#A8A8A8" },
  3: { emoji: "🥉", label: "3° Posto", color: "#CD7F32" },
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [player, streak, me, ratingHistory, advancedStats, monthlyAwards, tournamentWins] = await Promise.all([
    getPlayer(id),
    getStreak(id),
    getCurrentPlayer(),
    db.ratingHistory.findMany({
      where: { playerId: id },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true, rating: true, source: true },
    }),
    getPlayerAdvancedStats(id),
    db.monthlyAward.findMany({
      where: { playerId: id },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    }),
    getTournamentWins(id),
  ])

  // Only show H2H when a different logged-in player is viewing this profile
  const showH2H = me && me.id !== id
  const h2h = showH2H ? await getHeadToHeadStats(me.id, id) : null

  return (
    <div>
      <PageHeader title="SanderCard" backHref="/players" />
      <div className="px-4 pb-6 flex flex-col gap-4">
        <SanderCardFut playerData={playerToCardData(player)} />

        {/* ── Titoli ──────────────────────────────────────────── */}
        {(tournamentWins.length > 0 || monthlyAwards.length > 0) && (
          <div className="rounded-2xl bg-[var(--surface-2)] p-5 flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
              Titoli
            </p>
            <div className="flex flex-wrap gap-2">
              {tournamentWins.map((win) => {
                const d = new Date(win.date)
                return (
                  <div
                    key={win.tournamentId}
                    className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ background: "var(--surface-3)", border: "1px solid #FFD70030" }}
                  >
                    <span className="text-xl leading-none">🏆</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-black leading-tight" style={{ color: "#FFD700" }}>
                        {win.tournamentName}
                      </span>
                      <span className="text-[0.65rem] text-white/40 leading-tight">
                        {MONTH_NAMES_IT[d.getMonth() + 1]} {d.getFullYear()}
                      </span>
                    </div>
                  </div>
                )
              })}
              {monthlyAwards.map((award) => {
                const meta = AWARD_META[award.position]
                return (
                  <div
                    key={award.id}
                    className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ background: "var(--surface-3)", border: `1px solid ${meta.color}30` }}
                  >
                    <span className="text-xl leading-none">{meta.emoji}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-black leading-tight" style={{ color: meta.color }}>
                        {meta.label}
                      </span>
                      <span className="text-[0.65rem] text-white/40 leading-tight">
                        {MONTH_NAMES_IT[award.month]} {award.year}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Rating history chart ───────────────────────────── */}
        <RatingChart
          history={ratingHistory.map((r) => ({
            date: r.createdAt.toISOString(),
            rating: r.rating,
            source: r.source,
          }))}
          currentRating={player.glickoRating}
        />

        {/* ── Advanced stats ──────────────────────────────────── */}
        <PlayerStats
          player={player}
          communityAvg={advancedStats.communityAvg}
          tournamentsByType={advancedStats.tournamentsByType}
        />

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
