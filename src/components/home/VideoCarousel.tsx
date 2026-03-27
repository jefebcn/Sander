"use client"

import { useRef } from "react"
import { Play } from "lucide-react"

const VIDEOS = [
  { src: "/videos/clip1.mp4" },
  { src: "/videos/clip2.mp4" },
]

function VideoThumb({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const isPlayingRef = useRef(false)

  function startPlay() {
    const v = videoRef.current
    if (!v || isPlayingRef.current) return
    isPlayingRef.current = true
    v.play().catch(() => {})
  }

  function stopPlay() {
    const v = videoRef.current
    if (!v) return
    isPlayingRef.current = false
    v.pause()
    v.currentTime = 0
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-[var(--surface-2)]"
      style={{ aspectRatio: "9/16", width: "100%" }}
      onMouseEnter={startPlay}
      onMouseLeave={stopPlay}
      onTouchStart={startPlay}
      onTouchEnd={stopPlay}
    >
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        loop
        playsInline
        muted
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
      {/* Play hint icon */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ background: "rgba(0,0,0,0.25)" }}
      >
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <Play className="h-5 w-5 text-white" fill="white" />
        </div>
      </div>
    </div>
  )
}

export function VideoCarousel() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {VIDEOS.map((v) => (
        <VideoThumb key={v.src} src={v.src} />
      ))}
    </div>
  )
}
