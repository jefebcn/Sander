"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { RotateCcw, Undo2, Trophy, X, Loader2, Save, AlertCircle, Cloud } from "lucide-react"
import { completeSession, saveLiveScore, getLiveScore } from "@/actions/sessions"

/* Courtside live scoreboard — beach volley rules, big touch targets.
   Standalone by default; in "session mode" it saves the final result through
   the existing completeSession pipeline (ratings, season, feed all update).

   Session mode also persists the in-progress board (auto-save), so you can
   close the app mid-match and resume, and a second device viewing the same
   session stays in sync (light polling). The active scorer always wins: a
   remote update is only applied when this device has been idle for a moment. */

type Team = 0 | 1
interface HistoryEntry {
  team: Team
}

interface LiveState {
  names: [string, string]
  bestOf: 1 | 3
  showSetup: boolean
  scores: [number, number]
  setsWon: [number, number]
  setIndex: number
  history: HistoryEntry[]
  setResults: [number, number][]
  matchWinner: Team | null
}

interface Props {
  /** When set, finishing the match saves the result to this session. */
  session?: { id: string }
  initialNames?: [string, string]
  /** Persisted in-progress board to resume from (session mode). */
  initialState?: LiveState | null
}

const TEAM_COLORS = ["#c9f31d", "#3b82f6"] as const
const SAVE_DEBOUNCE_MS = 600
const POLL_MS = 3500
const IDLE_BEFORE_SYNC_MS = 4000

function setTarget(setIndex: number, bestOf: number): number {
  return bestOf === 3 && setIndex === 2 ? 15 : 21
}

export function LiveScoreboard({ session, initialNames, initialState }: Props) {
  const router = useRouter()
  const sessionMode = Boolean(session)
  const hs = initialState ?? null

  const [names, setNames] = useState<[string, string]>(hs?.names ?? initialNames ?? ["Squadra A", "Squadra B"])
  const [bestOf, setBestOf] = useState<1 | 3>(hs?.bestOf ?? 3)
  const [showSetup, setShowSetup] = useState(hs ? hs.showSetup : true)

  const [scores, setScores] = useState<[number, number]>(hs?.scores ?? [0, 0])
  const [setsWon, setSetsWon] = useState<[number, number]>(hs?.setsWon ?? [0, 0])
  const [setIndex, setSetIndex] = useState(hs?.setIndex ?? 0)
  const [history, setHistory] = useState<HistoryEntry[]>(hs?.history ?? [])
  const [setResults, setSetResults] = useState<[number, number][]>(hs?.setResults ?? [])
  const [matchWinner, setMatchWinner] = useState<Team | null>(hs?.matchWinner ?? null)

  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [synced, setSynced] = useState(false)

  // Timestamp of the last local interaction — used to let the active scorer win.
  const lastEditRef = useRef<number>(0)
  // Serialised snapshot last written/seen, to skip no-op saves and sync loops.
  const lastSyncedRef = useRef<string>(hs ? JSON.stringify(hs) : "")

  const target = setTarget(setIndex, bestOf)
  const setsToWin = bestOf === 3 ? 2 : 1

  const markEdit = () => {
    lastEditRef.current = Date.now()
  }

  function point(team: Team) {
    if (matchWinner !== null) return
    markEdit()
    const next: [number, number] = [scores[0], scores[1]]
    next[team] += 1
    setHistory((h) => [...h, { team }])

    const lead = Math.abs(next[0] - next[1])
    const reached = next[team] >= target && lead >= 2

    if (reached) {
      setSetResults((r) => [...r, next])
      const newSets: [number, number] = [setsWon[0], setsWon[1]]
      newSets[team] += 1
      setSetsWon(newSets)
      if (newSets[team] >= setsToWin) {
        setScores(next)
        setMatchWinner(team)
        return
      }
      setScores([0, 0])
      setSetIndex((i) => i + 1)
      setHistory([])
      return
    }
    setScores(next)
  }

  function undo() {
    if (history.length === 0 || matchWinner !== null) return
    markEdit()
    const last = history[history.length - 1]
    const next: [number, number] = [scores[0], scores[1]]
    next[last.team] = Math.max(0, next[last.team] - 1)
    setScores(next)
    setHistory((h) => h.slice(0, -1))
  }

  function resetMatch() {
    markEdit()
    setScores([0, 0])
    setSetsWon([0, 0])
    setSetIndex(0)
    setHistory([])
    setSetResults([])
    setMatchWinner(null)
    setSaveError(null)
    setShowSetup(true)
  }

  // Apply a remote snapshot to local state (used by polling sync).
  const applyState = useCallback((s: LiveState) => {
    setNames(s.names)
    setBestOf(s.bestOf)
    setShowSetup(s.showSetup)
    setScores(s.scores)
    setSetsWon(s.setsWon)
    setSetIndex(s.setIndex)
    setHistory(s.history)
    setSetResults(s.setResults)
    setMatchWinner(s.matchWinner)
  }, [])

  // ── Auto-save (debounced) ──────────────────────────────────────────────
  useEffect(() => {
    if (!sessionMode || !session) return
    const snapshot: LiveState = {
      names, bestOf, showSetup, scores, setsWon, setIndex, history, setResults, matchWinner,
    }
    const serialised = JSON.stringify(snapshot)
    if (serialised === lastSyncedRef.current) return
    const t = setTimeout(async () => {
      try {
        setSaving(true)
        await saveLiveScore(session.id, snapshot)
        lastSyncedRef.current = serialised
        setSynced(true)
      } catch {
        /* transient — next change retries */
      } finally {
        setSaving(false)
      }
    }, SAVE_DEBOUNCE_MS)
    return () => clearTimeout(t)
  }, [sessionMode, session, names, bestOf, showSetup, scores, setsWon, setIndex, history, setResults, matchWinner])

  // ── Polling sync (second device) ───────────────────────────────────────
  useEffect(() => {
    if (!sessionMode || !session) return
    const id = setInterval(async () => {
      // Don't stomp on the person actively tapping.
      if (Date.now() - lastEditRef.current < IDLE_BEFORE_SYNC_MS) return
      try {
        const remote = (await getLiveScore(session.id)) as LiveState | null
        if (!remote) return
        const serialised = JSON.stringify(remote)
        if (serialised === lastSyncedRef.current) return
        lastSyncedRef.current = serialised
        applyState(remote)
      } catch {
        /* ignore transient poll errors */
      }
    }, POLL_MS)
    return () => clearInterval(id)
  }, [sessionMode, session, applyState])

  async function saveResult() {
    if (!session) return
    setSaving(true)
    setSaveError(null)
    try {
      await completeSession(
        session.id,
        setResults.map(([a, b]) => ({ teamAScore: a, teamBScore: b })),
      )
      router.push(`/sessions/${session.id}`)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Errore nel salvataggio")
      setSaving(false)
    }
  }

  // ── Setup screen ──────────────────────────────────────────────────────
  if (showSetup) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6">
        <div className="text-center">
          <h1 className="text-3xl font-black text-white">Segna dal vivo</h1>
          <p className="mt-1 text-sm text-[var(--muted-text)]">
            {sessionMode
              ? "A fine partita salvi il risultato: rating e classifiche si aggiornano da soli."
              : "Tabellone da campo. Tocca il lato di una squadra per il punto."}
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
                readOnly={sessionMode}
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
          onClick={() => {
            markEdit()
            setShowSetup(false)
          }}
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
          {sessionMode && (
            <span title={synced ? "Salvato" : "Salvataggio…"} className="flex items-center">
              {saving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Cloud className="h-3.5 w-3.5" style={{ color: synced ? "var(--accent)" : undefined }} />
              )}
            </span>
          )}
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
          style={{ background: "rgba(0,0,0,0.9)", backdropFilter: "blur(6px)" }}
        >
          {!saving && (
            <button onClick={resetMatch} className="absolute right-5 top-5 text-[var(--muted-text)]">
              <X className="h-6 w-6" />
            </button>
          )}
          <Trophy className="h-16 w-16" style={{ color: TEAM_COLORS[matchWinner] }} />
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[var(--muted-text)]">Vince</p>
            <p className="text-4xl font-black" style={{ color: TEAM_COLORS[matchWinner] }}>
              {names[matchWinner]}
            </p>
            <p className="mt-2 text-lg font-bold text-white">
              {setResults.map(([a, b], i) => (
                <span key={i} className="mx-1 tabular-nums">
                  {a}-{b}
                </span>
              ))}
            </p>
          </div>

          {sessionMode ? (
            <div className="w-full max-w-xs space-y-2">
              <button
                onClick={saveResult}
                disabled={saving}
                className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl text-lg font-black text-black disabled:opacity-60"
                style={{ background: "var(--accent)" }}
              >
                {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                {saving ? "Salvataggio…" : "Salva risultato"}
              </button>
              {saveError && (
                <p className="flex items-center justify-center gap-1.5 text-sm font-bold text-red-400">
                  <AlertCircle className="h-4 w-4" /> {saveError}
                </p>
              )}
              {!saving && (
                <button onClick={resetMatch} className="w-full py-2 text-sm font-bold text-[var(--muted-text)]">
                  Ricomincia
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={resetMatch}
              className="min-h-[3.5rem] w-full max-w-xs rounded-2xl text-lg font-black text-black"
              style={{ background: "var(--accent)" }}
            >
              Nuova partita
            </button>
          )}
        </div>
      )}
    </div>
  )
}
