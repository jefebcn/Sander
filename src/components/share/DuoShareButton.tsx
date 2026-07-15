"use client"

import { useEffect, useRef, useState } from "react"
import { Share2, Download, Check, AlertCircle, Heart } from "lucide-react"
import { DuoStory } from "./DuoStory"
import { captureNodeToBlob, shareOrDownloadBlob, makeQrDataUrl } from "@/lib/captureNode"

interface Props {
  playerA: string
  playerB: string
  played: number
  won: number
  winRate: number
}

export function DuoShareButton({ playerA, playerB, played, won, winRate }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://www.sanderbv.it"
  const landingUrl = `${origin}/scarica?ref=duo`

  useEffect(() => {
    let alive = true
    makeQrDataUrl(landingUrl).then((d) => {
      if (alive) setQr(d)
    })
    return () => {
      alive = false
    }
  }, [landingUrl])

  async function handleShare() {
    if (!ref.current) return
    setStatus("loading")
    try {
      const blob = await captureNodeToBlob(ref.current, { pixelRatio: 1 })
      const result = await shareOrDownloadBlob(
        blob,
        `SANDER_duo_${playerA}_${playerB}.png`.replace(/\s+/g, "_"),
        `${playerA.split(" ")[0]} & ${playerB.split(" ")[0]}: ${winRate}% insieme su SANDER 🏐 Trova il tuo compagno → ${origin}/scarica`,
      )
      setStatus(result === "cancelled" ? "idle" : "done")
      if (result !== "cancelled") setTimeout(() => setStatus("idle"), 2500)
    } catch (err) {
      console.error("[DuoShare]", err)
      setStatus("error")
      setTimeout(() => setStatus("idle"), 3000)
    }
  }

  return (
    <>
      <div
        aria-hidden
        style={{ position: "fixed", top: 0, left: -99999, width: 1080, pointerEvents: "none" }}
      >
        <div ref={ref}>
          <DuoStory
            playerA={playerA}
            playerB={playerB}
            played={played}
            won={won}
            winRate={winRate}
            qrDataUrl={qr}
            shareUrl={origin}
          />
        </div>
      </div>

      <button
        onClick={handleShare}
        disabled={status === "loading"}
        className="flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-2xl text-sm font-black transition-opacity active:opacity-80"
        style={{
          background: status === "error" ? "rgba(239,68,68,0.1)" : "rgba(201,243,29,0.08)",
          border: "1px solid rgba(201,243,29,0.25)",
          color: status === "error" ? "var(--danger)" : "var(--accent)",
          opacity: status === "loading" ? 0.6 : 1,
        }}
      >
        {status === "loading" ? (
          <Download className="h-4 w-4 animate-bounce" />
        ) : status === "done" ? (
          <Check className="h-4 w-4" />
        ) : status === "error" ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <Heart className="h-4 w-4" />
        )}
        {status === "loading"
          ? "Preparando…"
          : status === "done"
            ? "Condivisa!"
            : status === "error"
              ? "Riprova"
              : "Condividi la coppia"}
        {status === "idle" && <Share2 className="h-3.5 w-3.5 opacity-60" />}
      </button>
    </>
  )
}
