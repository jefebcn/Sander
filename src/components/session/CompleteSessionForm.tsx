"use client"

import { useState } from "react"
import { Plus, Trash2, CheckCircle } from "lucide-react"
import { completeSession } from "@/actions/sessions"

interface Participant {
  id: string
  player: { id: string; name: string }
  team: number | null
}

interface Props {
  sessionId: string
  participants: Participant[]
}

interface SetScore {
  teamAScore: string
  teamBScore: string
}

export function CompleteSessionForm({ sessionId, participants }: Props) {
  const [step, setStep] = useState<"teams" | "scores">("teams")
  const [sets, setSets] = useState<SetScore[]>([{ teamAScore: "", teamBScore: "" }])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const teamA = participants.filter((p) => p.team === 0)
  const teamB = participants.filter((p) => p.team === 1)
  const unassigned = participants.filter((p) => p.team === null)

  async function handleComplete(withScores: boolean) {
    setLoading(true)
    setError(null)
    try {
      let parsedSets: { teamAScore: number; teamBScore: number }[] | undefined
      if (withScores) {
        parsedSets = sets
          .filter((s) => s.teamAScore !== "" && s.teamBScore !== "")
          .map((s) => ({ teamAScore: parseInt(s.teamAScore), teamBScore: parseInt(s.teamBScore) }))
        if (parsedSets.length === 0) {
          setError("Inserisci almeno un punteggio")
          setLoading(false)
          return
        }
      }
      await completeSession(sessionId, parsedSets)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore")
      setLoading(false)
    }
  }

  function addSet() {
    setSets((prev) => [...prev, { teamAScore: "", teamBScore: "" }])
  }

  function removeSet(i: number) {
    setSets((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateSet(i: number, field: "teamAScore" | "teamBScore", value: string) {
    setSets((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
  }

  // Step 1 — team summary
  if (step === "teams") {
    return (
      <div className="space-y-3 rounded-2xl bg-[var(--surface-1)] p-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
          Completa partita
        </p>

        {unassigned.length > 0 && (
          <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444" }}>
            ⚠ {unassigned.length} giocator{unassigned.length > 1 ? "i" : "e"} senza squadra assegnata —
            i punteggi non aggiorneranno le statistiche.
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[var(--surface-2)] p-3">
            <p className="mb-2 text-xs font-bold text-[var(--accent)]">Team A</p>
            {teamA.length === 0
              ? <p className="text-xs text-[var(--muted-text)]">Nessuno</p>
              : teamA.map((p) => (
                <p key={p.id} className="text-sm text-white truncate">{p.player.name}</p>
              ))}
          </div>
          <div className="rounded-xl bg-[var(--surface-2)] p-3">
            <p className="mb-2 text-xs font-bold text-[var(--muted-text)]">Team B</p>
            {teamB.length === 0
              ? <p className="text-xs text-[var(--muted-text)]">Nessuno</p>
              : teamB.map((p) => (
                <p key={p.id} className="text-sm text-white truncate">{p.player.name}</p>
              ))}
          </div>
        </div>

        <button
          onClick={() => setStep("scores")}
          className="flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl font-bold text-sm text-black"
          style={{ background: "var(--accent)" }}
        >
          Inserisci punteggio →
        </button>
        <button
          onClick={() => handleComplete(false)}
          disabled={loading}
          className="flex min-h-[2.5rem] w-full items-center justify-center rounded-xl text-sm font-semibold text-[var(--muted-text)]"
          style={{ background: "var(--surface-2)" }}
        >
          {loading ? "..." : "Completa senza punteggio"}
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  }

  // Step 2 — score entry
  return (
    <div className="space-y-3 rounded-2xl bg-[var(--surface-1)] p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
        Punteggio set
      </p>

      {/* Header */}
      <div className="grid grid-cols-[1fr_2.5rem_2.5rem_2rem] gap-2 px-1">
        <p className="text-xs text-[var(--muted-text)]"></p>
        <p className="text-center text-xs font-bold text-[var(--accent)]">A</p>
        <p className="text-center text-xs font-bold text-[var(--muted-text)]">B</p>
        <p></p>
      </div>

      {sets.map((s, i) => (
        <div key={i} className="grid grid-cols-[1fr_2.5rem_2.5rem_2rem] items-center gap-2">
          <p className="text-sm text-[var(--muted-text)]">Set {i + 1}</p>
          <input
            type="number"
            min={0}
            max={99}
            value={s.teamAScore}
            onChange={(e) => updateSet(i, "teamAScore", e.target.value)}
            className="h-10 w-full rounded-lg bg-[var(--surface-2)] text-center text-base font-bold text-white outline-none focus:ring-1 focus:ring-[var(--accent)]"
            placeholder="–"
          />
          <input
            type="number"
            min={0}
            max={99}
            value={s.teamBScore}
            onChange={(e) => updateSet(i, "teamBScore", e.target.value)}
            className="h-10 w-full rounded-lg bg-[var(--surface-2)] text-center text-base font-bold text-white outline-none focus:ring-1 focus:ring-[var(--accent)]"
            placeholder="–"
          />
          {sets.length > 1 ? (
            <button onClick={() => removeSet(i)} className="flex items-center justify-center text-[var(--muted-text)]">
              <Trash2 className="h-4 w-4" />
            </button>
          ) : <div />}
        </div>
      ))}

      <button
        onClick={addSet}
        className="flex items-center gap-1 text-xs text-[var(--muted-text)]"
      >
        <Plus className="h-3.5 w-3.5" /> Aggiungi set
      </button>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={() => handleComplete(true)}
        disabled={loading}
        className="flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl font-bold text-sm text-black"
        style={{ background: "var(--accent)" }}
      >
        <CheckCircle className="h-4 w-4" />
        {loading ? "..." : "Conferma e completa"}
      </button>
      <button
        onClick={() => setStep("teams")}
        className="w-full text-center text-xs text-[var(--muted-text)]"
      >
        ← Torna indietro
      </button>
    </div>
  )
}
