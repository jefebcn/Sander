"use client"

import Link from "next/link"
import { useTransition } from "react"
import { CalendarDays, MapPin, Check, X, Loader2, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { answerGameProposal } from "@/actions/proposals"
import { cn } from "@/lib/utils"

export interface ProposalView {
  id: string
  date: string
  location: string
  city: string | null
  status: string
  sessionId: string | null
  /** GAME: a 2v2 with the two of you as a pair. TRAINING: just the two of you. */
  kind: "GAME" | "TRAINING"
  focus: string | null
  mineToAnswer: boolean
  mineSent: boolean
}

const FOCUS: Record<string, string> = {
  PALLEGGIO: "Palleggio",
  SERVIZIO: "Servizio",
  RICEZIONE: "Ricezione",
  TUTTO: "Un po' di tutto",
}

const STATUS: Record<string, string> = {
  ACCEPTED: "Accettata",
  DECLINED: "Non riesce",
  CANCELLED: "Annullata",
  EXPIRED: "Scaduta",
}

function when(iso: string): string {
  return new Date(iso).toLocaleString("it-IT", {
    timeZone: "Europe/Rome",
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  })
}

/** "Proponi una partita" card in a private chat, with the answer buttons. */
export function ProposalCard({ p, onAnswered }: { p: ProposalView; onAnswered: () => void }) {
  const [pending, start] = useTransition()

  function answer(a: "accept" | "decline" | "cancel") {
    start(async () => {
      try {
        await answerGameProposal({ proposalId: p.id, answer: a })
        if (a === "accept") toast.success(p.kind === "TRAINING" ? "Allenamento confermato!" : "Partita creata: siete in coppia!")
        onAnswered()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Non riuscito")
      }
    })
  }

  const open = p.status === "PENDING"
  return (
    <div className="w-[min(18rem,78vw)] overflow-hidden rounded-2xl bg-[var(--surface-2)] ring-1 ring-[var(--accent-line)]">
      <div className="bg-[var(--accent-soft)] px-4 py-2">
        <p className="eyebrow text-[var(--accent)]">
          {p.kind === "TRAINING"
            ? p.mineSent ? "Hai proposto un allenamento" : "Ti propone un allenamento"
            : p.mineSent ? "Hai proposto una partita" : "Ti propone una partita"}
        </p>
      </div>
      <div className="flex flex-col gap-1.5 px-4 py-3 text-white">
        <p className="flex items-center gap-2 text-base font-bold first-letter:uppercase">
          <CalendarDays className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" /> {when(p.date)}
        </p>
        <p className="flex items-center gap-2 text-base">
          <MapPin className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
          {p.location}
          {p.city && <span className="text-[var(--muted-text)]">· {p.city}</span>}
        </p>
        <p className="text-sm text-[var(--muted-text)]">
          {p.kind === "TRAINING"
            ? `Allenamento a due · ${FOCUS[p.focus ?? "TUTTO"] ?? "Un po' di tutto"}`
            : "2v2: voi due in coppia, due posti per gli avversari."}
        </p>
      </div>
      {open && p.mineToAnswer && (
        <div className="grid grid-cols-2 gap-2 px-3 pb-3">
          <button
            type="button"
            disabled={pending}
            onClick={() => answer("decline")}
            className="flex min-h-[3rem] items-center justify-center gap-1.5 rounded-full bg-[var(--surface-4)] text-sm font-extrabold text-white disabled:opacity-50"
          >
            <X className="h-4 w-4" aria-hidden="true" /> Non posso
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={() => answer("accept")}
            className="flex min-h-[3rem] items-center justify-center gap-1.5 rounded-full bg-[var(--accent)] text-sm font-extrabold text-black disabled:opacity-50"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Check className="h-4 w-4" aria-hidden="true" />}
            Ci sto
          </button>
        </div>
      )}
      {open && p.mineSent && (
        <div className="flex items-center justify-between gap-2 px-4 pb-3">
          <p className="text-sm text-[var(--muted-text)]">In attesa di risposta</p>
          <button type="button" disabled={pending} onClick={() => answer("cancel")} className="min-h-[2.75rem] px-2 text-sm font-bold text-[var(--muted-text)] underline">
            Annulla
          </button>
        </div>
      )}
      {!open && (
        <div className="flex items-center justify-between gap-2 px-4 pb-3">
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-extrabold",
              p.status === "ACCEPTED" ? "bg-[var(--accent)] text-black" : "bg-[var(--surface-4)] text-[var(--muted-text)]",
            )}
          >
            {STATUS[p.status] ?? p.status}
          </span>
          {p.sessionId && (
            <Link href={`/sessions/${p.sessionId}`} className="flex min-h-[2.75rem] items-center gap-0.5 text-sm font-bold text-[var(--accent)]">
              Vai alla partita <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
