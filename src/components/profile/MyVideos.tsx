"use client"

import { useState } from "react"
import { Trash2, Loader2, Clock, CheckCircle, XCircle } from "lucide-react"
import { deleteOwnVideo } from "@/actions/videos"

type VideoItem = {
  id: string
  blobUrl: string
  status: string
  note: string | null
  createdAt: Date
}

const STATUS_CONFIG: Record<string, { label: string; color: string; Icon: React.ElementType }> = {
  PENDING:  { label: "In attesa",   color: "var(--warning)",    Icon: Clock },
  APPROVED: { label: "Pubblicato",  color: "var(--live)",       Icon: CheckCircle },
  REJECTED: { label: "Non approvato", color: "var(--danger)",   Icon: XCircle },
}

export function MyVideos({ videos }: { videos: VideoItem[] }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  if (videos.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-text)] text-center py-4">
        Non hai ancora caricato nessun video
      </p>
    )
  }

  async function handleDelete(id: string) {
    setBusy(id)
    try { await deleteOwnVideo(id) } finally {
      setBusy(null)
      setConfirmId(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {videos.map((v) => {
        const cfg = STATUS_CONFIG[v.status] ?? STATUS_CONFIG.PENDING
        const Icon = cfg.Icon
        return (
          <div key={v.id} className="rounded-2xl bg-[var(--surface-2)] overflow-hidden">
            <video
              src={v.blobUrl}
              controls
              playsInline
              muted
              className="w-full"
              style={{ maxHeight: "35vh", objectFit: "cover" }}
            />
            <div className="p-3 flex items-center gap-3">
              <Icon className="h-4 w-4 flex-shrink-0" style={{ color: cfg.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold" style={{ color: cfg.color }}>
                  {cfg.label}
                </p>
                {v.status === "REJECTED" && v.note && (
                  <p className="text-xs text-[var(--muted-text)] truncate">{v.note}</p>
                )}
                <p className="text-xs text-[var(--muted-text)]">
                  {new Date(v.createdAt).toLocaleDateString("it-IT")}
                </p>
              </div>

              {confirmId === v.id ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(v.id)}
                    disabled={!!busy}
                    className="rounded-xl px-3 py-2 text-xs font-bold text-white min-h-[2.5rem]"
                    style={{ background: "#ef4444" }}
                  >
                    {busy === v.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Elimina"}
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="rounded-xl px-3 py-2 text-xs font-bold text-[var(--muted-text)] min-h-[2.5rem]"
                    style={{ background: "var(--surface-3)" }}
                  >
                    Annulla
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(v.id)}
                  disabled={!!busy}
                  className="flex h-9 w-9 items-center justify-center rounded-xl"
                  style={{ background: "var(--surface-3)" }}
                  aria-label="Elimina video"
                >
                  <Trash2 className="h-4 w-4 text-[var(--muted-text)]" />
                </button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
