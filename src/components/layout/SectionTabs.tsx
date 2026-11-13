import Link from "next/link"
import { cn } from "@/lib/utils"
import { toneOf, type Tone } from "@/components/ui/Card"

/**
 * Segmented switch between sibling pages of one area (Partite ↔ Tornei,
 * Giocatori ↔ Settimana ↔ Stagione ↔ Bagni). Real links, so back/forward and
 * sharing keep working.
 */
export function SectionTabs({
  items,
  active,
  tone = "play",
  className,
}: {
  items: { href: string; label: string; id: string }[]
  active: string
  tone?: Tone
  className?: string
}) {
  // Five tabs (Classifiche) must still fit a phone row without scrolling.
  const dense = items.length > 4
  return (
    <nav aria-label="Sezioni" className={cn("px-4", toneOf(tone), className)}>
      <div className="rail rounded-full bg-[var(--surface-2)] p-1 ring-1 ring-white/10" style={dense ? { gap: 0 } : undefined}>
        {items.map((it) => {
          const on = it.id === active
          return (
            <Link
              key={it.id}
              href={it.href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex min-h-[2.75rem] items-center justify-center whitespace-nowrap rounded-full font-extrabold transition-colors duration-200",
                // Dense: each tab as wide as its word, spread evenly.
                dense ? "grow px-1.5 text-[0.8125rem]" : "flex-1 px-3 text-sm",
                on ? "sel-on" : "text-white/75 active:text-white",
              )}
            >
              {it.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export const PLAY_TABS = [
  { id: "partite", href: "/sessions", label: "Partite" },
  { id: "tornei", href: "/tournaments", label: "Tornei" },
  { id: "compagni", href: "/trova", label: "Compagni" },
]

export const RANK_TABS = [
  { id: "giocatori", href: "/players", label: "Giocatori" },
  { id: "settimana", href: "/settimana", label: "Settimana" },
  { id: "stagione", href: "/stagione", label: "Stagione" },
  { id: "bagni", href: "/bagni", label: "Bagni" },
  { id: "fipav", href: "/fipav", label: "FIPAV" },
]
