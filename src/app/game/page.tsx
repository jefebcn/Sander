export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { playerToCardData } from "@/components/player/SanderCardFut"
import { cardToGameStats, GUEST_STATS } from "@/lib/game/stats"
import { GameClient } from "@/components/game/GameClient"
import type { ArcadePlayer } from "@/components/game/GameCanvas"

export const metadata: Metadata = {
  title: "SANDER Arcade — 1v1 Beach Volley",
  description:
    "Gioca 1v1 con la tua carta SANDER: velocità, potenza, salto e difesa contano davvero in campo.",
}

export default async function GamePage() {
  const player = await getCurrentPlayer()

  let arcade: ArcadePlayer
  if (player) {
    const card = playerToCardData(player)
    arcade = {
      name: player.firstName ?? player.name.split(" ")[0],
      avatarUrl: player.avatarUrl ?? null,
      stats: cardToGameStats({ ...card.stats, rating: card.glicko2 }),
    }
  } else {
    // Playable without an account — a balanced guest card
    arcade = { name: "Ospite", avatarUrl: null, stats: GUEST_STATS }
  }

  return <GameClient player={arcade} />
}
