"use client"

import { useQuery } from "@tanstack/react-query"
import { RefreshCw } from "lucide-react"
import { getTournamentDashboard } from "@/actions/standings"
import { MatchCard } from "./MatchCard"
import { MatchCardSkeleton } from "@/components/ui/Skeleton"
import { StandingsTable } from "./StandingsTable"
import { RoundProgress } from "./RoundProgress"

type DashboardData = Awaited<ReturnType<typeof getTournamentDashboard>>

interface LiveDashboardProps {
  tournamentId: string
  initialData: DashboardData
  readOnly?: boolean
}

export function LiveDashboard({ tournamentId, initialData, readOnly }: LiveDashboardProps) {
  const { data, isRefetching } = useQuery({
    queryKey: ["dashboard", tournamentId],
    queryFn: () => getTournamentDashboard(tournamentId),
    initialData,
    refetchInterval: readOnly ? false : 8000,
  })

  const {
    currentRoundMatches,
    nextRoundMatches,
    standings,
    completedCount,
    totalCount,
    currentRound,
    tournament,
  } = data

  return (
    <div className="space-y-3 px-4">
      {/* Progress bar */}
      <RoundProgress
        completed={completedCount}
        total={totalCount}
        currentRound={currentRound}
        totalRounds={tournament.kotbTotalRounds ?? undefined}
      />

      {/* Current round matches */}
      {currentRoundMatches.length > 0 && (
        <section aria-label={`Round ${currentRound} — partite in corso`}>
          <div className="mb-2 flex items-center gap-2 px-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              Round {currentRound} — In corso
            </p>
            {isRefetching && !readOnly && (
              <RefreshCw className="h-3 w-3 animate-spin text-[var(--muted-text)]" aria-label="Aggiornamento..." />
            )}
          </div>
          <div className="space-y-3">
            {currentRoundMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                tournamentId={tournamentId}
                readOnly={readOnly}
              />
            ))}
          </div>
        </section>
      )}

      {currentRoundMatches.length === 0 && !readOnly && (
        <div className="space-y-3">
          <MatchCardSkeleton />
          <MatchCardSkeleton />
        </div>
      )}

      {/* Standings */}
      <section aria-label="Classifica">
        <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
          Classifica
        </p>
        <StandingsTable standings={standings.slice(0, 8)} compact />
      </section>

      {/* Next round preview */}
      {nextRoundMatches.length > 0 && (
        <section aria-label="Prossimo round">
          <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
            Prossimo Round
          </p>
          <div className="space-y-2">
            {nextRoundMatches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                tournamentId={tournamentId}
                readOnly
                preview
              />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
