import { Hourglass } from "lucide-react"
import { PROVISIONAL_GAMES } from "@/lib/rankingEligibility"

/**
 * Marks a player whose rating rests on fewer than PROVISIONAL_GAMES results:
 * their position is a first estimate, so boards list them after everyone else.
 */
export function ProvisionalBadge({ games }: { games: number }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-[var(--surface-3)] px-2 py-0.5 text-xs font-bold text-[var(--warning)]"
      title={`Rating provvisorio: ${games} di ${PROVISIONAL_GAMES} partite per entrare in classifica`}
    >
      <Hourglass className="h-3 w-3" aria-hidden="true" />
      Provvisorio · {games}/{PROVISIONAL_GAMES}
    </span>
  )
}

/** Heading for the section of a board that lists provisional players. */
export function ProvisionalSectionHeading({ className = "" }: { className?: string }) {
  return (
    <div className={`px-1 ${className}`}>
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
        <Hourglass className="h-3.5 w-3.5 text-[var(--warning)]" aria-hidden="true" />
        In valutazione
      </p>
      <p className="mt-0.5 text-xs text-[var(--muted-text)]">
        Meno di {PROVISIONAL_GAMES} partite: il punteggio è ancora una stima, entrano in classifica
        dopo la {PROVISIONAL_GAMES}ª.
      </p>
    </div>
  )
}
