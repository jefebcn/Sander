"use client"

import { useState } from "react"
import { Trash2, Loader2 } from "lucide-react"
import { deleteVideo } from "@/actions/videos"

type Submission = {
  id: string
  blobUrl: string
  reviewedAt: Date | null
  player: { id: string; name: string; avatarUrl: string | null }
}

export function AdminApprovedVideos({ submissions }: { submissions: Submission[] }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  if (submissions.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-text)] text-center py-4">
        Nessun video pubblicato
      </p>
    )
  }

  async function handleDelete(id: string) {
    setBusy(id)
    try { await deleteVideo(id) } finally {
      setBusy(null)
      setConfirmId(null)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {submissions.map((s) => (
        <div key={s.id} className="rounded-2xl bg-[var(--surface-2)] overflow-hidden">
          <video
            src={s.blobUrl}
            controls
            playsInline
            muted
            className="w-full"
            style={{ maxHeight: "30vh", objectFit: "cover" }}
          />
          <div className="p-3 flex items-center gap-3">
            {s.player.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.player.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="h-7 w-7 rounded-full bg-[var(--accent)] opacity-60 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate">{s.player.name}</p>
              {s.reviewedAt && (
                <p className="text-xs text-[var(--muted-text)]">
                  Pubblicato il {new Date(s.reviewedAt).toLocaleDateString("it-IT")}
                </p>
              )}
            </div>

            {confirmId === s.id ? (
              <div className="flex gap-2">
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={!!busy}
                  className="rounded-xl px-3 py-2 text-xs font-bold text-white min-h-[2.5rem]"
                  style={{ background: "#ef4444" }}
                >
                  {busy === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Elimina"}
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
                onClick={() => setConfirmId(s.id)}
                disabled={!!busy}
                className="flex h-9 w-9 items-center justify-center rounded-xl flex-shrink-0"
                style={{ background: "var(--surface-3)" }}
                aria-label="Rimuovi dalla community"
              >
                <Trash2 className="h-4 w-4 text-[var(--muted-text)]" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
