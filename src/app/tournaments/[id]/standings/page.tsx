import { getStandings } from "@/actions/standings"
import { PageHeader } from "@/components/layout/PageHeader"
import { StandingsTable } from "@/components/tournament/StandingsTable"
import { db } from "@/lib/db"

export const dynamic = "force-dynamic"

export default async function StandingsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [standings, tournament] = await Promise.all([
    getStandings(id),
    db.tournament.findUniqueOrThrow({ where: { id }, select: { name: true } }),
  ])

  return (
    <div>
      <PageHeader title="Classifica" subtitle={tournament.name} />
      <div className="px-4">
        <StandingsTable standings={standings} />
      </div>
    </div>
  )
}
