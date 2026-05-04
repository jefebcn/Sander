"use client"

import { useState, useTransition } from "react"
import { Trophy, ChevronUp, ChevronDown, Minus, RefreshCw, ArrowLeftRight, X } from "lucide-react"
import {
  submitChiceceGroupMatchScore,
  advanceChiceceToFinals,
  submitChiceceFinalScore,
  adminRegenerateChiceceRounds,
  adminResetChiceceToGroupPhase,
  swapChiceceGroupMatchPlayers,
} from "@/actions/tournaments"
import { cn } from "@/lib/utils"

interface Player {
  id: string
  name: string
  firstName: string | null
  lastName: string | null
}

interface Registration {
  id: string
  playerId: string
  chicecePlusMinus: number
  chiceceMatchesPlayed: number
  player: Player
}

interface MatchPlayer {
  playerId: string
  team: number
  player: Player
}

interface Match {
  id: string
  round: number
  matchNumber: number
  bracketSection: string
  teamAScore: number | null
  teamBScore: number | null
  isCompleted: boolean
  players: MatchPlayer[]
}

interface Tournament {
  id: string
  chicecePhase: string
  chiceceMatchCount: number
  status: string
}

interface ChiceceDashboardProps {
  tournament: Tournament
  registrations: Registration[]
  matches: Match[]
  isAdmin: boolean
}

function displayName(player: Player) {
  return player.firstName && player.lastName
    ? `${player.firstName} ${player.lastName}`
    : player.name
}

function PlayerDisplayName({ player }: { player: Player }) {
  return <>{displayName(player)}</>
}

function ScoreForm({
  matchId,
  onSubmit,
}: {
  matchId: string
  onSubmit: (matchId: string, a: number, b: number) => void
}) {
  const [a, setA] = useState("")
  const [b, setB] = useState("")

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const aNum = parseInt(a)
    const bNum = parseInt(b)
    if (isNaN(aNum) || isNaN(bNum) || aNum === bNum) return
    onSubmit(matchId, aNum, bNum)
    setA("")
    setB("")
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
      <input
        type="number"
        min={0}
        max={99}
        value={a}
        onChange={(e) => setA(e.target.value)}
        placeholder="A"
        className="w-14 rounded-lg bg-[var(--surface-3)] px-2 py-1.5 text-center text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        required
      />
      <span className="text-[var(--muted-text)] text-sm">–</span>
      <input
        type="number"
        min={0}
        max={99}
        value={b}
        onChange={(e) => setB(e.target.value)}
        placeholder="B"
        className="w-14 rounded-lg bg-[var(--surface-3)] px-2 py-1.5 text-center text-sm font-bold text-white focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        required
      />
      <button
        type="submit"
        className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-black text-black"
      >
        OK
      </button>
    </form>
  )
}

function SemiMatchCard({
  match,
  label,
  isAdmin,
  onScore,
}: {
  match: Match
  label: string
  isAdmin: boolean
  onScore: (matchId: string, a: number, b: number) => void
}) {
  const teamA = match.players.filter((p) => p.team === 0)
  const teamB = match.players.filter((p) => p.team === 1)
  const teamAWon = match.isCompleted && (match.teamAScore ?? 0) > (match.teamBScore ?? 0)

  return (
    <div>
      <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
        {label}
      </p>
      <div className="rounded-2xl bg-[var(--surface-2)] p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            <div className={cn("rounded-xl px-3 py-2", teamAWon ? "bg-[var(--accent)]/10" : "bg-[var(--surface-3)]")}>
              <p className="text-sm font-bold text-white">
                {teamA.map((p, i) => (
                  <span key={p.playerId}>{i > 0 && " + "}<PlayerDisplayName player={p.player} /></span>
                ))}
              </p>
            </div>
            <div className={cn("rounded-xl px-3 py-2", !teamAWon && match.isCompleted ? "bg-[var(--accent)]/10" : "bg-[var(--surface-3)]")}>
              <p className="text-sm font-bold text-white">
                {teamB.map((p, i) => (
                  <span key={p.playerId}>{i > 0 && " + "}<PlayerDisplayName player={p.player} /></span>
                ))}
              </p>
            </div>
          </div>
          {match.isCompleted && (
            <div className="shrink-0 text-center">
              <p className="text-2xl font-black text-white">{match.teamAScore}</p>
              <p className="text-xs text-[var(--muted-text)]">–</p>
              <p className="text-2xl font-black text-white">{match.teamBScore}</p>
            </div>
          )}
        </div>
        {isAdmin && !match.isCompleted && (
          <ScoreForm matchId={match.id} onSubmit={onScore} />
        )}
      </div>
    </div>
  )
}

export function ChiceceDashboard({
  tournament,
  registrations,
  matches,
  isAdmin,
}: ChiceceDashboardProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Draft state
  const [draft, setDraft] = useState<Record<string, string>>({})

  // Swap mode state
  const [swapMode, setSwapMode] = useState(false)
  const [swapSel, setSwapSel] = useState<{ matchId: string; playerId: string; name: string } | null>(null)

  const groupMatches = matches.filter((m) => m.bracketSection === "GROUP")
  const semi1Match = matches.find((m) => m.bracketSection === "SEMI1")
  const semi2Match = matches.find((m) => m.bracketSection === "SEMI2")
  const legacySemiMatch = matches.find((m) => m.bracketSection === "SEMI") // backward compat
  const finalMatch = matches.find((m) => m.bracketSection === "FINAL")

  const sortedRegs = [...registrations].sort(
    (a, b) => b.chicecePlusMinus - a.chicecePlusMinus,
  )

  const allGroupDone =
    groupMatches.length > 0 && groupMatches.every((m) => m.isCompleted)

  const top4 = sortedRegs.slice(0, 4)
  const restPlayers = sortedRegs.slice(4)

  const anyFinalMatchCompleted =
    semi1Match?.isCompleted || semi2Match?.isCompleted ||
    legacySemiMatch?.isCompleted || finalMatch?.isCompleted

  function availablePartners(forFinalistId: string) {
    const taken = new Set(
      Object.entries(draft)
        .filter(([fid]) => fid !== forFinalistId)
        .map(([, pid]) => pid),
    )
    return restPlayers.filter((r) => !taken.has(r.playerId))
  }

  const draftComplete =
    top4.length === 4 && top4.every((r) => draft[r.playerId])

  const matchesByRound = groupMatches.reduce<Record<number, Match[]>>((acc, m) => {
    ;(acc[m.round] ??= []).push(m)
    return acc
  }, {})

  function handleGroupScore(matchId: string, a: number, b: number) {
    setError(null)
    startTransition(async () => {
      try {
        await submitChiceceGroupMatchScore(matchId, a, b)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore")
      }
    })
  }

  function handleFinalScore(matchId: string, a: number, b: number) {
    setError(null)
    startTransition(async () => {
      try {
        await submitChiceceFinalScore(matchId, a, b)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore")
      }
    })
  }

  function handleAdvance() {
    if (!draftComplete) return
    setError(null)
    startTransition(async () => {
      try {
        await advanceChiceceToFinals(tournament.id, {
          p1Partner: draft[top4[0].playerId],
          p2Partner: draft[top4[1].playerId],
          p3Partner: draft[top4[2].playerId],
          p4Partner: draft[top4[3].playerId],
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore")
      }
    })
  }

  function handleResetToGroup() {
    if (!confirm("Annulla la finale corrente e torna al draft partner? I gironi restano invariati.")) return
    setError(null)
    startTransition(async () => {
      try {
        await adminResetChiceceToGroupPhase(tournament.id)
        setDraft({})
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore")
      }
    })
  }

  function handleRegenerate() {
    if (!confirm("Rigenera i round non ancora giocati con nuove coppie uniche? I round completati restano invariati.")) return
    setError(null)
    startTransition(async () => {
      try {
        await adminRegenerateChiceceRounds(tournament.id)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore")
      }
    })
  }

  function handleSwapSelect(matchId: string, playerId: string, name: string) {
    if (swapSel && swapSel.matchId === matchId && swapSel.playerId === playerId) {
      setSwapSel(null)
      return
    }
    if (!swapSel) {
      setSwapSel({ matchId, playerId, name })
      return
    }
    // Second selection — execute swap
    const sel = swapSel
    setSwapSel(null)
    setError(null)
    startTransition(async () => {
      const result = await swapChiceceGroupMatchPlayers(
        tournament.id,
        sel.matchId, sel.playerId,
        matchId, playerId,
      )
      if (!result.ok) setError(result.error)
    })
  }

  return (
    <div className="space-y-5 px-4">
      {error && (
        <p className="rounded-xl bg-[var(--danger)]/15 px-4 py-3 text-sm font-medium text-[var(--danger)]">
          {error}
        </p>
      )}

      {/* ── Standings ─────────────────────────────────────────── */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
          Classifica gironi
        </p>
        <div className="rounded-2xl bg-[var(--surface-2)] overflow-hidden">
          {sortedRegs.map((reg, i) => {
            const pm = reg.chicecePlusMinus
            return (
              <div
                key={reg.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  i < sortedRegs.length - 1 && "border-b border-[var(--border)]",
                )}
              >
                <span className="w-5 text-center text-sm font-black text-[var(--muted-text)]">
                  {i + 1}
                </span>
                <span className="flex-1 text-sm font-semibold text-white truncate">
                  <PlayerDisplayName player={reg.player} />
                </span>
                <span className="text-xs text-[var(--muted-text)]">
                  {reg.chiceceMatchesPlayed} part.
                </span>
                <span
                  className={cn(
                    "flex items-center gap-0.5 text-sm font-black w-14 justify-end",
                    pm > 0 ? "text-[var(--live)]" : pm < 0 ? "text-[var(--danger)]" : "text-[var(--muted-text)]",
                  )}
                >
                  {pm > 0 ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : pm < 0 ? (
                    <ChevronDown className="h-3.5 w-3.5" />
                  ) : (
                    <Minus className="h-3.5 w-3.5" />
                  )}
                  {pm > 0 ? `+${pm}` : pm}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Group matches ──────────────────────────────────────── */}
      {tournament.chicecePhase === "GROUP" && (
        <div>
          {/* Swap banner */}
          {swapMode && (
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-[var(--surface-3)] px-4 py-3">
              <ArrowLeftRight className="h-4 w-4 shrink-0 text-[var(--accent)]" />
              <p className="flex-1 text-sm font-semibold text-white">
                {swapSel
                  ? `Selezionato: ${swapSel.name} — tocca un altro giocatore`
                  : "Tocca un giocatore da scambiare"}
              </p>
              <button
                onClick={() => { setSwapMode(false); setSwapSel(null) }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--muted-text)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
            Partite gironi
          </p>
          <div className="space-y-3">
            {Object.entries(matchesByRound)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([round, rMatches]) => (
                <div key={round}>
                  <p className="mb-1.5 text-xs text-[var(--muted-text)] font-semibold">
                    Giro {round}
                  </p>
                  <div className="space-y-2">
                    {rMatches.map((m) => {
                      const teamA = m.players.filter((p) => p.team === 0)
                      const teamB = m.players.filter((p) => p.team === 1)
                      const isPending = !m.isCompleted
                      const canSwap = swapMode && isPending

                      function PlayerBtn({ mp }: { mp: MatchPlayer }) {
                        const isSelected =
                          swapSel?.matchId === m.id && swapSel?.playerId === mp.playerId
                        return canSwap ? (
                          <button
                            onClick={() => handleSwapSelect(m.id, mp.playerId, displayName(mp.player))}
                            className={cn(
                              "rounded-lg px-2 py-1 text-xs font-semibold ring-1 transition-colors",
                              isSelected
                                ? "bg-[var(--accent)]/15 ring-[var(--accent)] text-[var(--accent)]"
                                : "ring-white/20 text-white",
                            )}
                          >
                            <PlayerDisplayName player={mp.player} />
                          </button>
                        ) : (
                          <span className="text-xs font-semibold text-white">
                            <PlayerDisplayName player={mp.player} />
                          </span>
                        )
                      }

                      return (
                        <div
                          key={m.id}
                          className={cn(
                            "rounded-2xl bg-[var(--surface-2)] p-3",
                            canSwap && "ring-1 ring-white/10",
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="flex flex-wrap items-center gap-1 text-xs">
                                {teamA.map((p, i) => (
                                  <span key={p.playerId} className="flex items-center gap-1">
                                    {i > 0 && <span className="text-[var(--muted-text)]">+</span>}
                                    <PlayerBtn mp={p} />
                                  </span>
                                ))}
                              </p>
                              <p className="mt-1 flex flex-wrap items-center gap-1 text-xs">
                                <span className="text-[var(--muted-text)]">vs</span>
                                {teamB.map((p, i) => (
                                  <span key={p.playerId} className="flex items-center gap-1">
                                    {i > 0 && <span className="text-[var(--muted-text)]">+</span>}
                                    <PlayerBtn mp={p} />
                                  </span>
                                ))}
                              </p>
                            </div>
                            {m.isCompleted ? (
                              <span className="shrink-0 text-sm font-black text-white">
                                {m.teamAScore} – {m.teamBScore}
                              </span>
                            ) : (
                              <span className="shrink-0 text-xs text-[var(--muted-text)]">
                                da giocare
                              </span>
                            )}
                          </div>
                          {isAdmin && !m.isCompleted && !swapMode && (
                            <ScoreForm matchId={m.id} onSubmit={handleGroupScore} />
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* ── Admin: rigenera + scambia ─────────────────────────── */}
      {isAdmin && tournament.chicecePhase === "GROUP" && tournament.status === "LIVE" && !allGroupDone && (
        <div className="flex gap-2">
          <button
            onClick={handleRegenerate}
            disabled={isPending}
            className="flex flex-1 min-h-[3.5rem] items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-sm font-bold text-white disabled:opacity-40"
          >
            <RefreshCw className="h-4 w-4" />
            Rigenera Round
          </button>
          <button
            onClick={() => { setSwapMode((v) => !v); setSwapSel(null) }}
            disabled={isPending}
            className={cn(
              "flex flex-1 min-h-[3.5rem] items-center justify-center gap-2 rounded-2xl border text-sm font-bold disabled:opacity-40",
              swapMode
                ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                : "border-[var(--border)] bg-[var(--surface-2)] text-white",
            )}
          >
            <ArrowLeftRight className="h-4 w-4" />
            Scambia coppie
          </button>
        </div>
      )}

      {/* ── Partner draft → advance to finals ─────────────────── */}
      {isAdmin && allGroupDone && tournament.chicecePhase === "GROUP" && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
            Scegli i partner per la finale
          </p>
          <div className="space-y-2 rounded-2xl bg-[var(--surface-2)] p-3">
            {top4.map((finalist, i) => {
              const available = availablePartners(finalist.playerId)
              const label = `${i + 1}°`
              return (
                <div key={finalist.playerId} className="flex items-center gap-3">
                  <span className="w-6 shrink-0 text-xs font-black text-[var(--accent)]">{label}</span>
                  <span className="flex-1 truncate text-sm font-semibold text-white">
                    <PlayerDisplayName player={finalist.player} />
                  </span>
                  <span className="text-xs text-[var(--muted-text)]">+</span>
                  <select
                    value={draft[finalist.playerId] ?? ""}
                    onChange={(e) =>
                      setDraft((prev) => ({ ...prev, [finalist.playerId]: e.target.value }))
                    }
                    className="rounded-lg bg-[var(--surface-3)] px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  >
                    <option value="" disabled>Scegli partner</option>
                    {available.map((r) => (
                      <option key={r.playerId} value={r.playerId}>
                        {displayName(r.player)}
                      </option>
                    ))}
                  </select>
                </div>
              )
            })}
          </div>
          <button
            onClick={handleAdvance}
            disabled={isPending || !draftComplete}
            className="mt-3 flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] font-bold text-black disabled:opacity-40"
          >
            <Trophy className="h-5 w-5" />
            Avanza alla Finale
          </button>
        </div>
      )}

      {/* ── Finals ────────────────────────────────────────────── */}
      {tournament.chicecePhase === "FINAL" && (
        <div className="space-y-4">
          {/* Reset draft button — only when no semi has been played yet */}
          {isAdmin && !anyFinalMatchCompleted && (
            <button
              onClick={handleResetToGroup}
              disabled={isPending}
              className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] font-bold text-white disabled:opacity-40"
            >
              <RefreshCw className="h-5 w-5" />
              Rifai il draft partner
            </button>
          )}

          <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
            Top 4 qualificati
          </p>
          <div className="rounded-2xl bg-[var(--surface-2)] p-3 space-y-2">
            {sortedRegs.slice(0, 4).map((reg, i) => (
              <div key={reg.id} className="flex items-center gap-2">
                <span className="text-xs font-black text-[var(--accent)] w-4">{i + 1}°</span>
                <span className="text-sm font-semibold text-white flex-1">
                  <PlayerDisplayName player={reg.player} />
                </span>
                <span
                  className={cn(
                    "text-xs font-bold",
                    reg.chicecePlusMinus >= 0 ? "text-[var(--live)]" : "text-[var(--danger)]",
                  )}
                >
                  {reg.chicecePlusMinus > 0
                    ? `+${reg.chicecePlusMinus}`
                    : reg.chicecePlusMinus}
                </span>
              </div>
            ))}
          </div>

          {/* New format: SEMI1 + SEMI2 */}
          {(semi1Match || semi2Match) && (
            <>
              {semi1Match && (
                <SemiMatchCard
                  match={semi1Match}
                  label="Semifinale 1 — 1° vs 4°"
                  isAdmin={isAdmin}
                  onScore={handleFinalScore}
                />
              )}
              {semi2Match && (
                <SemiMatchCard
                  match={semi2Match}
                  label="Semifinale 2 — 2° vs 3°"
                  isAdmin={isAdmin}
                  onScore={handleFinalScore}
                />
              )}
            </>
          )}

          {/* Legacy single-semi format (backward compat) */}
          {!semi1Match && !semi2Match && legacySemiMatch && (
            <SemiMatchCard
              match={legacySemiMatch}
              label="Semifinale — 3° vs 4°"
              isAdmin={isAdmin}
              onScore={handleFinalScore}
            />
          )}

          {/* Finale */}
          {finalMatch ? (
            (() => {
              const teamA = finalMatch.players.filter((p) => p.team === 0)
              const teamB = finalMatch.players.filter((p) => p.team === 1)
              const teamAWon = finalMatch.isCompleted && (finalMatch.teamAScore ?? 0) > (finalMatch.teamBScore ?? 0)
              return (
                <div>
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                    Finale
                  </p>
                  <div className="rounded-2xl bg-[var(--surface-2)] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className={cn("rounded-xl px-3 py-2", teamAWon ? "bg-[var(--accent)]/10" : "bg-[var(--surface-3)]")}>
                          <p className="text-sm font-bold text-white">
                            {teamA.map((p, i) => (
                              <span key={p.playerId}>{i > 0 && " + "}<PlayerDisplayName player={p.player} /></span>
                            ))}
                          </p>
                        </div>
                        <div className={cn("rounded-xl px-3 py-2", !teamAWon && finalMatch.isCompleted ? "bg-[var(--accent)]/10" : "bg-[var(--surface-3)]")}>
                          <p className="text-sm font-bold text-white">
                            {teamB.map((p, i) => (
                              <span key={p.playerId}>{i > 0 && " + "}<PlayerDisplayName player={p.player} /></span>
                            ))}
                          </p>
                        </div>
                      </div>
                      {finalMatch.isCompleted && (
                        <div className="shrink-0 text-center">
                          <p className="text-2xl font-black text-white">{finalMatch.teamAScore}</p>
                          <p className="text-xs text-[var(--muted-text)]">–</p>
                          <p className="text-2xl font-black text-white">{finalMatch.teamBScore}</p>
                        </div>
                      )}
                    </div>
                    {isAdmin && !finalMatch.isCompleted && (
                      <ScoreForm matchId={finalMatch.id} onSubmit={handleFinalScore} />
                    )}
                    {finalMatch.isCompleted && (
                      <div className="mt-3 flex items-center gap-2 rounded-xl bg-[var(--accent)]/10 px-3 py-2">
                        <Trophy className="h-4 w-4 text-[var(--accent)]" />
                        <p className="text-sm font-bold text-[var(--accent)]">
                          Campioni:{" "}
                          {(teamAWon ? teamA : teamB).map((p, i) => (
                            <span key={p.playerId}>
                              {i > 0 && " & "}
                              <PlayerDisplayName player={p.player} />
                            </span>
                          ))}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )
            })()
          ) : (
            // FINAL not yet created — waiting for semis
            <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface-2)] p-4 opacity-60">
              <Trophy className="h-5 w-5 shrink-0 text-[var(--muted-text)]" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">Finale</p>
                <p className="text-sm text-[var(--muted-text)]">Disponibile al termine delle semifinali</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
