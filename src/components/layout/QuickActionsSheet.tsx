"use client"

import * as RadixDialog from "@radix-ui/react-dialog"
import Link from "next/link"
import { Plus, Search, Gauge, Trophy, UserPlus, CalendarClock, HeartHandshake, Users, X, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Tone } from "@/components/ui/Card"
import { toneOf } from "@/components/ui/Card"

interface Action {
  href: string
  icon: LucideIcon
  title: string
  text: string
  tone: Tone
  primary?: boolean
}

/** Ordered by how often people need them; the first is the one big button. */
const ACTIONS: Action[] = [
  { href: "/sessions/new", icon: Plus, title: "Crea una partita", text: "Scegli bagno e ora, gli altri si uniscono", tone: "play", primary: true },
  { href: "/sessions", icon: Search, title: "Trova una partita", text: "Posti liberi vicino a te", tone: "play" },
  { href: "/scopri", icon: HeartHandshake, title: "Trova un compagno", text: "Swipe tra chi gioca al tuo livello", tone: "play" },
  { href: "/scopri/coppie", icon: Users, title: "Sfida una coppia", text: "2v2: la tua coppia contro un'altra", tone: "social" },
  { href: "/trova", icon: CalendarClock, title: "Sono libero", text: "Di' quando puoi e trova compagni", tone: "play" },
  { href: "/segna", icon: Gauge, title: "Segna il punteggio", text: "Tabellone dal vivo", tone: "play" },
  { href: "/tournaments/new", icon: Trophy, title: "Organizza un torneo", text: "Iscrizioni e tabellone automatici", tone: "compete" },
  { href: "/profile?tab=invita", icon: UserPlus, title: "Invita un amico", text: "Guadagnate SanderCredits tutti e due", tone: "social" },
]

export function QuickActionsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [primary, ...rest] = ACTIONS
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fade-in fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm" />
        <RadixDialog.Content
          className="sheet-up fixed inset-x-0 bottom-0 z-[61] mx-auto max-w-lg rounded-t-[1.75rem] border-t border-[var(--border)] bg-[var(--surface-1)] px-4 pt-3 outline-none"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)" }}
        >
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-[var(--muted)]" aria-hidden="true" />
          <div className="mb-4 flex items-center justify-between">
            <RadixDialog.Title className="font-hand text-[1.9rem] text-white">
              Cosa vuoi fare?
            </RadixDialog.Title>
            <RadixDialog.Close
              aria-label="Chiudi"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--surface-2)] text-white"
            >
              <X className="h-5 w-5" />
            </RadixDialog.Close>
          </div>
          <RadixDialog.Description className="sr-only">Azioni rapide di SANDER</RadixDialog.Description>

          <Link
            href={primary.href}
            onClick={() => onOpenChange(false)}
            className="pressable mb-3 flex min-h-[4.5rem] items-center gap-4 rounded-[var(--radius-lg)] bg-[var(--accent)] px-5 text-black shadow-[var(--shadow-glow)]"
          >
            <primary.icon className="h-7 w-7" strokeWidth={2.5} aria-hidden="true" />
            <span>
              <span className="block font-display text-xl font-extrabold leading-tight">{primary.title}</span>
              <span className="block text-sm font-semibold text-black/70">{primary.text}</span>
            </span>
          </Link>

          <div className="grid grid-cols-2 gap-2">
            {rest.map((a, i) => (
              <Link
                key={a.href}
                href={a.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  "rise-in pressable flex min-h-[6.5rem] flex-col justify-between rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-4 active:bg-[var(--surface-3)]",
                  // An odd last item spans the row instead of sitting alone.
                  i === rest.length - 1 && rest.length % 2 === 1 && "col-span-2 min-h-[4.5rem] flex-row items-center justify-start gap-4",
                  toneOf(a.tone),
                )}
                style={{ "--i": i } as React.CSSProperties}
              >
                <a.icon className="h-6 w-6 text-[var(--tone)]" aria-hidden="true" />
                <span>
                  <span className="block text-base font-extrabold leading-tight text-white">{a.title}</span>
                  <span className="block text-xs leading-snug text-[var(--muted-text)]">{a.text}</span>
                </span>
              </Link>
            ))}
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  )
}
