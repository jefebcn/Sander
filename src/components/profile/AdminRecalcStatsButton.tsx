"use client"

import { useState } from "react"
import { adminRecalculateAllStats } from "@/actions/tournaments"

export function AdminRecalcStatsButton() {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleRecalc() {
    setLoading(true)
    try {
      await adminRecalculateAllStats()
      setDone(true)
    } catch {
      setLoading(false)
      setConfirm(false)
    }
  }

  if (done) {
    return (
      <div
        className="flex min-h-[3.5rem] w-full items-center justify-center rounded-2xl text-sm font-bold"
        style={{ background: "rgba(34,197,94,0.15)", color: "#22c55e" }}
      >
        Statistiche ricalcolate ✓
      </div>
    )
  }

  if (loading) {
    return (
      <div
        className="flex min-h-[3.5rem] w-full items-center justify-center rounded-2xl text-sm font-bold text-[var(--muted-text)]"
        style={{ background: "var(--surface-2)" }}
      >
        Ricalcolo in corso...
      </div>
    )
  }

  if (confirm) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleRecalc}
          className="flex-1 min-h-[3.5rem] rounded-2xl text-sm font-black text-white"
          style={{ background: "#ef4444" }}
        >
          Sì, resetta tutto
        </button>
        <button
          onClick={() => setConfirm(false)}
          className="flex-1 min-h-[3.5rem] rounded-2xl text-sm font-bold text-[var(--foreground)]"
          style={{ background: "var(--surface-2)" }}
        >
          Annulla
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="flex min-h-[3.5rem] w-full items-center justify-center rounded-2xl text-sm font-bold"
      style={{ background: "rgba(239,68,68,0.12)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.25)" }}
    >
      Ricalcola tutte le statistiche dal 0
    </button>
  )
}
