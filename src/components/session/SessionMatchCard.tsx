"use client"

import { useState, useTransition } from "react"
import { Minus, Plus, Check } from "lucide-react"
import { submitSessionMatchScore } from "@/actions/sessions"

interface MatchPlayer {
  playerId: string
  team: number
  player: { id: string; name: string }
}

interface Props {
  match: {
    id: string
    round: number
    matchNumber: number
    teamAScore: number | null
    teamBScore: number | null
    isCompleted: boolean
    players: MatchPlayer[]
  }
  isOrganizer: boolean
}

function teamNames(players: MatchPlayer[], team: number) {
  return players
    .filter((p) => p.team === team)
    .map((p) => p.player.name.split(" ")[0])
    .join(" & ")
}

export function SessionMatchCard({ match, isOrganizer }: Props) {
  const [scoreA, setScoreA] = useState(match.teamAScore ?? 0)
  const [scoreB, setScoreB] = useState(match.teamBScore ?? 0)
  const [pending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(match.isCompleted)

  const nameA = teamNames(match.players, 0)
  const nameB = teamNames(match.players, 1)

  const aWon = submitted && (match.teamAScore ?? scoreA) > (match.teamBScore ?? scoreB)
  const bWon = submitted && (match.teamBScore ?? scoreB) > (match.teamAScore ?? scoreA)

  function handleSubmit() {
    startTransition(async () => {
      await submitSessionMatchScore({ matchId: match.id, teamAScore: scoreA, teamBScore: scoreB })
      setSubmitted(true)
    })
  }

  return (
    <div
      className="rounded-2xl p-3"
      style={{ background: "var(--surface-2)" }}
    >
      <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-wider text-[var(--muted-text)]">
        Partita {match.matchNumber}
      </p>

      <div className="flex items-center gap-2">
        {/* Team A */}
        <p className={`flex-1 truncate text-sm font-bold ${aWon ? "text-[var(--accent)]" : "text-white"}`}>
          {nameA}
        </p>

        {/* Scores */}
        <div className="flex items-center gap-1">
          {submitted ? (
            <>
              <span className={`min-w-[2rem] text-center text-lg font-black ${aWon ? "text-[var(--accent)]" : "text-[var(--muted-text)]"}`}>
                {match.teamAScore ?? scoreA}
              </span>
              <span className="text-[var(--muted-text)]">—</span>
              <span className={`min-w-[2rem] text-center text-lg font-black ${bWon ? "text-[var(--accent)]" : "text-[var(--muted-text)]"}`}>
                {match.teamBScore ?? scoreB}
              </span>
            </>
          ) : isOrganizer ? (
            <>
              {/* Score A controls */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setScoreA((v) => Math.max(0, v - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted-text)]"
                  style={{ background: "var(--surface-1)" }}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[2rem] text-center text-lg font-black text-white">{scoreA}</span>
                <button
                  type="button"
                  onClick={() => setScoreA((v) => v + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted-text)]"
                  style={{ background: "var(--surface-1)" }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <span className="text-[var(--muted-text)]">—</span>

              {/* Score B controls */}
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setScoreB((v) => Math.max(0, v - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted-text)]"
                  style={{ background: "var(--surface-1)" }}
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="min-w-[2rem] text-center text-lg font-black text-white">{scoreB}</span>
                <button
                  type="button"
                  onClick={() => setScoreB((v) => v + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--muted-text)]"
                  style={{ background: "var(--surface-1)" }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          ) : (
            <span className="px-2 text-sm text-[var(--muted-text)]">–</span>
          )}
        </div>

        {/* Team B */}
        <p className={`flex-1 truncate text-right text-sm font-bold ${bWon ? "text-[var(--accent)]" : "text-white"}`}>
          {nameB}
        </p>
      </div>

      {/* Confirm button */}
      {!submitted && isOrganizer && (
        <button
          type="button"
          disabled={pending}
          onClick={handleSubmit}
          className="mt-2 flex min-h-[2.5rem] w-full items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-black disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {pending ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black border-t-transparent" />
          ) : (
            <><Check className="h-3.5 w-3.5" /> Conferma risultato</>
          )}
        </button>
      )}
    </div>
  )
}
