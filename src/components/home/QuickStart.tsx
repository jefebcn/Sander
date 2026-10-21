import Link from "next/link"
import { Search, Plus, CalendarClock, Gauge } from "lucide-react"
import { CrestHeading } from "./Crest"

/** The four things people open the app to do, one tap each. */
function actions(score: { href: string; sub: string }) {
  return [
    { href: "/sessions", icon: Search, label: "Trova", sub: "Posti liberi" },
    { href: "/sessions/new", icon: Plus, label: "Crea", sub: "La tua partita" },
    { href: "/trova", icon: CalendarClock, label: "Sono libero", sub: "Ti avvisiamo" },
    { href: score.href, icon: Gauge, label: "Segna", sub: score.sub },
  ]
}

/**
 * The four things people open the app to do, one tap each: round glass
 * buttons with the label underneath. A heading only when there's something to
 * say ("Nessuna partita in programma").
 */
export function QuickStart({
  score,
  eyebrow,
  title,
}: {
  /** Where "Segna" saves something: a match's result or live board. */
  score: { href: string; sub: string }
  eyebrow?: string
  title?: string
}) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby={title ? "quick-title" : undefined} aria-label={title ? undefined : "Azioni rapide"}>
      {title && <CrestHeading id="quick-title" eyebrow={eyebrow} title={title} />}
      <div className="grid grid-cols-4 gap-1">
        {actions(score).map((a) => (
          <Link key={a.label} href={a.href} className="pressable flex min-h-[5.5rem] flex-col items-center gap-2 text-center">
            <span className="flex h-[3.75rem] w-[3.75rem] items-center justify-center rounded-full bg-[var(--surface-3)] text-white ring-1 ring-white/15">
              <a.icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="text-sm font-bold leading-tight text-white">{a.label}</span>
            <span className="sr-only">{a.sub}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
