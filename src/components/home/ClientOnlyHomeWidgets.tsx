"use client"

import dynamic from "next/dynamic"
import type { PlayerCardData } from "@/components/player/SanderCardFut"
import { CrestHeading } from "./Crest"

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
      <section className="flex flex-col gap-3" aria-labelledby="videos-title">
        <CrestHeading id="videos-title" eyebrow="Dalla spiaggia" title="Video della community" />
        <VideoCarousel />
      </section>
    </>
  )
}
