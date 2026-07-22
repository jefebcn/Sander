"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X, MapPin, Calendar, Plus } from "lucide-react"
import { getMyUpcomingSessions, sendMessage } from "@/actions/messages"

type Sess = Awaited<ReturnType<typeof getMyUpcomingSessions>>[number]

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleString("it-IT", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function ProposeMatchSheet({
  threadId,
  onClose,
  onSent,
}: {
  threadId: string
  onClose: () => void
  onSent: () => void
}) {
  const [sessions, setSessions] = useState<Sess[] | null>(null)
  const [sending, setSending] = useState(false)

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

  return (
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
          {sessions === null ? (
            <p className="py-10 text-center text-sm text-[var(--muted-text)]">Carico…</p>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-[var(--muted-text)]">Non hai partite in programma.</p>
              <Link
                href="/sessions/new"
                className="flex min-h-[3rem] items-center justify-center gap-2 rounded-2xl px-5 font-black text-black"
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
    </div>
  )
}
