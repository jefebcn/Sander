"use client"

import { useState, useTransition } from "react"
import { Check, Loader2, Lock, Unlock } from "lucide-react"
import { updateTournamentSettings } from "@/actions/tournaments"

interface Props {
  tournamentId: string
  isOpenForRegistration: boolean
  date: Date | string
  registrationDeadline: Date | string | null
}

function toLocalInput(d: Date | string | null | undefined): string {
  if (!d) return ""
  const dt = new Date(d)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
}

export function AdminTournamentSettingsForm({
  tournamentId,
  isOpenForRegistration,
  date,
  registrationDeadline,
}: Props) {
  const [open, setOpen] = useState(isOpenForRegistration)
  const [dateVal, setDateVal] = useState(toLocalInput(date))
  const [deadlineVal, setDeadlineVal] = useState(toLocalInput(registrationDeadline))
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      await updateTournamentSettings(tournamentId, {
        isOpenForRegistration: open,
        date: dateVal ? new Date(dateVal) : undefined,
        registrationDeadline: deadlineVal ? new Date(deadlineVal) : null,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  return (
    <div className="mb-3 space-y-3">
      {/* Toggle iscrizioni */}
      <div className="flex items-center justify-between rounded-xl bg-[var(--surface-3)] px-3 py-2.5">
        <div className="flex items-center gap-2">
          {open ? (
            <Unlock className="h-4 w-4 text-[var(--accent)]" />
          ) : (
            <Lock className="h-4 w-4 text-[var(--muted-text)]" />
          )}
          <span className="text-sm font-semibold text-white">Iscrizioni aperte</span>
        </div>
        <button
          type="button"
          onClick={() => { setOpen((v) => !v); setSaved(false) }}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            open ? "bg-[var(--accent)]" : "bg-[var(--surface-2)]"
          }`}
          aria-checked={open}
          role="switch"
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              open ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {/* Data torneo */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-[var(--muted-text)]">📅 Data torneo</label>
        <input
          type="datetime-local"
          value={dateVal}
          onChange={(e) => { setDateVal(e.target.value); setSaved(false) }}
          className="w-full rounded-xl bg-[var(--surface-3)] px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style={{ colorScheme: "dark" }}
        />
      </div>

      {/* Termine iscrizioni */}
      <div className="space-y-1">
        <label className="text-xs font-semibold text-[var(--muted-text)]">⏰ Termine iscrizioni</label>
        <input
          type="datetime-local"
          value={deadlineVal}
          onChange={(e) => { setDeadlineVal(e.target.value); setSaved(false) }}
          className="w-full rounded-xl bg-[var(--surface-3)] px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style={{ colorScheme: "dark" }}
        />
      </div>

      {/* Save */}
      <button
        type="button"
        onClick={handleSave}
        disabled={pending}
        className={`flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${
          saved
            ? "bg-[var(--live)] text-black"
            : "bg-[var(--surface-3)] text-white hover:bg-[var(--surface-2)]"
        }`}
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : saved ? (
          <><Check className="h-4 w-4" /> Salvato</>
        ) : (
          "Salva modifiche"
        )}
      </button>
    </div>
  )
}
