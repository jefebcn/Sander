"use client"

import { useState, useRef, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, RefreshCw } from "lucide-react"
import { getTournamentDashboard } from "@/actions/standings"
import { MatchCard } from "./MatchCard"
import { StandingsTable } from "./StandingsTable"
import { RoundProgress } from "./RoundProgress"
import { cn } from "@/lib/utils"

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

  const { rounds, standings, completedCount, totalCount, currentRound, tournament } = data

  // null = auto-follow currentRound; number = user-selected round
  const [manualRound, setManualRound] = useState<number | null>(null)
  const activeRound = manualRound ?? currentRound ?? rounds[0]?.round ?? null
  const selectedRoundData = rounds.find((r) => r.round === activeRound)

  // Scroll the active tab into view on round change
  const tabsRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!tabsRef.current || activeRound == null) return
    const btn = tabsRef.current.querySelector<HTMLButtonElement>(
      `[data-round="${activeRound}"]`,
    )
    btn?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" })
  }, [activeRound])

  const getRoundLabel = (roundData: (typeof rounds)[number], index: number) => {
    if (rounds.length <= 1) return "Round"
    // For countdown bracket types the rounds array is already sorted highest→lowest
    // so index+1 gives the display label "1st round", "2nd round", etc.
    return `R${index + 1}`
  }

  return (
    <div className="space-y-3 px-4">
      {/* Overall progress */}
      <RoundProgress
        completed={completedCount}
        total={totalCount}
        currentRound={
          rounds.length > 0
            ? rounds.findIndex((r) => r.round === currentRound) + 1 || null
            : null
        }
        totalRounds={rounds.length || (tournament.kotbTotalRounds ?? undefined)}
      />

      {/* Round selector tabs */}
      {rounds.length > 1 && (
        <div
          ref={tabsRef}
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
          role="tablist"
          aria-label="Seleziona round"
        >
          {rounds.map((r, i) => {
            const isActive = r.round === activeRound
            const isDone = r.completedCount === r.totalCount && r.totalCount > 0
            const isCurrent = r.round === currentRound
            return (
              <button
                key={r.round}
                data-round={r.round}
                role="tab"
                aria-selected={isActive}
                onClick={() => setManualRound(r.round === currentRound ? null : r.round)}
                className={cn(
                  "relative shrink-0 rounded-full px-3 py-1.5 text-sm font-bold transition-all duration-150 min-h-[2.25rem]",
                  isActive
                    ? "bg-[var(--accent)] text-black"
                    : isDone
                      ? "bg-[var(--surface-1)] text-[var(--muted-text)]"
                      : isCurrent
                        ? "bg-[var(--surface-3)] text-[var(--foreground)] ring-1 ring-[var(--accent)]/40"
                        : "bg-[var(--surface-2)] text-[var(--foreground)]",
                )}
              >
                {getRoundLabel(r, i)}
                {isDone && !isActive && (
                  <CheckCircle2
                    className="ml-1 inline-block h-3 w-3 align-middle text-[var(--success)]"
                    aria-hidden="true"
                  />
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Selected round matches */}
      {selectedRoundData ? (
        <section aria-label={`Round ${activeRound} — partite`}>
          <div className="mb-2 flex items-center justify-between px-1">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              Round{" "}
              {rounds.length > 1
                ? rounds.findIndex((r) => r.round === activeRound) + 1
                : activeRound}
              {activeRound === currentRound && !readOnly ? " — In corso" : ""}
              {selectedRoundData.completedCount === selectedRoundData.totalCount &&
              selectedRoundData.totalCount > 0
                ? " — Completato"
                : ""}
            </p>
            <div className="flex items-center gap-2">
              {isRefetching && !readOnly && (
                <RefreshCw
                  className="h-3 w-3 animate-spin text-[var(--muted-text)]"
                  aria-label="Aggiornamento..."
                />
              )}
              <span className="text-xs text-[var(--muted-text)]">
                {selectedRoundData.completedCount}/{selectedRoundData.totalCount}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {selectedRoundData.matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                tournamentId={tournamentId}
                readOnly={readOnly}
              />
            ))}
          </div>
        </section>
      ) : (
        !readOnly && (
          <div className="rounded-2xl bg-[var(--surface-1)] p-6 text-center">
            <p className="text-sm text-[var(--muted-text)]">Nessuna partita in corso</p>
          </div>
        )
      )}

      {/* Standings */}
      <section aria-label="Classifica">
        <p className="mb-2 px-1 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
          Classifica
        </p>
        <StandingsTable standings={standings.slice(0, 8)} compact />
      </section>
    </div>
  )
}
