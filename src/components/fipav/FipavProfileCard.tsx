import Link from "next/link"
import { after } from "next/server"
import { ChevronRight, Link2, Medal } from "lucide-react"
import { fipavRowsFor } from "@/lib/fipav/queries"
import { refreshFipavAthlete } from "@/lib/fipav/sync"
import type { FipavResult } from "@/lib/fipav/parse"

const pts = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 2 })
const day = (iso: string | null) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("it-IT", { timeZone: "UTC", day: "numeric", month: "short", year: "2-digit" }) : ""

/**
 * The player's FIPAV ranking and latest results on their own card (Carta tab).
 * Not linked: one quiet row that leads to /fipav/collega.
 */
export async function FipavProfileCard({
  player,
}: {
  player: { id: string; fipavPersonId: number | null; fipavResults: unknown; fipavResultsAt: Date | null }
}) {
  if (!player.fipavPersonId) {
    return (
      <Link
        href="/fipav/collega"
        className="tone-compete flex min-h-[3.5rem] items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 text-base font-bold text-white"
      >
        <Link2 className="h-5 w-5 shrink-0 text-[var(--tone)]" aria-hidden="true" />
        <span className="min-w-0 flex-1">Giochi tornei FIPAV? Collega il tuo profilo</span>
        <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
      </Link>
    )
  }

  const personId = player.fipavPersonId
  after(() => refreshFipavAthlete(player.id, personId).catch(() => undefined))
  const rows = await fipavRowsFor(personId)
  const results = (Array.isArray(player.fipavResults) ? (player.fipavResults as FipavResult[]) : []).slice(0, 5)

  return (
    <section id="fipav" aria-label="Profilo FIPAV" className="tone-compete overflow-hidden rounded-2xl bg-[var(--surface-2)]">
      {rows.length > 0 ? (
        rows.map((r) => (
          <Link key={r.id} href={`/fipav?genere=${r.gender}&pagina=${Math.ceil(r.position / 50)}`} className="flex items-center gap-3 px-4 py-3">
            <Medal className="h-7 w-7 shrink-0 text-[var(--gold)]" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted-text)]">Classifica FIPAV · Assoluto {r.gender === "F" ? "F" : "M"}</p>
              <p className="text-lg font-black text-white">{r.position}° · {pts(r.totalPoints)} punti</p>
              <p className="text-sm text-[var(--muted-text)]">{pts(r.entryPoints)} punti entry list</p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
          </Link>
        ))
      ) : (
        <p className="px-4 py-3 text-base text-[var(--muted-text)]">Non sei nella classifica Assoluto di quest&apos;anno.</p>
      )}

      {results.length > 0 && (
        <div className="border-t border-[var(--border)] pb-2">
          <p className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wide text-[var(--muted-text)]">Ultimi risultati FIPAV</p>
          <ul>
            {results.map((r, i) => (
              <li key={`${r.date}-${i}`} className="flex items-center gap-3 px-4 py-2">
                <span className="w-8 shrink-0 text-base font-black text-[var(--tone)]">{r.position}°</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white">{r.event}</p>
                  <p className="text-xs text-[var(--muted-text)]">{day(r.date)}</p>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-white">{pts(r.points)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link href="/fipav/collega" className="flex min-h-[3rem] items-center justify-between border-t border-[var(--border)] px-4 text-sm font-bold text-[var(--muted-text)]">
        Profilo FIPAV collegato · gestisci <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      <p className="px-4 pb-3 text-xs text-[var(--muted-text)]">Fonte: FIPAV</p>
    </section>
  )
}
