"use client"

import dynamic from "next/dynamic"

const LevelUpCelebration = dynamic(
  () => import("./LevelUpCelebration").then((m) => m.LevelUpCelebration),
  { ssr: false }
)
const VideoCarousel = dynamic(
  () => import("./VideoCarousel").then((m) => m.VideoCarousel),
  { ssr: false }
)

interface Props {
  currentLevel: number
  playerName: string
}

export function ClientOnlyHomeWidgets({ currentLevel, playerName }: Props) {
  return (
    <>
      <LevelUpCelebration currentLevel={currentLevel} playerName={playerName} />
      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
          Video della community
        </p>
        <VideoCarousel />
      </div>
    </>
  )
}
