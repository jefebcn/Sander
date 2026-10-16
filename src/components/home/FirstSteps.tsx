import Link from "next/link"
import { Check, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FirstStep {
  id: string
  title: string
  href: string
  done: boolean
  /** What it earns, shown on the right ("+XP", "+30 crediti"). */
  reward?: string
  rewardTone?: "play" | "social"
}

/**
 * What a brand-new player sees instead of a wall of zeros: three things that
 * turn an empty account into one worth coming back to, with progress.
 */
export function FirstSteps({ steps }: { steps: FirstStep[] }) {
  const done = steps.filter((s) => s.done).length
  return (
    <section className="rounded-[var(--radius-lg)] bg-[var(--surface-2)] px-[1.125rem] pb-2 pt-[1.125rem]">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-extrabold text-white">Primi passi</h2>
        <span className="text-base font-bold text-[var(--muted-text)]">
          {done} di {steps.length}
        </span>
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[var(--surface-4)]" aria-hidden="true">
        <div className="h-full bg-[var(--accent)]" style={{ width: `${Math.max(4, (done / steps.length) * 100)}%` }} />
      </div>
      <ol className="mt-2">
        {steps.map((s, i) => {
          const last = i === steps.length - 1
          const row = cn("flex min-h-[3.5rem] items-center gap-3", !last && "border-b border-[var(--border)]")
          if (s.done) {
            return (
              <li key={s.id} className={row} aria-label={`${s.title} (fatto)`}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-black">
                  <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" />
                </span>
                <span className="flex-1 text-base text-[var(--muted-text)] line-through">{s.title}</span>
              </li>
            )
          }
          return (
            <li key={s.id}>
              <Link href={s.href} className={cn(row, "pressable text-white")}>
                <span className="h-7 w-7 shrink-0 rounded-full border-2 border-[var(--surface-4)]" aria-hidden="true" />
                <span className="flex-1 text-base font-bold">{s.title}</span>
                {s.reward && (
                  <span className={cn("text-sm font-extrabold", s.rewardTone === "social" ? "text-[var(--social)]" : "text-[var(--accent)]")}>
                    {s.reward}
                  </span>
                )}
                <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
