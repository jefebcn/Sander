"use client"

import { useRef, useState, useEffect } from "react"
import { Play, Pause } from "lucide-react"

const VIDEOS = ["/videos/clip1.mp4", "/videos/clip2.mp4"]

function VideoThumb({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [paused, setPaused] = useState(false)

  // Sync paused state with actual video state
  useEffect(() => {
    const v = ref.current
    if (!v) return
    const onPause = () => setPaused(true)
    const onPlay  = () => setPaused(false)
    v.addEventListener("pause", onPause)
    v.addEventListener("play",  onPlay)
    return () => {
      v.removeEventListener("pause", onPause)
      v.removeEventListener("play",  onPlay)
    }
  }, [])

  function handleClick() {
    const v = ref.current
    if (!v) return
    if (v.paused) v.play()
    else v.pause()
  }

  return (
    <div
      className="relative overflow-hidden rounded-2xl bg-black cursor-pointer active:opacity-90"
      style={{ aspectRatio: "9/16" }}
      onClick={handleClick}
    >
      <video
        ref={ref}
        src={src}
        className="h-full w-full object-cover"
        playsInline
        autoPlay
        muted
        loop
        preload="auto"
      />
      {/* Play/pause overlay — only shown when paused */}
      {paused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Play className="h-6 w-6 text-white" fill="white" />
          </div>
        </div>
      )}
      {/* Pause hint — fades in on tap, shows briefly */}
      {!paused && (
        <div className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40">
          <Pause className="h-3.5 w-3.5 text-white/80" />
        </div>
      )}
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
