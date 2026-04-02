"use client"

import { useState, useTransition } from "react"
import { Shuffle, ChevronDown, ChevronUp } from "lucide-react"
import { generateSessionMatches } from "@/actions/sessions"
import { SessionMatchCard } from "./SessionMatchCard"
import { SessionMatchStandings } from "./SessionMatchStandings"

interface MatchPlayer {
  playerId: string
  team: number
  player: { id: string; name: string }
}

interface SessionMatch {
  id: string
  round: number
  matchNumber: number
  teamAScore: number | null
  teamBScore: number | null
  isCompleted: boolean
  players: MatchPlayer[]
}

interface Props {
  sessionId: string
  matches: SessionMatch[]
  isOrganizer: boolean
  sessionStatus: string
}

export function SessionMatchRounds({ sessionId, matches, isOrganizer, sessionStatus }: Props) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Group matches by round
  const rounds = Array.from(
    matches.reduce((acc, m) => {
      const list = acc.get(m.round) ?? []
      list.push(m)
      acc.set(m.round, list)
      return acc
    }, new Map<number, SessionMatch[]>()),
  ).sort(([a], [b]) => a - b)

  // Which round tab is open (default: first incomplete round, else last)
  const firstIncompleteRound = rounds.find(([, ms]) => ms.some((m) => !m.isCompleted))?.[0]
  const [openRound, setOpenRound] = useState<number>(
    firstIncompleteRound ?? rounds[rounds.length - 1]?.[0] ?? 1,
  )

  const canActive = sessionStatus === "OPEN" || sessionStatus === "FULL"

  function handleGenerate() {
    setError(null)
    startTransition(async () => {
      try {
        await generateSessionMatches(sessionId)
      } catch (e) {
        setError(e instanceof Error ? e.message : "Errore nella generazione")
      }
    })
  }

  // Build player name map for standings
  const playerNames: Record<string, string> = {}
  for (const m of matches) {
    for (const p of m.players) playerNames[p.playerId] = p.player.name
  }

  const completedMatches = matches
    .filter((m) => m.isCompleted && m.teamAScore != null && m.teamBScore != null)
    .map((m) => ({
      id: m.id,
      teamAScore: m.teamAScore!,
      teamBScore: m.teamBScore!,
      players: m.players.map((p) => ({ playerId: p.playerId, team: p.team })),
    }))

  // No matches generated yet
  if (matches.length === 0) {
    return (
      <div className="space-y-3">
        <div
          className="flex flex-col items-center gap-3 rounded-2xl p-6 text-center"
          style={{ background: "var(--surface-2)" }}
        >
          <Shuffle className="h-8 w-8 text-[var(--accent)]" />
          <div>
            <p className="font-bold text-white">Nessuna partita generata</p>
            <p className="text-sm text-[var(--muted-text)]">
              Le coppie ruoteranno automaticamente tra i gironi
            </p>
          </div>

          {isOrganizer && canActive && (
            <button
              type="button"
              disabled={pending}
              onClick={handleGenerate}
              className="flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-2xl font-bold text-black disabled:opacity-50"
              style={{ background: "var(--accent)" }}
            >
              {pending ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <><Shuffle className="h-4 w-4" /> Genera partite</>
              )}
            </button>
          )}
        </div>

        {error && (
          <p className="rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--danger)]"
            style={{ background: "rgba(239,68,68,0.12)" }}>
            {error}
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold uppercase tracking-wider text-[var(--accent)]">
          Gironi
        </p>
        {/* Regenerate button (only if no scores yet) */}
        {isOrganizer && canActive && completedMatches.length === 0 && (
          <button
            type="button"
            disabled={pending}
            onClick={handleGenerate}
            className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-bold text-[var(--accent)] disabled:opacity-50"
            style={{ background: "rgba(201,243,29,0.1)" }}
          >
            <Shuffle className="h-3.5 w-3.5" />
            Rigenera
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-xl px-4 py-2.5 text-sm font-medium text-[var(--danger)]"
          style={{ background: "rgba(239,68,68,0.12)" }}>
          {error}
        </p>
      )}

      {/* Round accordions */}
      {rounds.map(([round, roundMatches]) => {
        const allDone = roundMatches.every((m) => m.isCompleted)
        const isOpen = openRound === round
        return (
          <div
            key={round}
            className="overflow-hidden rounded-2xl"
            style={{ background: "var(--surface-2)", border: isOpen ? "1px solid rgba(201,243,29,0.25)" : "1px solid transparent" }}
          >
            <button
              type="button"
              onClick={() => setOpenRound(isOpen ? -1 : round)}
              className="flex w-full items-center gap-3 px-4 py-3"
            >
              <span className="flex-1 text-left text-sm font-bold text-white">
                Girone {round}
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase"
                style={
                  allDone
                    ? { background: "rgba(201,243,29,0.15)", color: "var(--accent)" }
                    : { background: "var(--surface-1)", color: "var(--muted-text)" }
                }
              >
                {allDone ? "Completato" : `${roundMatches.filter((m) => m.isCompleted).length}/${roundMatches.length}`}
              </span>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-[var(--muted-text)]" />
              ) : (
                <ChevronDown className="h-4 w-4 text-[var(--muted-text)]" />
              )}
            </button>

            {isOpen && (
              <div className="space-y-2 px-3 pb-3">
                {roundMatches
                  .sort((a, b) => a.matchNumber - b.matchNumber)
                  .map((m) => (
                    <SessionMatchCard key={m.id} match={m} isOrganizer={isOrganizer && canActive} />
                  ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Live standings */}
      <SessionMatchStandings playerNames={playerNames} completedMatches={completedMatches} />
    </div>
  )
}
