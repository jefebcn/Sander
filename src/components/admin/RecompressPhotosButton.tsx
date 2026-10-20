"use client"

import { useState } from "react"
import { ImageDown, Loader2 } from "lucide-react"
import { adminRecompressPhotos } from "@/actions/adminSystem"

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`

/** Runs the photo clean-up batch after batch, showing progress. */
export function RecompressPhotosButton() {
  const [running, setRunning] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function run() {
    setRunning(true)
    let offset: number | null = 0
    let compressed = 0
    let saved = 0
    let failed = 0
    try {
      while (offset !== null) {
        const r = await adminRecompressPhotos(offset)
        compressed += r.compressed
        saved += r.savedBytes
        failed += r.failed
        offset = r.nextOffset
        setStatus(`${compressed} foto compresse, ${mb(saved)} risparmiati${failed ? `, ${failed} non riuscite` : ""}…`)
      }
      setStatus(`Fatto: ${compressed} foto compresse, ${mb(saved)} risparmiati${failed ? `, ${failed} non riuscite (riprova più tardi)` : ""}.`)
    } catch {
      setStatus(`Interrotto dopo ${compressed} foto. Riprova: riparte da dove si è fermato.`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={run}
        disabled={running}
        className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-5 text-base font-extrabold text-black disabled:opacity-60"
      >
        {running ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <ImageDown className="h-5 w-5" aria-hidden="true" />}
        {running ? "Compressione in corso…" : "Comprimi le foto vecchie"}
      </button>
      {status && <p className="text-base text-white" role="status">{status}</p>}
    </div>
  )
}
