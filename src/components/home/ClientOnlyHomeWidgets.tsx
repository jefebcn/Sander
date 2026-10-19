"use client"

import dynamic from "next/dynamic"
import type { PlayerCardData } from "@/components/player/SanderCardFut"
import { ChevronDown } from "lucide-react"

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
      {/* Collapsed by default: the home stays short, the videos one tap away. */}
      <details className="tone-sand group rounded-[var(--radius-lg)] bg-[var(--surface-2)] ring-1 ring-[var(--crest-hair)]">
        <summary className="flex min-h-[3.5rem] cursor-pointer list-none items-center justify-between gap-3 px-4 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="eyebrow block text-[var(--tone)]">Dalla spiaggia</span>
            <span className="block font-display text-xl font-extrabold text-white">Video della community</span>
          </span>
          <ChevronDown className="h-5 w-5 shrink-0 text-[var(--muted-text)] transition-transform group-open:rotate-180" aria-hidden="true" />
        </summary>
        <div className="px-3 pb-3">
          <VideoCarousel />
        </div>
      </details>
    </>
  )
}
