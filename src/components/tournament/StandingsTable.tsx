import { Crown, Medal, BarChart2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TournamentStanding, Player } from "@/generated/prisma/client"

type StandingWithPlayer = TournamentStanding & { player: Player }

interface StandingsTableProps {
  standings: StandingWithPlayer[]
  compact?: boolean
}

function RankBadge({ rank }: { rank: number | null }) {
  if (rank === 1)
    return <Crown className="h-4 w-4 text-[var(--gold)]" aria-label="1° posto" />
  if (rank === 2)
    return <Medal className="h-4 w-4 text-[var(--silver)]" aria-label="2° posto" />
  if (rank === 3)
    return <Medal className="h-4 w-4 text-[var(--bronze)]" aria-label="3° posto" />
  return (
    <span className="text-sm font-bold tabular-nums text-[var(--muted-text)]">
      {rank ?? "–"}
    </span>
  )
}

export function StandingsTable({ standings, compact }: StandingsTableProps) {
  if (standings.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-[var(--surface-1)] px-4 py-8 text-center">
        <BarChart2 className="h-8 w-8 opacity-30" aria-hidden="true" />
        <p className="text-sm text-[var(--muted-text)]">Nessun risultato ancora</p>
      </div>
    )
  }

  return (
    <div
      className="rounded-2xl bg-[var(--surface-1)] overflow-hidden"
      role="table"
      aria-label="Classifica torneo"
    >
      {/* Header */}
      {!compact && (
        <div
          className="grid grid-cols-[2rem_1fr_2.5rem_2.5rem_3rem] gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]"
          role="row"
        >
          <span role="columnheader">#</span>
          <span role="columnheader">Giocatore</span>
          <span className="text-right" role="columnheader" aria-label="Vittorie">V</span>
          <span className="text-right" role="columnheader" aria-label="Sconfitte">S</span>
          <span className="text-right" role="columnheader">Pts</span>
        </div>
      )}

      <div className="divide-y divide-[var(--border)]" role="rowgroup">
        {standings.map((s) => (
          <div
            key={s.id}
            role="row"
            className={cn(
              "grid items-center gap-2 px-4 py-3 transition-colors",
              compact
                ? "grid-cols-[1.5rem_1fr_3rem]"
                : "grid-cols-[2rem_1fr_2.5rem_2.5rem_3rem]",
              s.rank === 1 && "bg-[var(--gold)]/5",
            )}
          >
            {/* Rank */}
            <div className="flex items-center justify-center" role="cell">
              <RankBadge rank={s.rank} />
            </div>

            {/* Name */}
            <div role="cell">
              <p
                className={cn(
                  "font-semibold",
                  s.rank === 1 && "text-[var(--gold)]",
                  s.rank === 2 && "text-[var(--silver)]",
                  s.rank === 3 && "text-[var(--bronze)]",
                )}
              >
                {s.player.name}
              </p>
              {!compact && (
                <p className="text-xs text-[var(--muted-text)]">
                  {s.matchesWon}V {s.matchesLost}S · Diff{" "}
                  {s.pointsFor - s.pointsAgainst > 0 ? "+" : ""}
                  {s.pointsFor - s.pointsAgainst}
                </p>
              )}
            </div>

            {/* Stats — compact shows only pts */}
            {!compact && (
              <>
                <span className="text-right text-sm font-medium" role="cell">{s.matchesWon}</span>
                <span className="text-right text-sm text-[var(--muted-text)]" role="cell">
                  {s.matchesLost}
                </span>
              </>
            )}
            <span
              role="cell"
              className={cn(
                "text-right font-black",
                s.rank === 1
                  ? "text-[var(--gold)]"
                  : s.rank === 2
                    ? "text-[var(--silver)]"
                    : s.rank === 3
                      ? "text-[var(--bronze)]"
                      : "text-[var(--foreground)]",
              )}
            >
              {s.points}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
