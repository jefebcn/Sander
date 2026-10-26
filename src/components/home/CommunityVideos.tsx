"use client"

import dynamic from "next/dynamic"
import { ChevronDown, Clapperboard } from "lucide-react"

const VideoCarousel = dynamic(
  () => import("./VideoCarousel").then((m) => m.VideoCarousel),
  { ssr: false }
)

/** Collapsed by default: the home stays short, the videos one tap away. */
export function CommunityVideos() {
  return (
    <details className="group overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-2)] ring-1 ring-[var(--crest-hair)]">
      <summary className="flex min-h-[4.5rem] cursor-pointer list-none items-center gap-4 p-4 [&::-webkit-details-marker]:hidden">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--tone-soft)] text-[var(--tone)]">
          <Clapperboard className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="eyebrow block text-[var(--muted-text)]">Dalla spiaggia</span>
          <span className="block text-base font-extrabold text-white">Video della community</span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-[var(--muted-text)] transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="px-3 pb-3">
        <VideoCarousel />
      </div>
    </details>
  )
}
