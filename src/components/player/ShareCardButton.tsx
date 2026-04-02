"use client"

import { useRef, useState } from "react"
import { Share2, Download } from "lucide-react"
import { SanderCardFut } from "./SanderCardFut"
import type { PlayerCardData } from "./SanderCardFut"

interface Props {
  playerData: PlayerCardData
}

export function ShareCardButton({ playerData }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)

  async function captureCard(): Promise<Blob> {
    const { toPng } = await import("html-to-image")
    const node = cardRef.current
    if (!node) throw new Error("Card element not found")
    const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true })
    const res = await fetch(dataUrl)
    return res.blob()
  }

  async function handleShare() {
    setLoading(true)
    try {
      const blob = await captureCard()
      const file = new File([blob], `${playerData.name}-sander-card.png`, { type: "image/png" })

      if (
        typeof navigator !== "undefined" &&
        navigator.share &&
        navigator.canShare?.({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: `${playerData.name} — Sander Card`,
        })
      } else {
        // Desktop fallback: trigger download
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${playerData.name}-sander-card.png`
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      // User cancelled share — not an error
      if (err instanceof Error && err.name !== "AbortError") {
        console.error(err)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Off-screen render target — 400×400, no grid overlay */}
      <div
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
          background: "rgba(201,243,29,0.07)",
          border: "1px solid rgba(201,243,29,0.2)",
          color: "var(--accent)",
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? (
          <Download className="h-4 w-4 animate-bounce" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        {loading ? "Preparando..." : "Condividi Carta"}
      </button>
    </>
  )
}
