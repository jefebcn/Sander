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
  return (
    <nav aria-label="Sezioni" className={cn("px-4", toneOf(tone), className)}>
      <div className="rail rounded-full bg-[var(--surface-1)] p-1 ring-1 ring-[var(--border)]">
        {items.map((it) => {
          const on = it.id === active
          return (
            <Link
              key={it.id}
              href={it.href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex min-h-[2.75rem] flex-1 items-center justify-center whitespace-nowrap rounded-full px-3 text-sm font-extrabold transition-colors duration-200",
                on ? "bg-[var(--tone)] text-black" : "text-[var(--muted-text)] active:text-white",
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
]
