import { db } from "@/lib/db"
import { PageHeader } from "@/components/layout/PageHeader"
import { BracketView } from "@/components/tournament/BracketView"

export const dynamic = "force-dynamic"


export default async function BracketPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [tournament, matches] = await Promise.all([
    db.tournament.findUniqueOrThrow({ where: { id }, select: { name: true, type: true } }),
    db.match.findMany({
      where: { tournamentId: id },
      include: {
        players: { include: { player: true } },
      },
      orderBy: [{ round: "desc" }, { matchNumber: "asc" }],
    }),
  ])

  if (tournament.type !== "BRACKETS" && tournament.type !== "DOUBLE_ELIMINATION") {
    return (
      <div className="px-4 pt-8 text-center text-[var(--muted-text)]">
        Questa vista è disponibile solo per tornei a eliminazione diretta.
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Tabellone" subtitle={tournament.name} />
      <div className="overflow-x-auto px-4 pb-8">
        <BracketView matches={matches} />
      </div>
    </div>
  )
}
