"use client"

import { useState } from "react"
import { RotateCcw, Undo2, Trophy, X } from "lucide-react"

/* Courtside live scoreboard — beach volley rules, zero backend. Big touch
   targets so it's usable one-handed on the sand. */

type Team = 0 | 1
interface HistoryEntry {
  team: Team
}

const TEAM_COLORS = ["#c9f31d", "#3b82f6"] as const

function setTarget(setIndex: number, bestOf: number): number {
  // Deciding set (3rd of a best-of-3) is shorter.
  return bestOf === 3 && setIndex === 2 ? 15 : 21
}

export function LiveScoreboard() {
  const [names, setNames] = useState<[string, string]>(["Squadra A", "Squadra B"])
  const [bestOf, setBestOf] = useState<1 | 3>(3)
  const [showSetup, setShowSetup] = useState(true)

  const [scores, setScores] = useState<[number, number]>([0, 0])
  const [setsWon, setSetsWon] = useState<[number, number]>([0, 0])
  const [setIndex, setSetIndex] = useState(0)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [matchWinner, setMatchWinner] = useState<Team | null>(null)

  const target = setTarget(setIndex, bestOf)
  const setsToWin = bestOf === 3 ? 2 : 1

  function point(team: Team) {
    if (matchWinner !== null) return
    const next: [number, number] = [scores[0], scores[1]]
    next[team] += 1
    setHistory((h) => [...h, { team }])

    const [a, b] = next
    const lead = Math.abs(a - b)
    const winner = team
    const reached = next[team] >= target && lead >= 2

    if (reached) {
      const newSets: [number, number] = [setsWon[0], setsWon[1]]
      newSets[winner] += 1
      setSetsWon(newSets)
      if (newSets[winner] >= setsToWin) {
        setScores(next)
        setMatchWinner(winner)
        return
      }
      // Next set
      setScores([0, 0])
      setSetIndex((i) => i + 1)
      setHistory([])
      return
    }
    setScores(next)
  }

  function undo() {
    if (history.length === 0 || matchWinner !== null) return
    const last = history[history.length - 1]
    const next: [number, number] = [scores[0], scores[1]]
    next[last.team] = Math.max(0, next[last.team] - 1)
    setScores(next)
    setHistory((h) => h.slice(0, -1))
  }

  function resetMatch() {
    setScores([0, 0])
    setSetsWon([0, 0])
    setSetIndex(0)
    setHistory([])
    setMatchWinner(null)
    setShowSetup(true)
  }

  // ── Setup screen ──────────────────────────────────────────────────────
  if (showSetup) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6">
        <div className="text-center">
          <h1 className="text-3xl font-black text-white">Segna dal vivo</h1>
          <p className="mt-1 text-sm text-[var(--muted-text)]">
            Tabellone da campo. Tocca il lato di una squadra per il punto.
          </p>
        </div>

        <div className="space-y-3">
          {[0, 1].map((t) => (
            <div key={t} className="flex items-center gap-3">
              <span
                className="h-4 w-4 shrink-0 rounded-full"
                style={{ background: TEAM_COLORS[t] }}
              />
              <input
                value={names[t]}
                onChange={(e) =>
                  setNames((n) => (t === 0 ? [e.target.value, n[1]] : [n[0], e.target.value]))
                }
                className="w-full rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          ))}
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
            Formato
          </p>
          <div className="flex gap-2">
            {([1, 3] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBestOf(b)}
                className="flex-1 rounded-2xl py-3 text-sm font-black transition-colors"
                style={
                  bestOf === b
                    ? { background: "var(--accent)", color: "#000" }
                    : { background: "var(--surface-2)", color: "var(--muted-text)" }
                }
              >
                {b === 1 ? "Set unico (21)" : "Al meglio dei 3"}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowSetup(false)}
          className="min-h-[3.5rem] w-full rounded-2xl text-lg font-black text-black"
          style={{ background: "var(--accent)" }}
        >
          Inizia
        </button>
      </div>
    )
  }

  // ── Scoreboard ────────────────────────────────────────────────────────
  return (
    <div className="relative flex min-h-dvh flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={resetMatch} className="flex items-center gap-1.5 text-sm font-bold text-[var(--muted-text)]">
          <RotateCcw className="h-4 w-4" /> Nuovo
        </button>
        <div className="flex items-center gap-2 text-xs font-bold text-[var(--muted-text)]">
          {bestOf === 3 ? `Set ${setIndex + 1} · a ${target}` : `A ${target}`}
        </div>
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="flex items-center gap-1.5 text-sm font-bold text-[var(--muted-text)] disabled:opacity-30"
        >
          <Undo2 className="h-4 w-4" /> Annulla
        </button>
      </div>

      {/* Two team halves */}
      <div className="grid flex-1 grid-rows-2 gap-2 px-2 pb-2">
        {[0, 1].map((t) => {
          const team = t as Team
          return (
            <button
              key={t}
              onClick={() => point(team)}
              className="relative flex flex-col items-center justify-center rounded-3xl transition-transform active:scale-[0.99]"
              style={{
                background: `linear-gradient(160deg, ${TEAM_COLORS[t]}1f, ${TEAM_COLORS[t]}0a)`,
                border: `1px solid ${TEAM_COLORS[t]}40`,
              }}
            >
              {/* sets pips */}
              <div className="absolute top-4 flex gap-1.5">
                {Array.from({ length: setsToWin }).map((_, i) => (
                  <span
                    key={i}
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      background: i < setsWon[t] ? TEAM_COLORS[t] : "rgba(255,255,255,0.15)",
                    }}
                  />
                ))}
              </div>

              <span
                className="text-[9rem] font-black leading-none tabular-nums"
                style={{ color: TEAM_COLORS[t] }}
              >
                {scores[t]}
              </span>
              <span className="mt-2 max-w-[80%] truncate text-lg font-bold text-white">
                {names[t]}
              </span>
              <span className="mt-1 text-xs font-bold uppercase tracking-widest text-[var(--muted-text)]">
                Tocca per +1
              </span>
            </button>
          )
        })}
      </div>

      {/* Match winner overlay */}
      {matchWinner !== null && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-6 px-8 text-center"
          style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(6px)" }}
        >
          <button onClick={resetMatch} className="absolute right-5 top-5 text-[var(--muted-text)]">
            <X className="h-6 w-6" />
          </button>
          <Trophy className="h-16 w-16" style={{ color: TEAM_COLORS[matchWinner] }} />
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[var(--muted-text)]">
              Vince
            </p>
            <p className="text-4xl font-black" style={{ color: TEAM_COLORS[matchWinner] }}>
              {names[matchWinner]}
            </p>
            <p className="mt-2 text-lg font-bold text-white">
              {setsWon[0]} – {setsWon[1]}
            </p>
          </div>
          <button
            onClick={resetMatch}
            className="min-h-[3.5rem] w-full max-w-xs rounded-2xl text-lg font-black text-black"
            style={{ background: "var(--accent)" }}
          >
            Nuova partita
          </button>
        </div>
      )}
    </div>
  )
}
