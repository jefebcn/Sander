"use client"

import { useRef } from "react"

const VIDEOS = ["/videos/clip1.mp4", "/videos/clip2.mp4"]

function VideoThumb({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null)

  function handleClick() {
    const v = ref.current
    if (!v) return
    if (v.paused) v.play()
    else v.pause()
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-black cursor-pointer"
      style={{ aspectRatio: "9/16" }}
      onClick={handleClick}
    >
      <video
        ref={ref}
        src={src}
        className="h-full w-full object-cover"
        playsInline
        muted
        loop
        preload="metadata"
        onLoadedMetadata={(e) => {
          ;(e.currentTarget as HTMLVideoElement).currentTime = 0.01
        }}
      />
    </div>
  )
}

export function VideoCarousel() {
  return (
    <div className="grid grid-cols-2 gap-3">
      {VIDEOS.map((src) => (
        <VideoThumb key={src} src={src} />
      ))}
    </div>
  )
}
