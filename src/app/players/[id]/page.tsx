export const dynamic = "force-dynamic"

import { getPlayer } from "@/actions/players"
import { db } from "@/lib/db"
import { SanderCard } from "@/components/player/SanderCard"
import { PageHeader } from "@/components/layout/PageHeader"

async function getStreak(playerId: string): Promise<number> {
  const since = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
  const count = await db.sessionParticipant.count({
    where: {
      playerId,
      session: { status: "COMPLETED", date: { gte: since } },
    },
  })
  return Math.min(count, 10)
}

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [player, streak] = await Promise.all([getPlayer(id), getStreak(id)])

  return (
    <div>
      <PageHeader title="SanderCard" backHref="/players" />
      <div className="px-4 pb-6">
        <SanderCard player={{ ...player, streak }} />
      </div>
    </div>
  )
}
