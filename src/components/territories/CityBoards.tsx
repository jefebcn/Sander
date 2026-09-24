import Link from "next/link"
import { MapPin, Crown } from "lucide-react"
import type { CityLeaderboard } from "@/actions/territories"

/**
 * Town leaderboards — "4° a Riccione" lands far harder than "180° overall",
 * which is what a newcomer sees on the global ranking before giving up.
 */
export function CityBoards({ boards }: { boards: CityLeaderboard[] }) {
  if (boards.length === 0) return null

  return (
    <section className="px-4 pb-6">
      <div className="mb-2 flex items-center gap-1.5">
        <MapPin className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
          Derby della Riviera
        </h2>
      </div>

      <div className="space-y-2">
        {boards.map((b) => (
          <div key={b.city} className="rounded-2xl bg-[var(--surface-1)] p-4">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-base font-black text-white">{b.city}</p>
              <p className="shrink-0 text-xs text-[var(--muted-text)]">
                {b.totalMatches} {b.totalMatches === 1 ? "partita" : "partite"} ·{" "}
                {b.venues} {b.venues === 1 ? "campo" : "campi"}
              </p>
            </div>

            {b.king && (
              <Link
                href={`/players/${b.king.id}`}
                className="mt-2 flex items-center gap-2 rounded-xl bg-[var(--surface-2)] px-3 py-2"
              >
                <Crown className="h-4 w-4 shrink-0 text-[var(--gold)]" aria-hidden="true" />
                <span className="truncate text-sm font-bold text-white">{b.king.name}</span>
                <span className="ml-auto shrink-0 text-xs text-[var(--muted-text)]">
                  {b.king.wins} vittorie · {b.king.winRate}%
                </span>
              </Link>
            )}

            {b.standings.length > 1 && (
              <ol className="mt-2 space-y-1">
                {b.standings.slice(1, 4).map((p, i) => (
                  <li key={p.id} className="flex items-center gap-2 px-1 text-sm">
                    <span className="w-4 shrink-0 text-xs font-bold text-[var(--muted-text)]">
                      {i + 2}
                    </span>
                    <Link href={`/players/${p.id}`} className="truncate text-white">
                      {p.name}
                    </Link>
                    <span className="ml-auto shrink-0 text-xs text-[var(--muted-text)]">
                      {p.wins}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>

      <p className="mt-2 px-1 text-xs text-[var(--muted-text)]">
        Scegli il comune quando crei la partita per comparire in questa classifica.
      </p>
    </section>
  )
}
