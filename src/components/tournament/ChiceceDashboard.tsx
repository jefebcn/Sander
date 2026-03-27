"use client"

import { useState, useTransition } from "react"
import { Trophy, ChevronUp, ChevronDown, Minus } from "lucide-react"
import {
  submitChiceceGroupMatchScore,
  advanceChiceceToFinals,
  submitChiceceFinalScore,
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

function PlayerDisplayName({ player }: { player: Player }) {
  const name = player.firstName && player.lastName
    ? `${player.firstName} ${player.lastName}`
    : player.name
  return <>{name}</>
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

export function ChiceceDashboard({
  tournament,
  registrations,
  matches,
  isAdmin,
}: ChiceceDashboardProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const groupMatches = matches.filter((m) => m.bracketSection === "GROUP")
  const finalMatches = matches.filter((m) => m.bracketSection === "FINAL")

  // Sort registrations by chicecePlusMinus desc
  const sortedRegs = [...registrations].sort(
    (a, b) => b.chicecePlusMinus - a.chicecePlusMinus,
  )

  const allGroupDone =
    groupMatches.length > 0 && groupMatches.every((m) => m.isCompleted)
  const canAdvance =
    isAdmin &&
    tournament.chicecePhase === "GROUP" &&
    tournament.status === "LIVE" &&
    allGroupDone

  // Group matches by round
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
    setError(null)
    startTransition(async () => {
      try {
        await advanceChiceceToFinals(tournament.id)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore")
      }
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
                      return (
                        <div
                          key={m.id}
                          className="rounded-2xl bg-[var(--surface-2)] p-3"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-white truncate">
                                {teamA.map((p, i) => (
                                  <span key={p.playerId}>
                                    {i > 0 && " + "}
                                    <PlayerDisplayName player={p.player} />
                                  </span>
                                ))}
                              </p>
                              <p className="text-xs text-[var(--muted-text)] mt-0.5">
                                vs{" "}
                                {teamB.map((p, i) => (
                                  <span key={p.playerId}>
                                    {i > 0 && " + "}
                                    <PlayerDisplayName player={p.player} />
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
                          {isAdmin && !m.isCompleted && (
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

      {/* ── Advance to finals button ───────────────────────────── */}
      {canAdvance && (
        <button
          onClick={handleAdvance}
          disabled={isPending}
          className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--accent)] font-bold text-black disabled:opacity-40"
        >
          <Trophy className="h-5 w-5" />
          Avanza alla Finale
        </button>
      )}

      {/* ── Finals ────────────────────────────────────────────── */}
      {tournament.chicecePhase === "FINAL" && (
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
            Finale
          </p>

          {/* Finalists */}
          <div className="mb-3 rounded-2xl bg-[var(--surface-2)] p-3 space-y-2">
            <p className="text-xs font-semibold text-[var(--muted-text)]">Top 4 qualificati</p>
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

          {/* Final matches */}
          {finalMatches.map((m) => {
            const teamA = m.players.filter((p) => p.team === 0)
            const teamB = m.players.filter((p) => p.team === 1)
            const teamAWon = m.isCompleted && m.teamAScore! > m.teamBScore!
            return (
              <div key={m.id} className="rounded-2xl bg-[var(--surface-2)] p-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div
                      className={cn(
                        "rounded-xl px-3 py-2",
                        teamAWon ? "bg-[var(--accent)]/10" : "bg-[var(--surface-3)]",
                      )}
                    >
                      <p className="text-sm font-bold text-white">
                        {teamA.map((p, i) => (
                          <span key={p.playerId}>
                            {i > 0 && " + "}
                            <PlayerDisplayName player={p.player} />
                          </span>
                        ))}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "rounded-xl px-3 py-2",
                        !teamAWon && m.isCompleted ? "bg-[var(--accent)]/10" : "bg-[var(--surface-3)]",
                      )}
                    >
                      <p className="text-sm font-bold text-white">
                        {teamB.map((p, i) => (
                          <span key={p.playerId}>
                            {i > 0 && " + "}
                            <PlayerDisplayName player={p.player} />
                          </span>
                        ))}
                      </p>
                    </div>
                  </div>
                  {m.isCompleted && (
                    <div className="shrink-0 text-center">
                      <p className="text-2xl font-black text-white">{m.teamAScore}</p>
                      <p className="text-xs text-[var(--muted-text)]">–</p>
                      <p className="text-2xl font-black text-white">{m.teamBScore}</p>
                    </div>
                  )}
                </div>
                {isAdmin && !m.isCompleted && (
                  <ScoreForm matchId={m.id} onSubmit={handleFinalScore} />
                )}
                {m.isCompleted && (
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
            )
          })}
        </div>
      )}
    </div>
  )
}
