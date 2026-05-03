"use client"

import { useRef, useState, useEffect } from "react"
import { Play, Pause, ChevronLeft, ChevronRight } from "lucide-react"

// Newest first — add new videos at the beginning of the array
const VIDEOS = ["/videos/clip3.mp4", "/videos/clip1.mp4", "/videos/clip2.mp4"]

function VideoThumb({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [paused, setPaused] = useState(false)

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
      className="relative flex-1 overflow-hidden rounded-2xl bg-black cursor-pointer active:opacity-90"
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
      {paused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <Play className="h-6 w-6 text-white" fill="white" />
          </div>
        </div>
      )}
      {!paused && (
        <div className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/40">
          <Pause className="h-3.5 w-3.5 text-white/80" />
        </div>
      )}
    </div>
  )
}

export function VideoCarousel() {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(VIDEOS.length / 2)
  const start = page * 2
  const visible = VIDEOS.slice(start, start + 2)

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        {visible.map((src) => (
          <VideoThumb key={src} src={src} />
        ))}
        {/* Placeholder to keep layout when odd video is alone */}
        {visible.length === 1 && <div className="flex-1" style={{ aspectRatio: "9/16" }} />}
      </div>

      {/* Navigation dots + arrows — only if more than one page */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4 text-white" />
          </button>

          <div className="flex gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className="h-1.5 rounded-full transition-all"
                style={{
                  width: i === page ? "1.5rem" : "0.375rem",
                  background: i === page ? "var(--accent)" : "rgba(255,255,255,0.25)",
                }}
              />
            ))}
          </div>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4 text-white" />
          </button>
        </div>
      )}
    </div>
  )
}
