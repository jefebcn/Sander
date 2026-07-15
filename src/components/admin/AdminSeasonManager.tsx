"use client"

import { useState, useTransition } from "react"
import { Calendar, Check, Loader2, Trophy, X } from "lucide-react"
import { createSeason, endSeason } from "@/actions/seasons"
import type { SeasonInfo } from "@/actions/seasons"

interface Props {
  activeSeason: SeasonInfo | null
}

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function AdminSeasonManager({ activeSeason }: Props) {
  const [name, setName] = useState("")
  const [startsAt, setStartsAt] = useState("")
  const [endsAt, setEndsAt] = useState("")
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  function handleCreate() {
    setMsg(null)
    startTransition(async () => {
      const res = await createSeason({ name, startsAt, endsAt })
      if (res.ok) {
        setMsg({ ok: true, text: "Stagione creata!" })
        setName("")
        setStartsAt("")
        setEndsAt("")
      } else {
        setMsg({ ok: false, text: res.error })
      }
    })
  }

  function handleEnd() {
    if (!activeSeason) return
    startTransition(async () => {
      await endSeason(activeSeason.id)
      setMsg({ ok: true, text: "Stagione terminata" })
    })
  }

  return (
    <div className="rounded-2xl bg-[var(--surface-2)] p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Trophy className="h-4 w-4 text-[var(--accent)]" />
        <p className="text-sm font-black uppercase tracking-wider text-white">Stagioni</p>
      </div>

      {/* Active season */}
      {activeSeason ? (
        <div className="flex items-center justify-between rounded-xl bg-[var(--surface-1)] p-3">
          <div>
            <p className="font-black text-white">{activeSeason.name}</p>
            <p className="text-xs text-[var(--muted-text)]">
              {new Date(activeSeason.startsAt).toLocaleDateString("it-IT")} –{" "}
              {new Date(activeSeason.endsAt).toLocaleDateString("it-IT")}
            </p>
          </div>
          <button
            onClick={handleEnd}
            disabled={pending}
            className="flex items-center gap-1 rounded-lg bg-red-500/15 px-3 py-2 text-xs font-bold text-red-400 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" /> Termina
          </button>
        </div>
      ) : (
        <p className="text-xs text-[var(--muted-text)]">Nessuna stagione attiva.</p>
      )}

      {/* Create season */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-[var(--muted-text)]">Nuova stagione</p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome (es. Estate 2026)"
          className="w-full rounded-xl bg-[var(--surface-1)] px-3 py-2.5 text-sm text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <div className="grid grid-cols-2 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-[0.65rem] font-bold text-[var(--muted-text)]">Inizio</span>
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="rounded-xl bg-[var(--surface-1)] px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ colorScheme: "dark" }}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[0.65rem] font-bold text-[var(--muted-text)]">Fine</span>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="rounded-xl bg-[var(--surface-1)] px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              style={{ colorScheme: "dark" }}
            />
          </label>
        </div>
        <button
          onClick={handleCreate}
          disabled={pending || !name || !startsAt || !endsAt}
          className="flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-xl font-black text-black disabled:opacity-40"
          style={{ background: "var(--accent)" }}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
          Avvia stagione
        </button>
        {msg && (
          <p
            className={`flex items-center gap-1 text-xs font-bold ${msg.ok ? "text-[var(--live)]" : "text-red-400"}`}
          >
            {msg.ok && <Check className="h-3.5 w-3.5" />}
            {msg.text}
          </p>
        )}
      </div>
    </div>
  )
}
