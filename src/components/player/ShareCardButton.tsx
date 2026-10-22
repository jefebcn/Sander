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
  // The off-screen copy decodes a large frame image: build it only once the
  // button is about to be used, not with the page.
  const [armed, setArmed] = useState(false)

  async function handleShare() {
    setLoading(true)
    setError(false)
    try {
      if (!armed) {
        setArmed(true)
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      }
      if (!cardRef.current) throw new Error("card not rendered")
      await Promise.all([...cardRef.current.querySelectorAll("img")].map((img) => img.decode().catch(() => {})))
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
        {armed && (
          <div ref={cardRef}>
            <SanderCardFut playerData={playerData} />
          </div>
        )}
      </div>

      <button
        onPointerDown={() => setArmed(true)}
        onFocus={() => setArmed(true)}
        onClick={handleShare}
        disabled={loading}
        className="btn btn-secondary w-full"
        style={{
          color: error ? "var(--danger)" : undefined,
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
