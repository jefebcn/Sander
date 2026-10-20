"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { X, MapPin, Calendar, Plus, Send, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { proposeGameInChat } from "@/actions/proposals"
import { CITY_NAMES } from "@/lib/cities"
import { getMyUpcomingSessions, sendMessage } from "@/actions/messages"

type Sess = Awaited<ReturnType<typeof getMyUpcomingSessions>>[number]

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleString("it-IT", { timeZone: "Europe/Rome",
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** Two hours from now on the hour, as a datetime-local value in the phone's time. */
function soonLocal(): string {
  const d = new Date()
  d.setMinutes(0, 0, 0)
  d.setHours(d.getHours() + 2)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function ProposeMatchSheet({
  threadId,
  canPropose = false,
  onClose,
  onSent,
}: {
  threadId: string
  /** Private chats: a new proposal the other can accept with "Ci sto". */
  canPropose?: boolean
  onClose: () => void
  onSent: () => void
}) {
  const [date, setDate] = useState(soonLocal)
  const [location, setLocation] = useState("")
  const [city, setCity] = useState("")
  const [proposing, setProposing] = useState(false)

  async function sendProposal(e: React.FormEvent) {
    e.preventDefault()
    if (location.trim().length < 2) return toast.error("Scrivi dove giocate (es. Bagno 26)")
    setProposing(true)
    try {
      await proposeGameInChat({ threadId, date: new Date(date), location: location.trim(), city: city || undefined })
      onSent()
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Non riuscito")
      setProposing(false)
    }
  }

  const [sessions, setSessions] = useState<Sess[] | null>(null)
  const [sending, setSending] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    getMyUpcomingSessions()
      .then(setSessions)
      .catch(() => setSessions([]))
  }, [])

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  async function propose(s: Sess) {
    if (sending) return
    setSending(true)
    const body = `🏐 Ti propongo una partita:\n${s.title}\n📍 ${s.location} · ${dateLabel(s.date)}\n/sessions/${s.id}`
    try {
      await sendMessage({ threadId, body })
      onSent()
      onClose()
    } catch {
      setSending(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[300] flex flex-col justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 flex max-h-[75dvh] flex-col rounded-t-3xl bg-[var(--surface-1)] pb-6">
        <div className="flex flex-col items-center pt-3">
          <div className="h-1 w-10 rounded-full bg-[var(--surface-3)]" />
        </div>
        <div className="flex items-center justify-between px-5 pb-2 pt-3">
          <h3 className="text-lg font-black text-white">Proponi una partita</h3>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-3)]"
          >
            <X className="h-4 w-4 text-[var(--muted-text)]" />
          </button>
        </div>

        <div className="overflow-y-auto px-4">
          {canPropose && (
            <form onSubmit={sendProposal} className="mb-5 flex flex-col gap-2 rounded-2xl bg-[var(--surface-2)] p-3">
              <p className="text-sm text-[var(--muted-text)]">
                Scegli quando e dove: se risponde «Ci sto», la partita si crea da sola con voi due in coppia.
              </p>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">Quando</span>
                <input
                  type="datetime-local"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="min-h-[3.5rem] rounded-xl bg-[var(--surface-3)] px-3 text-base text-white outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">Dove</span>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Es. Bagno 26"
                  maxLength={100}
                  className="min-h-[3.5rem] rounded-xl bg-[var(--surface-3)] px-3 text-base text-white placeholder:text-[var(--muted-text)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
              </label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                aria-label="Comune"
                className="min-h-[3.5rem] rounded-xl bg-[var(--surface-3)] px-3 text-base text-white outline-none focus:ring-2 focus:ring-[var(--accent)]"
              >
                <option value="">Comune (facoltativo)</option>
                {CITY_NAMES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={proposing}
                className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-base font-extrabold text-black disabled:opacity-60"
              >
                {proposing ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
                Invia la proposta
              </button>
            </form>
          )}
          {canPropose && (
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">Oppure condividi una tua partita</p>
          )}
          {sessions === null ? (
            <p className="py-10 text-center text-sm text-[var(--muted-text)]">Carico…</p>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-[var(--muted-text)]">Non hai partite in programma.</p>
              <Link
                href="/sessions/new"
                className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-2xl px-5 font-black text-black"
                style={{ background: "var(--accent)" }}
              >
                <Plus className="h-5 w-5" />
                Crea una partita
              </Link>
            </div>
          ) : (
            <div className="space-y-2 pb-2">
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => propose(s)}
                  disabled={sending}
                  className="flex w-full items-center gap-3 rounded-2xl bg-[var(--surface-2)] p-3 text-left active:opacity-80 disabled:opacity-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-white">{s.title}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-[var(--muted-text)]">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {dateLabel(s.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {s.location}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
