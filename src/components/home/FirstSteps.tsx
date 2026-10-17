import Link from "next/link"
import { Check, ChevronRight, MapPin, Volleyball, Camera, UserPlus, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface FirstStep {
  id: string
  title: string
  text: string
  href: string
  done: boolean
}

const ICONS: Record<string, LucideIcon> = {
  city: MapPin,
  play: Volleyball,
  photo: Camera,
  invite: UserPlus,
}

/**
 * What a brand-new player sees instead of a wall of zeros: the few things that
 * turn an empty account into one worth coming back to, with progress.
 */
export function FirstSteps({ steps }: { steps: FirstStep[] }) {
  const done = steps.filter((s) => s.done).length
  const next = steps.find((s) => !s.done)
  return (
    <section className="tone-play rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-5 ring-1 ring-[var(--crest-hair)]">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="eyebrow text-[var(--accent)]">Primi passi</p>
          <p className="font-display text-2xl font-extrabold uppercase leading-none text-white">Entra nel giro</p>
        </div>
        <p className="num text-2xl text-white">
          {done}<span className="text-[var(--muted-text)]">/{steps.length}</span>
        </p>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-4)]" aria-hidden="true">
        <div className="xp-bar-fill h-full rounded-full bg-[var(--accent)]" style={{ width: `${Math.max(4, (done / steps.length) * 100)}%` }} />
      </div>
      <ol className="mt-4 flex flex-col gap-2">
        {steps.map((s) => {
          const Icon = ICONS[s.id] ?? Volleyball
          const isNext = s.id === next?.id
          return (
            <li key={s.id}>
              <Link
                href={s.href}
                aria-label={`${s.title}${s.done ? " (fatto)" : ""}`}
                className={cn(
                  "pressable flex min-h-[3.5rem] items-center gap-3 rounded-[var(--radius-md)] px-3 py-2",
                  isNext ? "bg-[var(--accent-soft)] ring-1 ring-[var(--accent-line)]" : "bg-black/30",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    s.done ? "bg-[var(--accent)] text-black" : "bg-[var(--surface-4)] text-[var(--accent)]",
                  )}
                >
                  {s.done ? <Check className="h-5 w-5" strokeWidth={3} aria-hidden="true" /> : <Icon className="h-4 w-4" aria-hidden="true" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-base font-bold", s.done ? "text-[var(--muted-text)] line-through" : "text-white")}>
                    {s.title}
                  </span>
                  {!s.done && <span className="block text-sm text-[var(--muted-text)]">{s.text}</span>}
                </span>
                {!s.done && <ChevronRight className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />}
              </Link>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
