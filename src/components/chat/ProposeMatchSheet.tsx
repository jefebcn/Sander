"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import Link from "next/link"
import { X, MapPin, Calendar, Plus, Send, Loader2, Users } from "lucide-react"
import { toast } from "sonner"
import { proposeGameInChat, listPairSlots, joinAsPair } from "@/actions/proposals"
import type { GroupGame } from "@/components/scopri/types"
import { cn } from "@/lib/utils"
import { getMyUpcomingSessions, sendMessage } from "@/actions/messages"
import { CityPicker } from "@/components/ui/CityPicker"

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
  const [kind, setKind] = useState<"GAME" | "TRAINING">("GAME")
  const [focus, setFocus] = useState<"PALLEGGIO" | "SERVIZIO" | "RICEZIONE" | "TUTTO">("TUTTO")
  const [proposing, setProposing] = useState(false)
  // "Entrate in coppia": games near you two that miss exactly a pair.
  const [slots, setSlots] = useState<GroupGame[] | null>(null)
  const [joining, setJoining] = useState<string | null>(null)

  useEffect(() => {
    if (!canPropose) return
    listPairSlots(threadId)
      .then(setSlots)
      .catch(() => setSlots([]))
  }, [canPropose, threadId])

  async function joinTogether(g: GroupGame) {
    if (joining) return
    setJoining(g.id)
    const r = await joinAsPair({ threadId, sessionId: g.id }).catch(() => ({ ok: false as const, error: "Non riuscito, riprova" }))
    if (!r.ok) {
      toast.error(r.error)
      setJoining(null)
      return
    }
    toast.success("Siete dentro in coppia!")
    onSent()
    onClose()
  }

  async function sendProposal(e: React.FormEvent) {
    e.preventDefault()
    if (location.trim().length < 2) return toast.error("Scrivi dove giocate (es. Bagno 26)")
    setProposing(true)
    try {
      await proposeGameInChat({
        threadId,
        date: new Date(date),
        location: location.trim(),
        city: city || undefined,
        kind,
        focus: kind === "TRAINING" ? focus : undefined,
      })
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
          <h3 className="text-lg font-black text-white">{canPropose ? "Giocate insieme" : "Proponi una partita"}</h3>
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
            <section className="mb-5" aria-labelledby="pair-slots">
              <p id="pair-slots" className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">Entrate in coppia</p>
              <p className="mb-2 text-sm text-[var(--muted-text)]">Partite vicino a voi a cui mancano proprio due giocatori: un tocco e ci siete tutti e due.</p>
              {slots === null ? (
                <p className="py-3 text-sm text-[var(--muted-text)]">Cerco le partite…</p>
              ) : slots.length === 0 ? (
                <p className="rounded-2xl bg-[var(--surface-2)] p-3 text-sm text-[var(--muted-text)]">
                  Nessuna partita con due posti liberi vicino a voi questa settimana: proponetene una qui sotto.
                </p>
              ) : (
                <ul className="space-y-2">
                  {slots.map((g) => (
                    <li key={g.id} className="flex items-center gap-3 rounded-2xl bg-[var(--surface-2)] p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold text-white">{g.title}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-[var(--muted-text)]">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" aria-hidden="true" />{dateLabel(g.date)}</span>
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" aria-hidden="true" />{g.location}</span>
                        </p>
                        <p className="mt-0.5 text-xs font-bold text-[var(--accent)]">Mancano {g.missing}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => joinTogether(g)}
                        disabled={joining !== null}
                        className="btn btn-primary min-h-[3rem] shrink-0 gap-1.5 px-4 text-sm disabled:opacity-60"
                      >
                        {joining === g.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Users className="h-4 w-4" aria-hidden="true" />}
                        Entriamo in due
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
          {canPropose && (
            <form onSubmit={sendProposal} className="mb-5 flex flex-col gap-2 rounded-2xl bg-[var(--surface-2)] p-3">
              <div className="grid grid-cols-2 gap-1 rounded-full bg-[var(--surface-3)] p-1" role="group" aria-label="Cosa proponi">
                {([["GAME", "Partita 2v2"], ["TRAINING", "Allenamento a due"]] as const).map(([k, label]) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={kind === k}
                    onClick={() => setKind(k)}
                    className={cn("min-h-[2.75rem] rounded-full text-sm font-extrabold", kind === k ? "sel-on" : "text-[var(--muted-text)]")}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-[var(--muted-text)]">
                {kind === "GAME"
                  ? "Scegli quando e dove: se risponde «Ci sto», la partita si crea da sola con voi due in coppia e SANDER cerca gli avversari."
                  : "Per allenarvi bastate voi due: palleggio, servizio, ricezione. Se risponde «Ci sto», resta segnato qui in chat."}
              </p>
              {kind === "TRAINING" && (
                <div className="flex flex-wrap gap-2" role="group" aria-label="Su cosa lavorate">
                  {([["PALLEGGIO", "Palleggio"], ["SERVIZIO", "Servizio"], ["RICEZIONE", "Ricezione"], ["TUTTO", "Un po' di tutto"]] as const).map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={focus === k}
                      onClick={() => setFocus(k)}
                      className={cn("min-h-[2.75rem] rounded-full px-4 text-sm font-bold", focus === k ? "sel-on" : "sel-off")}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}
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
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-[var(--muted-text)]">Comune (facoltativo)</span>
                <CityPicker value={city} onChange={setCity} />
              </div>
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
                className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-full px-5 font-black text-black"
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
