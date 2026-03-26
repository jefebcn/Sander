import { getPlayer } from "@/actions/players"
import { SanderCard } from "@/components/player/SanderCard"
import { PageHeader } from "@/components/layout/PageHeader"

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const player = await getPlayer(id)

  return (
    <div>
      <PageHeader title="SanderCard" />
      <div className="px-4">
        <SanderCard player={player} />
      </div>
    </div>
  )
}
