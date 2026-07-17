"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MapPin, Check, Loader2 } from "lucide-react"
import { editSession } from "@/actions/sessions"
import { POPULAR_BAGNI, bagnoLabel } from "@/lib/bagni"
import { cn } from "@/lib/utils"

interface Props {
  session: {
    id: string
    title: string
    location: string
    date: string // ISO
    maxPlayers: number
    notes: string | null
  }
}

function toLocalInput(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function EditSessionForm({ session }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(session.title)
  const [location, setLocation] = useState(session.location)
  const [date, setDate] = useState(toLocalInput(session.date))
  const [maxPlayers, setMaxPlayers] = useState(String(session.maxPlayers))
  const [notes, setNotes] = useState(session.notes ?? "")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const res = await editSession({
        sessionId: session.id,
        title: title.trim() || undefined,
        location: location.trim(),
        date: new Date(date),
        notes: notes.trim() || undefined,
        maxPlayers: Number(maxPlayers) || undefined,
      })
      if (res.ok) {
        router.push(`/sessions/${session.id}`)
        router.refresh()
      } else {
        setError(res.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-8">
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
          Titolo
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Titolo della partita"
          className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-3 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
          Bagno / Campo
        </label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-text)]" />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Bagno o campo (es. Bagno 26)"
            className="w-full rounded-xl bg-[var(--surface-2)] py-3 pl-9 pr-4 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {POPULAR_BAGNI.map((n) => {
            const label = bagnoLabel(n)
            return (
              <button
                key={n}
                type="button"
                onClick={() => setLocation(label)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-bold transition-colors",
                  location === label
                    ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                    : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-text)]",
                )}
              >
                🏖️ {n}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
          Data e ora
        </label>
        <input
          type="datetime-local"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          style={{ colorScheme: "dark" }}
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
          Giocatori max
        </label>
        <input
          type="number"
          inputMode="numeric"
          min={2}
          max={32}
          value={maxPlayers}
          onChange={(e) => setMaxPlayers(e.target.value)}
          className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-3 text-base text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <p className="mt-1 text-xs text-[var(--muted-text)]">
          Non puoi scendere sotto il numero di iscritti attuali.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
          Note
        </label>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Note (opzionale)"
          className="w-full rounded-xl bg-[var(--surface-2)] px-4 py-3 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      {error && (
        <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={pending}
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-black disabled:opacity-60"
        style={{ background: "var(--accent)" }}
      >
        {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
        Salva modifiche
      </button>
    </div>
  )
}
