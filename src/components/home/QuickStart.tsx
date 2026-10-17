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

/** "C'è un modo rapido per usarla?" — yes: these, also behind the + below. */
export function QuickStart({
  score,
  eyebrow = "Il modo più rapido",
  title = "In un tocco",
}: {
  /** Where "Segna" saves something: a match's result or live board. */
  score: { href: string; sub: string }
  eyebrow?: string
  title?: string
}) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="quick-title">
      <CrestHeading id="quick-title" eyebrow={eyebrow} title={title} />
      <div className="grid grid-cols-2 gap-2 min-[360px]:grid-cols-4">
        {actions(score).map((a) => (
          <Link
            key={a.label}
            href={a.href}
            className="pressable flex min-h-[5.75rem] flex-col items-center justify-start gap-1.5 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-1 pb-2 pt-3.5 text-center ring-1 ring-[var(--crest-hair)] active:bg-[var(--surface-3)]"
          >
            <a.icon className="h-6 w-6 text-[var(--accent)]" strokeWidth={2.25} aria-hidden="true" />
            <span className="text-sm font-extrabold leading-tight text-white">{a.label}</span>
            <span className="text-xs leading-tight text-[var(--muted-text)]">{a.sub}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
