"use client"

import { useRef, useState } from "react"
import { Share2, Download, AlertCircle } from "lucide-react"
import { SanderCardFut } from "./SanderCardFut"
import type { PlayerCardData } from "./SanderCardFut"
import { captureNodeToBlob, shareOrDownloadBlob } from "@/lib/captureNode"

interface Props {
  playerData: PlayerCardData
}

export function ShareCardButton({ playerData }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function handleShare() {
    if (!cardRef.current) return
    setLoading(true)
    setError(false)
    try {
      const blob = await captureNodeToBlob(cardRef.current, { pixelRatio: 2 })
      const safeName = playerData.name.replace(/\s+/g, "_")
      await shareOrDownloadBlob(
        blob,
        `SanderCard_${safeName}.png`,
        `${playerData.name} — Sander Card 🏐`,
      )
    } catch (err) {
      console.error("[ShareCard]", err)
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Off-screen render target — fixed far off-screen, width matches card */}
      <div
        aria-hidden
        className="pointer-events-none fixed"
        style={{ top: "-9999px", left: "-9999px", width: "400px" }}
      >
        <div ref={cardRef}>
          <SanderCardFut playerData={playerData} />
        </div>
      </div>

      <button
        onClick={handleShare}
        disabled={loading}
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-semibold"
        style={{
          background: error ? "rgba(239,68,68,0.07)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${error ? "rgba(239,68,68,0.3)" : "rgba(255,255,255,0.1)"}`,
          color: error ? "var(--danger)" : "var(--muted-text)",
          opacity: loading ? 0.6 : 1,
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? (
          <Download className="h-4 w-4 animate-bounce" />
        ) : error ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        {loading ? "Preparando…" : error ? "Riprova" : "Salva carta (quadrata)"}
      </button>
    </>
  )
}
