"use client"

import { useEffect, useRef, useState } from "react"

const VIDEOS = [
  { src: "/videos/clip1.mp4" },
  { src: "/videos/clip2.mp4" },
]

export function VideoCarousel() {
  const [activeIdx, setActiveIdx] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])

  // Sync play/pause based on active index
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v) return
      if (i === activeIdx) {
        v.play().catch(() => {})
      } else {
        v.pause()
        v.currentTime = 0
      }
    })
  }, [activeIdx])

  // Detect which video is centred via scroll
  function onScroll() {
    const container = scrollRef.current
    if (!container) return
    const idx = Math.round(container.scrollLeft / container.offsetWidth)
    if (idx !== activeIdx) setActiveIdx(idx)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Scroll container */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="relative flex overflow-x-auto snap-x snap-mandatory"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {VIDEOS.map((v, i) => (
          <div
            key={v.src}
            className="relative snap-center shrink-0 w-full overflow-hidden rounded-2xl"
            style={{ aspectRatio: "9/16", maxHeight: "70vh" }}
          >
            <video
              ref={(el) => { videoRefs.current[i] = el }}
              src={v.src}
              loop
              playsInline
              muted
              autoPlay={i === 0}
              className="h-full w-full object-cover"
            />
          </div>
        ))}
      </div>

      {/* Dot indicators */}
      {VIDEOS.length > 1 && (
        <div className="flex justify-center gap-1.5">
          {VIDEOS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-200"
              style={{
                width: i === activeIdx ? "1.5rem" : "0.4rem",
                height: "0.4rem",
                background: i === activeIdx ? "var(--accent)" : "var(--muted)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
