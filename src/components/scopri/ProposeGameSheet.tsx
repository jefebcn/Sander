"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarPlus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Sheet } from "@/components/ui/Sheet"
import { CityPicker } from "@/components/ui/CityPicker"

/** Next full hour, as a datetime-local value in the phone's own time. */
function nextHourLocal(): string {
  const d = new Date()
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 2)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * From a match to a date on the calendar: when, which bagno, which comune.
 * `submit` is the action that creates it (2 players + 2 seats, or a full 2v2).
 */
export function ProposeGameSheet({
  open,
  onOpenChange,
  title,
  description,
  defaultCity,
  submit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  defaultCity?: string | null
  submit: (input: { location: string; city?: string; date: Date }) => Promise<{ sessionId: string }>
}) {
  const router = useRouter()
  const [date, setDate] = useState(nextHourLocal)
  const [location, setLocation] = useState("")
  const [city, setCity] = useState(defaultCity ?? "")
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (location.trim().length < 2) return toast.error("Scrivi dove giocate (es. Bagno 26)")
    setBusy(true)
    try {
      const res = await submit({ location: location.trim(), city: city || undefined, date: new Date(date) })
      toast.success("Partita creata!")
      onOpenChange(false)
      router.push(`/sessions/${res.sessionId}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Non riuscito")
    } finally {
      setBusy(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title} description={description}>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold text-[var(--muted-text)]">Quando</span>
          <input
            type="datetime-local"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="min-h-[3.5rem] rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 text-base text-white outline-none ring-1 ring-[var(--border)] focus:ring-[var(--accent)]"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-bold text-[var(--muted-text)]">Dove</span>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value.slice(0, 100))}
            placeholder="Es. Bagno 26, Rimini"
            className="min-h-[3.5rem] rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 text-base text-white placeholder:text-[var(--muted-text)] outline-none ring-1 ring-[var(--border)] focus:ring-[var(--accent)]"
          />
        </label>
        <div className="flex flex-col gap-1">
          <span className="text-sm font-bold text-[var(--muted-text)]">Comune</span>
          <CityPicker value={city} onChange={setCity} />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="pressable mt-2 flex min-h-[3.75rem] items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-lg font-extrabold text-black disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <CalendarPlus className="h-5 w-5" aria-hidden="true" />}
          Metti in calendario
        </button>
      </form>
    </Sheet>
  )
}
