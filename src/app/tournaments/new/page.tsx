export const dynamic = "force-dynamic"

import { listPlayers } from "@/actions/players"
import { PageHeader } from "@/components/layout/PageHeader"
import { CreateTournamentForm } from "@/components/tournament/CreateTournamentForm"

export default async function NewTournamentPage() {
  const players = await listPlayers()

  return (
    <div>
      <PageHeader title="Nuovo Torneo" />
      <CreateTournamentForm players={players} />
    </div>
  )
}
