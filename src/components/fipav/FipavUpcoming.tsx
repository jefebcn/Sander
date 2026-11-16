import Link from "next/link"
import { ChevronRight, Trophy } from "lucide-react"
import { listFipavEvents } from "@/lib/fipav/queries"
import { isYouthCategory, shortCategory } from "@/lib/fipav/parse"
import { formatDayShort, relativeDay } from "@/lib/datetime"

/**
 * The next FIPAV tournaments, for pages that would otherwise be empty
 * (no open matches, a quiet week, no SANDER tournament coming up).
 * Renders nothing when the FIPAV copy has no upcoming events.
 */
export async function FipavUpcoming({ title = "Intanto, i prossimi tornei FIPAV", limit = 3 }: { title?: string; limit?: number }) {
  const all = await listFipavEvents({}, 21)
  // One per city: the same weekend often lists the men's and women's event
  // side by side, which reads as a duplicate in a three-line teaser.
  const seen = new Set<string>()
  const events = all.filter((e) => {
    if (isYouthCategory(e.category) || seen.has(e.city)) return false
    seen.add(e.city)
    return true
  })
  if (events.length === 0) return null

  return (
    <section aria-labelledby="fipav-upcoming" className="tone-compete w-full text-left">
      <p id="fipav-upcoming" className="mb-2 text-sm font-bold uppercase tracking-wider text-[var(--tone)]">
        {title}
      </p>
      <ul className="flex flex-col gap-2">
        {events.slice(0, limit).map((e) => (
          <li key={e.code}>
            <Link
              href={`/tournaments/fipav/${e.code}`}
              className="flex min-h-[3.5rem] items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3 active:opacity-80"
            >
              <Trophy className="h-5 w-5 shrink-0 text-[var(--tone)]" aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-base font-bold text-white">{shortCategory(e.category)}</span>
                <span className="block truncate text-sm text-[var(--muted-text)]">
                  {formatDayShort(e.startDate)} · {relativeDay(e.startDate)} · {e.city}
                </span>
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href="/tournaments/fipav"
        className="mt-2 flex min-h-[3.5rem] items-center justify-center rounded-2xl text-base font-bold text-[var(--tone)]"
      >
        Vedi tutti i {all.length} tornei FIPAV
      </Link>
    </section>
  )
}
