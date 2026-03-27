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

  // Play active video, pause others
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

  function onScroll() {
    const container = scrollRef.current
    if (!container) return
    const idx = Math.round(container.scrollLeft / container.offsetWidth)
    if (idx !== activeIdx) setActiveIdx(idx)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Scroll container — each slide is 100vw wide, fixed height */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        style={{
          display: "flex",
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {VIDEOS.map((v, i) => (
          <div
            key={v.src}
            style={{
              flex: "0 0 100%",
              scrollSnapAlign: "center",
              height: "60vh",
              borderRadius: "1rem",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <video
              ref={(el) => { videoRefs.current[i] = el }}
              src={v.src}
              loop
              playsInline
              muted
              autoPlay={i === 0}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
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
