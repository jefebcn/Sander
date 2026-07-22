export const dynamic = "force-dynamic"

import { getPlayer, getHeadToHeadStats, getPlayerAdvancedStats, getTournamentWins, getMatchHistory, getPartnerStats, getH2HMatchHistory } from "@/actions/players"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { getStreak } from "@/lib/streak"
import { db } from "@/lib/db"
import { SanderCardFut, playerToCardData } from "@/components/player/SanderCardFut"
import { RatingChart } from "@/components/player/RatingChart"
import { PlayerStats } from "@/components/player/PlayerStats"
import { MatchHistory } from "@/components/player/MatchHistory"
import { PartnerStats } from "@/components/player/PartnerStats"
import { Achievements } from "@/components/player/Achievements"
import { computeAchievements } from "@/lib/achievements"
import { PageHeader } from "@/components/layout/PageHeader"
import { MessageButton } from "@/components/chat/MessageButton"
import { Users, Swords, Trophy, Volleyball } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

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
  const [player, streak, me, ratingHistory, advancedStats, monthlyAwards, tournamentWins, matchHistory, partnerStats] = await Promise.all([
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
    getMatchHistory(id),
    getPartnerStats(id),
  ])

  // Only show H2H when a different logged-in player is viewing this profile
  const showH2H = me && me.id !== id
  const [h2h, h2hMatches] = showH2H
    ? await Promise.all([getHeadToHeadStats(me.id, id), getH2HMatchHistory(me.id, id)])
    : [null, null]

  const achievements = computeAchievements({
    matchesWon: player.matchesWon,
    matchesLost: player.matchesLost,
    winRatePct: player.winRatePct,
    sessionsPlayed: player.sessionsPlayed,
    tournamentsWon: player.tournamentsWon,
    glickoRating: player.glickoRating,
    level: player.level,
    streak,
    monthlyAwardPositions: monthlyAwards.map((a) => a.position),
  })

  return (
    <div>
      <PageHeader title="SanderCard" backHref="/players" />
      <div className="px-4 pb-6 flex flex-col gap-4">
        <SanderCardFut playerData={playerToCardData(player)} />

        {/* Write to this player (only when a different logged-in player is viewing) */}
        {showH2H && <MessageButton playerId={id} label="Scrivi a questo giocatore" />}

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
        {h2h && (h2h.together.played > 0 || h2h.versus.played > 0) && (() => {
          const opponentName = player.firstName ?? player.name.split(" ")[0]
          const MONTH_SHORT_H2H = ["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"]
          return (
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
                Tu e {opponentName}
              </p>

              {/* Versus card */}
              {h2h.versus.played > 0 && (
                <div className="rounded-2xl bg-[var(--surface-2)] p-4 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Swords className="h-4 w-4 text-[var(--danger)]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--danger)]">
                      Testa a testa — {h2h.versus.played} {h2h.versus.played === 1 ? "partita" : "partite"}
                    </span>
                  </div>

                  {/* Score bar */}
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black text-white w-8 text-center">{h2h.versus.won}</span>
                    <div className="flex-1 h-3 rounded-full overflow-hidden bg-[var(--surface-3)] flex">
                      {h2h.versus.played > 0 && (
                        <>
                          <div
                            className="h-full bg-[var(--accent)] transition-all"
                            style={{ width: `${Math.round((h2h.versus.won / h2h.versus.played) * 100)}%` }}
                          />
                          <div
                            className="h-full bg-[var(--danger)]"
                            style={{ width: `${Math.round((h2h.versus.lost / h2h.versus.played) * 100)}%` }}
                          />
                        </>
                      )}
                    </div>
                    <span className="text-3xl font-black text-white w-8 text-center">{h2h.versus.lost}</span>
                  </div>
                  <div className="flex justify-between text-[0.6rem] font-bold uppercase tracking-wider text-[var(--muted-text)] -mt-3">
                    <span>Tu</span>
                    <span>{opponentName}</span>
                  </div>

                  {/* Set detail */}
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[var(--border)]">
                    {[
                      { label: "Set vinti", value: h2h.versus.setsWon, color: "text-[var(--accent)]" },
                      { label: "% vittorie", value: pct(h2h.versus.won, h2h.versus.played), color: "text-white" },
                      { label: "Set persi", value: h2h.versus.setsLost, color: "text-[var(--danger)]" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex flex-col items-center gap-0.5">
                        <span className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--muted-text)]">{label}</span>
                        <span className={`text-xl font-black ${color}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Together card */}
              {h2h.together.played > 0 && (
                <div className="rounded-2xl bg-[var(--surface-2)] p-4 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[var(--accent)]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                      Insieme — {h2h.together.played} {h2h.together.played === 1 ? "partita" : "partite"}
                    </span>
                  </div>

                  {/* Win bar */}
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black text-[var(--accent)] w-8 text-center">{h2h.together.won}</span>
                    <div className="flex-1 h-3 rounded-full overflow-hidden bg-[var(--surface-3)]">
                      <div
                        className="h-full bg-[var(--accent)] rounded-full"
                        style={{ width: `${Math.max(2, Math.round((h2h.together.won / h2h.together.played) * 100))}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-[var(--muted-text)] w-8 text-center">
                      {pct(h2h.together.won, h2h.together.played)}
                    </span>
                  </div>
                  <div className="flex justify-between text-[0.6rem] font-bold uppercase tracking-wider text-[var(--muted-text)] -mt-3">
                    <span>Vittorie</span>
                    <span>Win%</span>
                  </div>

                  {/* Set detail */}
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[var(--border)]">
                    {[
                      { label: "Set vinti", value: h2h.together.setsWon, color: "text-[var(--accent)]" },
                      { label: "Sconfitte", value: h2h.together.lost, color: "text-[var(--danger)]" },
                      { label: "Set persi", value: h2h.together.setsLost, color: "text-[var(--muted-text)]" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="flex flex-col items-center gap-0.5">
                        <span className="text-[0.6rem] font-bold uppercase tracking-wider text-[var(--muted-text)]">{label}</span>
                        <span className={`text-xl font-black ${color}`}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Shared match history */}
              {h2hMatches && h2hMatches.length > 0 && (
                <div className="rounded-2xl bg-[var(--surface-2)] overflow-hidden divide-y divide-[var(--border)]">
                  {h2hMatches.map((e) => {
                    const d = new Date(e.date)
                    const dateLabel = `${d.getDate()} ${MONTH_SHORT_H2H[d.getMonth()]}`
                    const href = e.type === "tournament" ? `/tournaments/${e.sourceId}` : `/sessions/${e.sourceId}`
                    const won = e.result === "won"
                    const myScore  = e.myTeam === 0 ? e.scoreA : e.scoreB
                    const oppScore = e.myTeam === 0 ? e.scoreB : e.scoreA
                    return (
                      <Link key={e.id} href={href} className="flex items-center gap-3 px-4 py-3 active:opacity-70">
                        <div className="w-10 shrink-0 text-center">
                          <p className="text-[0.65rem] font-bold uppercase text-[var(--muted-text)]">{dateLabel}</p>
                        </div>
                        <div className={cn(
                          "w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-xs font-black",
                          won ? "bg-[var(--live)]/15 text-[var(--live)]" : "bg-[var(--danger)]/15 text-[var(--danger)]",
                        )}>
                          {won ? "V" : "S"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            {e.type === "tournament"
                              ? <Trophy className="h-3 w-3 shrink-0 text-[var(--accent)]" />
                              : <Volleyball className="h-3 w-3 shrink-0 text-[var(--muted-text)]" />}
                            <p className="text-xs text-[var(--muted-text)] truncate">{e.sourceName}</p>
                          </div>
                          <p className="text-xs font-semibold text-white leading-snug">
                            {e.partners.filter(p => p.id !== me!.id).length > 0 && (
                              <span className="text-[var(--accent)]">
                                {e.partners.filter(p => p.id !== me!.id).map(p => p.firstName ?? p.name.split(" ")[0]).join(" + ")}
                                {" "}
                              </span>
                            )}
                            <span className="text-[var(--muted-text)]">vs </span>
                            {e.opponents.map(p => p.firstName ?? p.name.split(" ")[0]).join(" + ")}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={cn("text-sm font-black", won ? "text-[var(--live)]" : "text-[var(--danger)]")}>
                            {myScore}–{oppScore}
                          </p>
                          {e.isSetScore && <p className="text-[0.6rem] text-[var(--muted-text)]">set</p>}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })()}

        {/* Empty state when logged in but no matches together yet */}
        {h2h && h2h.together.played === 0 && h2h.versus.played === 0 && (
          <div className="rounded-2xl bg-[var(--surface-2)] p-5 text-center">
            <p className="text-sm text-[var(--muted-text)]">
              Non hai ancora giocato nessuna partita con o contro{" "}
              <span className="text-white font-semibold">
                {player.firstName ?? player.name.split(" ")[0]}
              </span>
            </p>
          </div>
        )}

        {/* ── Achievements ─────────────────────────────────────── */}
        <Achievements achievements={achievements} />

        {/* ── Partner stats ────────────────────────────────────── */}
        <PartnerStats stats={partnerStats} />

        {/* ── Match history ────────────────────────────────────── */}
        <MatchHistory entries={matchHistory} />
      </div>
    </div>
  )
}
