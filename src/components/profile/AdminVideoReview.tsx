"use client"

import { useState } from "react"
import { Check, X, Trash2, Loader2 } from "lucide-react"
import { approveVideo, rejectVideo, deleteVideo } from "@/actions/videos"

type Submission = {
  id: string
  blobUrl: string
  createdAt: string
  player: { id: string; name: string; avatarUrl: string | null }
}

export function AdminVideoReview({ submissions }: { submissions: Submission[] }) {
  const [busy, setBusy] = useState<string | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectNote, setRejectNote] = useState("")
  const [error, setError] = useState<string | null>(null)

  if (submissions.length === 0) {
    return (
      <p className="text-sm text-[var(--muted-text)] text-center py-4">
        Nessun video in attesa di revisione
      </p>
    )
  }

  async function handleApprove(id: string) {
    setError(null)
    setBusy(id)
    try {
      await approveVideo(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore durante la pubblicazione")
    } finally {
      setBusy(null)
    }
  }

  async function handleReject(id: string) {
    setError(null)
    setBusy(id)
    try {
      await rejectVideo(id, rejectNote || undefined)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore durante il rifiuto")
    } finally {
      setBusy(null)
      setRejectId(null)
      setRejectNote("")
    }
  }

  async function handleDelete(id: string) {
    setError(null)
    setBusy(id)
    try {
      await deleteVideo(id)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Errore durante l'eliminazione")
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <p className="rounded-xl px-4 py-3 text-sm font-semibold" style={{ background: "#ef444420", color: "#ef4444" }}>
          {error}
        </p>
      )}
      {submissions.map((s) => (
        <div key={s.id} className="rounded-2xl bg-[var(--surface-2)] overflow-hidden">
          {/* Video preview */}
          <video
            src={s.blobUrl}
            controls
            playsInline
            muted
            className="w-full"
            style={{ maxHeight: "40vh", objectFit: "cover" }}
          />

          <div className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              {s.player.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.player.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-[var(--accent)] opacity-60" />
              )}
              <span className="font-bold text-sm text-white">{s.player.name}</span>
              <span className="ml-auto text-xs text-[var(--muted-text)]">
                {new Date(s.createdAt).toLocaleDateString("it-IT")}
              </span>
            </div>

            {/* Reject note input */}
            {rejectId === s.id && (
              <input
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Motivo del rifiuto (opzionale)"
                className="rounded-xl px-3 py-2 text-sm bg-[var(--surface-3)] text-white placeholder:text-[var(--muted-text)] outline-none"
              />
            )}

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handleApprove(s.id)}
                disabled={!!busy}
                className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-black min-h-[3.5rem]"
                style={{ background: "var(--accent)" }}
              >
                {busy === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Pubblica
              </button>

              {rejectId === s.id ? (
                <button
                  onClick={() => handleReject(s.id)}
                  disabled={!!busy}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-white min-h-[3.5rem]"
                  style={{ background: "#ef4444" }}
                >
                  {busy === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                  Conferma
                </button>
              ) : (
                <button
                  onClick={() => setRejectId(s.id)}
                  disabled={!!busy}
                  className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold text-white min-h-[3.5rem]"
                  style={{ background: "#ef444440", color: "#ef4444" }}
                >
                  <X className="h-4 w-4" />
                  Rifiuta
                </button>
              )}

              <button
                onClick={() => handleDelete(s.id)}
                disabled={!!busy}
                className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-bold min-h-[3.5rem]"
                style={{ background: "var(--surface-3)", color: "var(--muted-text)" }}
              >
                <Trash2 className="h-4 w-4" />
                Elimina
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
