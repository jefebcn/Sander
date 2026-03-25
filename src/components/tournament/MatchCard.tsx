"use client"

import { useState, useTransition } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { CheckCircle2 } from "lucide-react"
import { submitScore } from "@/actions/matches"
import { cn } from "@/lib/utils"
import type { Match, MatchPlayer, Player } from "@/generated/prisma/client"

type MatchWithPlayers = Match & {
  players: (MatchPlayer & { player: Player })[]
}

interface MatchCardProps {
  match: MatchWithPlayers
  tournamentId: string
  readOnly?: boolean
  preview?: boolean
}

export function MatchCard({ match, tournamentId, readOnly, preview }: MatchCardProps) {
  const qc = useQueryClient()
  const [isPending, startTransition] = useTransition()
  const [scoreA, setScoreA] = useState(match.teamAScore ?? 0)
  const [scoreB, setScoreB] = useState(match.teamBScore ?? 0)

  const teamA = match.players.filter((p) => p.team === 0).map((p) => p.player)
  const teamB = match.players.filter((p) => p.team === 1).map((p) => p.player)

  function handleSubmit() {
    startTransition(async () => {
      await submitScore({ matchId: match.id, teamAScore: scoreA, teamBScore: scoreB })
      qc.invalidateQueries({ queryKey: ["dashboard", tournamentId] })
    })
  }

  const isCompleted = match.isCompleted
  const canEdit = !readOnly && !isCompleted && !preview

  return (
    <div
      className={cn(
        "rounded-2xl p-4",
        isCompleted
          ? "bg-[var(--surface-1)] opacity-70"
          : preview
            ? "bg-[var(--surface-1)] opacity-60"
            : "bg-[var(--surface-2)] ring-1 ring-[var(--accent)]/30",
      )}
    >
      {/* Match label */}
      {match.courtLabel && (
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
          {match.courtLabel}
        </p>
      )}

      <div className="flex items-center gap-3">
        {/* Team A */}
        <div className="flex-1 text-right">
          {teamA.map((p) => (
            <p key={p.id} className="font-semibold leading-tight text-[var(--foreground)]">
              {p.name}
            </p>
          ))}
          {teamA.length === 0 && (
            <p className="text-sm text-[var(--muted-text)]">TBD</p>
          )}
        </div>

        {/* Score or VS */}
        <div className="flex shrink-0 items-center gap-2">
          {canEdit ? (
            <>
              <ScoreInput value={scoreA} onChange={setScoreA} />
              <span className="text-[var(--muted-text)]">–</span>
              <ScoreInput value={scoreB} onChange={setScoreB} />
            </>
          ) : (
            <div className="flex items-center gap-2">
              {isCompleted ? (
                <>
                  <span
                    className={cn(
                      "text-2xl font-black",
                      (match.teamAScore ?? 0) > (match.teamBScore ?? 0)
                        ? "text-[var(--accent)]"
                        : "text-[var(--muted-text)]",
                    )}
                  >
                    {match.teamAScore}
                  </span>
                  <span className="text-[var(--muted-text)]">–</span>
                  <span
                    className={cn(
                      "text-2xl font-black",
                      (match.teamBScore ?? 0) > (match.teamAScore ?? 0)
                        ? "text-[var(--accent)]"
                        : "text-[var(--muted-text)]",
                    )}
                  >
                    {match.teamBScore}
                  </span>
                </>
              ) : (
                <span className="text-lg font-bold text-[var(--muted-text)]">vs</span>
              )}
            </div>
          )}
        </div>

        {/* Team B */}
        <div className="flex-1">
          {teamB.map((p) => (
            <p key={p.id} className="font-semibold leading-tight text-[var(--foreground)]">
              {p.name}
            </p>
          ))}
          {teamB.length === 0 && (
            <p className="text-sm text-[var(--muted-text)]">TBD</p>
          )}
        </div>
      </div>

      {/* Confirm button */}
      {canEdit && (
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="mt-4 flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-xl bg-[var(--accent)] font-bold text-black disabled:opacity-50"
        >
          {isPending ? (
            "Salvataggio..."
          ) : (
            <>
              <CheckCircle2 className="h-5 w-5" />
              Conferma Risultato
            </>
          )}
        </button>
      )}
    </div>
  )
}

function ScoreInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(Math.min(99, value + 1))}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface-3)] text-xl font-bold leading-none"
      >
        +
      </button>
      <span className="w-10 text-center text-2xl font-black tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(Math.max(0, value - 1))}
        className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--surface-3)] text-xl font-bold leading-none"
      >
        −
      </button>
    </div>
  )
}
