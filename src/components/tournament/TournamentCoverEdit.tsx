"use client"

import { useTransition, useRef, useState } from "react"
import { Camera, Loader2, X } from "lucide-react"
import { updateTournamentMeta } from "@/actions/tournaments"

interface Props {
  tournamentId: string
  currentCoverUrl: string | null
}

export function TournamentCoverEdit({ tournamentId, currentCoverUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(currentCoverUrl)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) { setError("Seleziona un file immagine"); return }
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch(`/api/tournament-cover?tournamentId=${tournamentId}`, { method: "POST", body: fd })
      let json: { url?: string; error?: string } = {}
      try { json = await res.json() } catch { /* non-JSON */ }
      if (!res.ok || !json.url) { setError(json.error ?? "Errore upload"); return }
      setPreview(json.url)
      startTransition(() => updateTournamentMeta(tournamentId, { coverUrl: json.url! }))
    } catch {
      setError("Errore di rete")
    } finally {
      setUploading(false)
    }
  }

  function handleRemove() {
    setPreview(null)
    startTransition(() => updateTournamentMeta(tournamentId, { coverUrl: null }))
  }

  return (
    <div className="mx-4 mb-3">
      {preview ? (
        <div className="relative rounded-2xl overflow-hidden h-44">
          <img src={preview} alt="Cover" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-black/60 px-3 text-xs font-bold text-white backdrop-blur-sm"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              {uploading ? "Caricamento…" : "Cambia"}
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-black/60 text-white backdrop-blur-sm"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-28 w-full flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-text)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
        >
          {uploading
            ? <Loader2 className="h-6 w-6 animate-spin" />
            : <><Camera className="h-6 w-6" /><span className="text-xs font-medium">Aggiungi foto copertina</span></>
          }
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      {error && <p className="mt-1 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  )
}
