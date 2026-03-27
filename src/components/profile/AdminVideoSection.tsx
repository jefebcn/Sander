"use client"

import { useEffect, useState } from "react"
import { getPendingVideos, getApprovedVideosFull } from "@/actions/videos"
import { AdminVideoReview } from "./AdminVideoReview"
import { AdminApprovedVideos } from "./AdminApprovedVideos"
import { Loader2 } from "lucide-react"

type Pending = Awaited<ReturnType<typeof getPendingVideos>>
type Approved = Awaited<ReturnType<typeof getApprovedVideosFull>>

export function AdminVideoSection() {
  const [pending, setPending] = useState<Pending>([])
  const [approved, setApproved] = useState<Approved>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const [p, a] = await Promise.all([getPendingVideos(), getApprovedVideosFull()])
      setPending(p)
      setApproved(a)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore caricamento video")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--accent)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl px-4 py-3 text-sm font-semibold"
        style={{ background: "#ef444420", color: "#ef4444" }}>
        {error}
      </div>
    )
  }

  // Serialize dates for child client components
  const pendingSerialized = pending.map((v) => ({
    id: v.id,
    blobUrl: v.blobUrl,
    createdAt: v.createdAt instanceof Date ? v.createdAt.toISOString() : String(v.createdAt),
    player: v.player,
  }))

  const approvedSerialized = approved.map((v) => ({
    id: v.id,
    blobUrl: v.blobUrl,
    reviewedAt: v.reviewedAt
      ? (v.reviewedAt instanceof Date ? v.reviewedAt.toISOString() : String(v.reviewedAt))
      : null,
    player: v.player,
  }))

  return (
    <div className="space-y-5">
      {/* Pending */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
            Video in attesa
          </p>
          {pendingSerialized.length > 0 && (
            <span className="rounded-full px-2 py-0.5 text-xs font-black text-black"
              style={{ background: "var(--accent)" }}>
              {pendingSerialized.length}
            </span>
          )}
        </div>
        <AdminVideoReview submissions={pendingSerialized} onAction={load} />
      </div>

      {/* Approved */}
      <div>
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
          Video pubblicati
        </p>
        <AdminApprovedVideos submissions={approvedSerialized} onAction={load} />
      </div>
    </div>
  )
}
