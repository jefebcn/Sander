"use client"

import { useState, useTransition } from "react"
import { Check, Loader2 } from "lucide-react"
import { updateTournamentMeta } from "@/actions/tournaments"

interface Props {
  tournamentId: string
  currentCents: number | null
}

export function AdminSpectatorPriceForm({ tournamentId, currentCents }: Props) {
  const [value, setValue] = useState(currentCents ? (currentCents / 100).toFixed(2) : "")
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSave() {
    const val = value.trim()
    const euros = val === "" ? null : Number(val.replace(",", "."))
    const cents = euros === null || isNaN(euros) || euros < 0 ? null : Math.round(euros * 100)
    startTransition(async () => {
      await updateTournamentMeta(tournamentId, { spectatorPriceCents: cents })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  return (
    <div className="mb-3 space-y-1">
      <label className="text-xs font-semibold text-[var(--muted-text)]">🍺 Quota Bevitori (€)</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => { setValue(e.target.value); setSaved(false) }}
          placeholder="vuoto = gratis"
          className="flex-1 rounded-xl bg-[var(--surface-3)] px-3 py-2.5 text-sm text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className={`shrink-0 flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
            saved
              ? "bg-[var(--live)] text-black"
              : "bg-[var(--surface-3)] text-white hover:bg-[var(--surface-2)]"
          }`}
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <><Check className="h-4 w-4" />Salvato</>
          ) : (
            "Salva"
          )}
        </button>
      </div>
    </div>
  )
}
