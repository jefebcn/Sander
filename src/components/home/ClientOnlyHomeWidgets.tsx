"use client"

import dynamic from "next/dynamic"
import type { PlayerCardData } from "@/components/player/SanderCardFut"

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
  cardData?: PlayerCardData
}

export function ClientOnlyHomeWidgets({ currentLevel, playerName, cardData }: Props) {
  return (
    <>
      <LevelUpCelebration currentLevel={currentLevel} playerName={playerName} cardData={cardData} />
      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
          Video della community
        </p>
        <VideoCarousel />
      </div>
    </>
  )
}
