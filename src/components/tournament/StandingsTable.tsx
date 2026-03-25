import { Crown, Medal } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TournamentStanding, Player } from "@/generated/prisma/client"

type StandingWithPlayer = TournamentStanding & { player: Player }

interface StandingsTableProps {
  standings: StandingWithPlayer[]
  compact?: boolean
}

const RANK_ICONS: Record<number, React.ReactNode> = {
  1: <Crown className="h-4 w-4 text-[var(--accent)]" />,
  2: <Medal className="h-4 w-4 text-[#c0c0c0]" />,
  3: <Medal className="h-4 w-4 text-[#cd7f32]" />,
}

export function StandingsTable({ standings, compact }: StandingsTableProps) {
  if (standings.length === 0) {
    return (
      <div className="rounded-2xl bg-[var(--surface-1)] px-4 py-6 text-center text-sm text-[var(--muted-text)]">
        Nessun risultato ancora
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-[var(--surface-1)] overflow-hidden">
      {/* Header */}
      {!compact && (
        <div className="grid grid-cols-[2rem_1fr_2.5rem_2.5rem_3rem] gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
          <span>#</span>
          <span>Giocatore</span>
          <span className="text-right">V</span>
          <span className="text-right">S</span>
          <span className="text-right">Pts</span>
        </div>
      )}

      <div className="divide-y divide-[var(--border)]">
        {standings.map((s) => (
          <div
            key={s.id}
            className={cn(
              "grid items-center gap-2 px-4 py-3",
              compact
                ? "grid-cols-[1.5rem_1fr_3rem]"
                : "grid-cols-[2rem_1fr_2.5rem_2.5rem_3rem]",
              s.rank === 1 && "bg-[var(--accent)]/5",
            )}
          >
            {/* Rank */}
            <div className="flex items-center justify-center">
              {RANK_ICONS[s.rank] ?? (
                <span className="text-sm font-bold text-[var(--muted-text)]">{s.rank}</span>
              )}
            </div>

            {/* Name */}
            <div>
              <p className={cn("font-semibold", s.rank === 1 && "text-[var(--accent)]")}>
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
                <span className="text-right text-sm font-medium">{s.matchesWon}</span>
                <span className="text-right text-sm text-[var(--muted-text)]">
                  {s.matchesLost}
                </span>
              </>
            )}
            <span
              className={cn(
                "text-right font-black",
                s.rank === 1 ? "text-[var(--accent)]" : "text-[var(--foreground)]",
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
