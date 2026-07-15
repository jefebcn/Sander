"use client"

import dynamic from "next/dynamic"
import type { ArcadePlayer } from "./GameCanvas"

// Canvas + rAF are browser-only: load the game strictly on the client.
const GameCanvas = dynamic(() => import("./GameCanvas").then((m) => m.GameCanvas), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center text-sm text-[var(--muted-text)]">
      Preparo il campo…
    </div>
  ),
})

export function GameClient({ player }: { player: ArcadePlayer }) {
  return <GameCanvas player={player} />
}
