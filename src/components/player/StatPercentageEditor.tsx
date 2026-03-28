"use client"

import { useState } from "react"
import { updateStatPercentages } from "@/actions/players"

type StatKey = "attPct" | "difPct" | "murPct" | "alzPct" | "ricPct" | "staPct"

const STATS: { key: StatKey; label: string; desc: string }[] = [
  { key: "attPct", label: "ATT", desc: "Attacco" },
  { key: "difPct", label: "DIF", desc: "Difesa" },
  { key: "murPct", label: "MUR", desc: "Muro" },
  { key: "alzPct", label: "ALZ", desc: "Alzata" },
  { key: "ricPct", label: "RIC", desc: "Ricezione" },
  { key: "staPct", label: "STA", desc: "Stamina" },
]

interface Props {
  initial: Record<StatKey, number>
  glickoRating: number
}

export function StatPercentageEditor({ initial, glickoRating }: Props) {
  const [values, setValues] = useState<Record<StatKey, number>>(initial)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = Object.values(values).reduce((s, v) => s + v, 0)
  const remaining = 100 - total
  const isValid = total === 100

  function handleChange(key: StatKey, raw: string) {
    const n = Math.max(0, Math.min(100, parseInt(raw) || 0))
    setValues((prev) => ({ ...prev, [key]: n }))
    setSaved(false)
    setError(null)
  }

  async function handleSave() {
    if (!isValid) return
    setLoading(true)
    setError(null)
    try {
      await updateStatPercentages(values)
      setSaved(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl bg-[var(--surface-1)] p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
          Distribuzione statistiche
        </p>
        <span
          className="text-xs font-bold"
          style={{ color: isValid ? "var(--live)" : total > 100 ? "var(--danger)" : "var(--muted-text)" }}
        >
          {total}/100
          {!isValid && remaining !== 0 && (
            <span className="ml-1">
              ({remaining > 0 ? `+${remaining}` : remaining} da distribuire)
            </span>
          )}
        </span>
      </div>

      <div className="space-y-3">
        {STATS.map(({ key, label, desc }) => {
          const val = values[key]
          const statVal = Math.round(glickoRating / 40 + val)
          return (
            <div key={key} className="flex items-center gap-3">
              {/* Stat label */}
              <div className="w-12 shrink-0">
                <p className="text-xs font-black text-white">{label}</p>
                <p className="text-[0.6rem] text-[var(--muted-text)]">{desc}</p>
              </div>

              {/* Slider */}
              <input
                type="range"
                min={0}
                max={100}
                value={val}
                onChange={(e) => handleChange(key, e.target.value)}
                className="flex-1 accent-[var(--accent)] h-1.5"
              />

              {/* Numeric input */}
              <input
                type="number"
                min={0}
                max={100}
                value={val}
                onChange={(e) => handleChange(key, e.target.value)}
                className="w-12 rounded-lg bg-[var(--surface-2)] text-center text-sm font-bold text-white outline-none focus:ring-1 focus:ring-[var(--accent)] py-1"
              />

              {/* Computed value */}
              <span className="w-14 text-right text-sm font-black text-[var(--accent)]">
                {statVal}
              </span>
            </div>
          )
        })}
      </div>

      <p className="text-xs text-[var(--muted-text)]">
        Valore = Glicko-2 ÷ 40 + %. Con {Math.round(glickoRating)} GLK e 0%: base {Math.round(glickoRating / 40)}. Le percentuali devono sommare a 100.
      </p>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <button
        onClick={handleSave}
        disabled={!isValid || loading}
        className="flex min-h-[3rem] w-full items-center justify-center rounded-xl font-bold text-sm text-black disabled:opacity-40"
        style={{ background: "var(--accent)" }}
      >
        {loading ? "..." : saved ? "Salvato ✓" : "Salva distribuzione"}
      </button>
    </div>
  )
}
