interface RoundProgressProps {
  completed: number
  total: number
  currentRound?: number | null
  totalRounds?: number
}

export function RoundProgress({ completed, total, currentRound, totalRounds }: RoundProgressProps) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)

  return (
    <div className="rounded-2xl bg-[var(--surface-1)] p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-semibold text-[var(--muted-text)]">
          {currentRound != null
            ? totalRounds
              ? `Round ${currentRound} / ${totalRounds}`
              : `Round ${currentRound}`
            : "Completato"}
        </span>
        <span className="text-sm font-bold text-[var(--accent)]">
          {completed}/{total} match
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
        <div
          className="h-full rounded-full bg-[var(--accent)] transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
