"use client"

import { useEffect, useState } from "react"
import { Heart, Crown, MessageCircle, type LucideIcon } from "lucide-react"
import { Sheet } from "@/components/ui/Sheet"
import { FREE_LIKES_PER_DAY, FREE_ACES_PER_WEEK } from "@/lib/scopri/rules"

const SEEN_KEY = "scopri-welcome-v1"

const STEPS: { icon: LucideIcon; color: string; title: string; text: string }[] = [
  {
    icon: Heart,
    color: "var(--accent)",
    title: "Like con un commento",
    text: `Tocca il cuore su una foto o su una risposta e scrivi due parole: diventano il primo messaggio. Hai ${FREE_LIKES_PER_DAY} like gratis al giorno.`,
  },
  {
    icon: Crown,
    color: "var(--ace)",
    title: "L'Ace",
    text: `Un like speciale, ${FREE_ACES_PER_WEEK} a settimana: finisci in cima a "Ti vogliono" di chi lo riceve.`,
  },
  {
    icon: MessageCircle,
    color: "var(--social)",
    title: "Match, chat, partita",
    text: "Se ricambia è match: vi scrivete e con \"Proponi una partita\" fissate giorno e bagno. In \"Ti vogliono\" trovi chi ti ha già messo like.",
  },
]

/**
 * Shown once, the first time someone opens the deck: the words Scopri uses
 * (like with a comment, Ace, match) before the first card.
 */
export function ScopriWelcome() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) setOpen(true)
    } catch {
      // Storage blocked: skip the intro rather than show it on every visit.
    }
  }, [])

  function close() {
    setOpen(false)
    try {
      localStorage.setItem(SEEN_KEY, "1")
    } catch {}
  }

  return (
    <Sheet open={open} onOpenChange={(o) => (o ? setOpen(true) : close())} title="Come funziona Scopri" description="Tre cose e sei pronto.">
      <ol className="flex flex-col gap-3">
        {STEPS.map(({ icon: Icon, color, title, text }) => (
          <li key={title} className="flex gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: `color-mix(in srgb, ${color} 16%, transparent)`, color }}>
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-base font-bold text-white">{title}</span>
              <span className="block text-base text-[var(--muted-text)]">{text}</span>
            </span>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={close}
        className="pressable mt-4 flex min-h-[3.5rem] w-full items-center justify-center rounded-full bg-[var(--accent)] text-lg font-extrabold text-black"
      >
        Ho capito
      </button>
    </Sheet>
  )
}
