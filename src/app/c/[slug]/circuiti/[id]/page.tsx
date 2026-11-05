export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Crown, Medal } from "lucide-react"
import { db } from "@/lib/db"
import { circuitStandings, CIRCUIT_PARTICIPATION, CIRCUIT_POINTS } from "@/lib/circuit"
import { TOURNAMENT_CARD_SELECT } from "@/lib/clubQueries"
import { PageHeader } from "@/components/layout/PageHeader"
import { TournamentCard } from "@/components/tournament/TournamentCard"
import { ShareButton } from "@/components/ui/ShareButton"

interface Props { params: Promise<{ slug: string; id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const c = await db.clubCircuit.findUnique({ where: { id }, select: { name: true, club: { select: { name: true } } } })
  return { title: c ? `${c.name} — classifica | ${c.club.name}` : "Circuito — SANDER" }
}

/** A club circuit: the overall standings across its stages, and the stages themselves. */
export default async function CircuitPage({ params }: Props) {
  const { slug, id } = await params
  const circuit = await db.clubCircuit.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      club: { select: { slug: true, name: true, status: true } },
      tournaments: {
        orderBy: { date: "asc" },
        select: { ...TOURNAMENT_CARD_SELECT, standings: { select: { playerId: true, rank: true } } },
      },
    },
  })
  if (!circuit || circuit.club.slug !== slug || circuit.club.status !== "APPROVED") notFound()

  const completed = circuit.tournaments.filter((t) => t.status === "COMPLETED")
  const table = circuitStandings(completed.map((t) => ({ standings: t.standings })))
  const names = new Map(
    (await db.player.findMany({ where: { id: { in: table.map((r) => r.playerId) } }, select: { id: true, name: true } })).map((p) => [p.id, p.name]),
  )

  return (
    <div className="pb-10">
      <PageHeader
        eyebrow={`Circuito · ${circuit.club.name}`}
        tone="compete"
        title={circuit.name}
        subtitle={`${completed.length} di ${circuit.tournaments.length} tappe giocate`}
        backHref={`/c/${slug}`}
        action={<ShareButton path={`/c/${slug}/circuiti/${circuit.id}`} title={circuit.name} text={`Classifica generale: ${circuit.name} 🏐`} />}
      />
      <div className="flex flex-col gap-5 px-4">
        <section className="overflow-hidden rounded-2xl bg-[var(--surface-1)]">
          <p className="px-4 pt-3 pb-2 text-sm font-bold uppercase tracking-wide text-[var(--muted-text)]">Classifica generale</p>
          {table.length === 0 ? (
            <p className="px-4 pb-4 text-base text-[var(--muted-text)]">La classifica parte con la prima tappa conclusa.</p>
          ) : (
            <ol>
              {table.map((r) => (
                <li key={r.playerId} className="flex min-h-[3.5rem] items-center gap-3 border-t border-[var(--border)] px-4 py-2">
                  <span className="flex w-7 justify-center text-base font-bold text-[var(--muted-text)]">
                    {r.rank === 1 ? <Crown className="h-5 w-5 text-[var(--gold)]" aria-label="Primo" /> : r.rank <= 3 ? <Medal className="h-5 w-5 text-[var(--tone)]" aria-label={`${r.rank}°`} /> : r.rank}
                  </span>
                  <Link href={`/players/${r.playerId}`} className="min-w-0 flex-1">
                    <span className="block truncate text-base font-bold text-white">{names.get(r.playerId) ?? "Giocatore"}</span>
                    <span className="block text-sm text-[var(--muted-text)]">
                      {r.stages === 1 ? "1 tappa" : `${r.stages} tappe`}{r.wins ? ` · ${r.wins === 1 ? "1 vittoria" : `${r.wins} vittorie`}` : ""}
                    </span>
                  </Link>
                  <span className="text-lg font-black text-white">{r.points}</span>
                </li>
              ))}
            </ol>
          )}
        </section>

        <p className="text-sm text-[var(--muted-text)]">
          Punti per tappa: {CIRCUIT_POINTS.slice(0, 5).join(", ")}… dal primo al quinto, {CIRCUIT_PARTICIPATION} a chi partecipa oltre il decimo. I due
          giocatori di una coppia prendono gli stessi punti.
        </p>

        <section className="flex flex-col gap-3">
          <h2 className="eyebrow text-[var(--tone)]">Le tappe</h2>
          {circuit.tournaments.length === 0 ? (
            <p className="rounded-2xl bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">Ancora nessuna tappa in calendario.</p>
          ) : (
            circuit.tournaments.map((t) => <TournamentCard key={t.id} tournament={t} />)
          )}
        </section>
      </div>
    </div>
  )
}
