"use client"

import { useRef, useState } from "react"
import { ImagePlus, X, Loader2 } from "lucide-react"

interface TournamentCoverUploadProps {
  value: string
  onChange: (url: string) => void
}

export function TournamentCoverUpload({ value, onChange }: TournamentCoverUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Seleziona un file immagine")
      return
    }
    setError(null)
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/tournament-cover", { method: "POST", body: fd })
      const json = await res.json()
      if (json.url) onChange(json.url)
      else if (!json.url && res.ok) onChange("") // blob not configured
    } catch {
      setError("Errore durante l'upload")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-[var(--muted-text)]">
        Immagine cover <span className="font-normal opacity-60">— opzionale</span>
      </label>

      {value ? (
        <div className="relative rounded-2xl overflow-hidden h-40">
          <img src={value} alt="Cover preview" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--border)] bg-[var(--surface-2)] text-[var(--muted-text)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin" />
          ) : (
            <>
              <ImagePlus className="h-8 w-8" />
              <span className="text-sm font-medium">Tocca per caricare</span>
              <span className="text-xs opacity-60">JPG, PNG, WEBP</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  )
}
