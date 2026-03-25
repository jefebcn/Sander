import { cn } from "@/lib/utils"
import type { Match, MatchPlayer, Player } from "@/generated/prisma/client"

type MatchWithPlayers = Match & {
  players: (MatchPlayer & { player: Player })[]
}

interface BracketViewProps {
  matches: MatchWithPlayers[]
}

export function BracketView({ matches }: BracketViewProps) {
  if (matches.length === 0) {
    return (
      <p className="py-8 text-center text-[var(--muted-text)]">
        Nessun match nel tabellone
      </p>
    )
  }

  // Group matches by round (descending = first round first in display)
  const rounds = Array.from(new Set(matches.map((m) => m.round))).sort((a, b) => b - a)

  const roundLabels: Record<number, string> = {
    1: "Finale",
    2: "Semifinale",
    3: "Quarti",
  }

  return (
    <div className="flex min-w-max gap-4 py-4">
      {rounds.map((round) => {
        const roundMatches = matches.filter((m) => m.round === round && !m.isBye)
        const label = roundLabels[round] ?? `Round ${round}`

        return (
          <div key={round} className="flex flex-col gap-3">
            {/* Round header */}
            <p className="text-center text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              {label}
            </p>

            {/* Matches in this round */}
            <div className="flex flex-col justify-around gap-4" style={{ flex: 1 }}>
              {roundMatches.map((match) => {
                const teamA = match.players.filter((p) => p.team === 0).map((p) => p.player)
                const teamB = match.players.filter((p) => p.team === 1).map((p) => p.player)
                const aWon =
                  match.isCompleted &&
                  (match.teamAScore ?? 0) > (match.teamBScore ?? 0)
                const bWon =
                  match.isCompleted &&
                  (match.teamBScore ?? 0) > (match.teamAScore ?? 0)

                return (
                  <div
                    key={match.id}
                    className="w-44 overflow-hidden rounded-2xl border border-[var(--border)]"
                  >
                    {/* Team A */}
                    <div
                      className={cn(
                        "flex items-center justify-between gap-2 px-3 py-2 border-b border-[var(--border)]",
                        aWon && "bg-[var(--accent)]/10",
                      )}
                    >
                      <span
                        className={cn(
                          "text-sm font-semibold leading-tight",
                          aWon ? "text-[var(--accent)]" : "text-[var(--foreground)]",
                          teamA.length === 0 && "text-[var(--muted-text)] italic",
                        )}
                      >
                        {teamA.length > 0
                          ? teamA.map((p) => p.name).join(" & ")
                          : "TBD"}
                      </span>
                      {match.isCompleted && (
                        <span
                          className={cn(
                            "text-sm font-black tabular-nums",
                            aWon ? "text-[var(--accent)]" : "text-[var(--muted-text)]",
                          )}
                        >
                          {match.teamAScore}
                        </span>
                      )}
                    </div>

                    {/* Team B */}
                    <div
                      className={cn(
                        "flex items-center justify-between gap-2 px-3 py-2",
                        bWon && "bg-[var(--accent)]/10",
                      )}
                    >
                      <span
                        className={cn(
                          "text-sm font-semibold leading-tight",
                          bWon ? "text-[var(--accent)]" : "text-[var(--foreground)]",
                          teamB.length === 0 && "text-[var(--muted-text)] italic",
                        )}
                      >
                        {teamB.length > 0
                          ? teamB.map((p) => p.name).join(" & ")
                          : "TBD"}
                      </span>
                      {match.isCompleted && (
                        <span
                          className={cn(
                            "text-sm font-black tabular-nums",
                            bWon ? "text-[var(--accent)]" : "text-[var(--muted-text)]",
                          )}
                        >
                          {match.teamBScore}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
