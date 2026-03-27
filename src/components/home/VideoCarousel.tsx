"use client"

import { useRef, useState } from "react"

type VideoItem = { src: string; label?: string; avatarUrl?: string | null }

function VideoThumb({ item }: { item: VideoItem }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [playing, setPlaying] = useState(false)

  // Force first frame to render as thumbnail
  function onLoadedMetadata() {
    const v = videoRef.current
    if (!v) return
    v.currentTime = 0.01
  }

  function togglePlay() {
    const v = videoRef.current
    if (!v) return
    if (playing) {
      v.pause()
      v.currentTime = 0
      setPlaying(false)
    } else {
      v.play().catch(() => {})
      setPlaying(true)
    }
  }

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-[var(--surface-2)] flex-shrink-0"
      style={{ aspectRatio: "9/16", width: "calc(50% - 4px)" }}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={item.src}
        preload="metadata"
        loop
        playsInline
        muted
        onLoadedMetadata={onLoadedMetadata}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
      {item.label && (
        <div
          className="absolute bottom-0 left-0 right-0 px-2 py-1.5"
          style={{ background: "linear-gradient(transparent, rgba(0,0,0,0.7))" }}
        >
          <p className="text-xs font-semibold text-white truncate">{item.label}</p>
        </div>
      )}
    </div>
  )
}

const DEFAULT_VIDEOS: VideoItem[] = [
  { src: "/videos/clip1.mp4" },
  { src: "/videos/clip2.mp4" },
]

export function VideoCarousel({
  approvedVideos = [],
}: {
  approvedVideos?: { blobUrl: string; player: { name: string; avatarUrl: string | null } }[]
}) {
  const items: VideoItem[] = [
    ...DEFAULT_VIDEOS,
    ...approvedVideos.map((v) => ({
      src: v.blobUrl,
      label: v.player.name,
      avatarUrl: v.player.avatarUrl,
    })),
  ]

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
      }}
    >
      {items.map((item) => (
        <VideoThumb key={item.src} item={item} />
      ))}
    </div>
  )
}
