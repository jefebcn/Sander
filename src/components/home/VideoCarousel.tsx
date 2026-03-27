"use client"

import { useEffect, useRef } from "react"

const VIDEOS = [
  { src: "/videos/clip1.mp4" },
  { src: "/videos/clip2.mp4" },
]

function VideoThumb({ src, autoplay }: { src: string; autoplay?: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null)

  // Autoplay first video on mount
  useEffect(() => {
    if (!autoplay) return
    const v = videoRef.current
    if (!v) return
    v.play().catch(() => {})
  }, [autoplay])

  function startPlay() {
    videoRef.current?.play().catch(() => {})
  }

  function stopPlay() {
    const v = videoRef.current
    if (!v) return
    v.pause()
    v.currentTime = 0
  }

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-[var(--surface-2)]"
      style={{ aspectRatio: "9/16", width: "100%" }}
      onMouseEnter={startPlay}
      onMouseLeave={stopPlay}
      onTouchStart={startPlay}
      onTouchEnd={stopPlay}
    >
      <video
        ref={videoRef}
        src={src}
        preload="auto"
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
    </div>
  )
}

export function VideoCarousel() {
  return (
    <div
      className="grid gap-2"
      style={{ gridTemplateColumns: "1fr 1fr", maxWidth: "100%" }}
    >
      {VIDEOS.map((v, i) => (
        <VideoThumb key={v.src} src={v.src} autoplay={i === 0} />
      ))}
    </div>
  )
}
