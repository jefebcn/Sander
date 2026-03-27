"use client"

import { useEffect, useState } from "react"
import { getMyVideos } from "@/actions/videos"
import { MyVideos } from "./MyVideos"
import { Loader2 } from "lucide-react"

type VideoItem = Awaited<ReturnType<typeof getMyVideos>>[number]

export function MyVideosSection() {
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyVideos()
      .then(setVideos)
      .catch(() => setVideos([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-4">
      <Loader2 className="h-4 w-4 animate-spin text-[var(--accent)]" />
    </div>
  )

  if (videos.length === 0) return null

  const serialized = videos.map((v) => ({
    id: v.id,
    blobUrl: v.blobUrl,
    status: v.status,
    note: v.note,
    createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : String(v.createdAt),
  }))

  return (
    <div className="space-y-3 pt-1">
      <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
        I miei video
      </p>
      <MyVideos videos={serialized} />
    </div>
  )
}
