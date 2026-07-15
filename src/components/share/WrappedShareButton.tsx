"use client"

import { useEffect, useRef, useState } from "react"
import { Share2, Download, Check, AlertCircle, Sparkles } from "lucide-react"
import { WrappedStory } from "./WrappedStory"
import type { PlayerRecap } from "@/actions/recap"
import { captureNodeToBlob, shareOrDownloadBlob, makeQrDataUrl } from "@/lib/captureNode"

interface Props {
  playerName: string
  recap: PlayerRecap
  title?: string
}

export function WrappedShareButton({ playerName, recap, title = "IL TUO MESE" }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://www.sanderbv.it"
  const landingUrl = `${origin}/scarica?ref=wrapped`

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
      const safe = playerName.replace(/\s+/g, "_")
      const result = await shareOrDownloadBlob(
        blob,
        `SANDER_recap_${safe}.png`,
        `Il mio recap su SANDER 🏐 ${recap.wins}V · ${recap.winRate}% win rate. Gioca anche tu → ${origin}/scarica`,
      )
      setStatus(result === "cancelled" ? "idle" : "done")
      if (result !== "cancelled") setTimeout(() => setStatus("idle"), 2500)
    } catch (err) {
      console.error("[WrappedShare]", err)
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
          <WrappedStory
            playerName={playerName}
            recap={recap}
            title={title}
            qrDataUrl={qr}
            shareUrl={origin}
          />
        </div>
      </div>

      <button
        onClick={handleShare}
        disabled={status === "loading"}
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-base transition-opacity active:opacity-80"
        style={{
          background: status === "error" ? "rgba(239,68,68,0.1)" : "rgba(201,243,29,0.08)",
          border: "1px solid rgba(201,243,29,0.25)",
          color: status === "error" ? "var(--danger)" : "var(--accent)",
          opacity: status === "loading" ? 0.6 : 1,
        }}
      >
        {status === "loading" ? (
          <Download className="h-5 w-5 animate-bounce" />
        ) : status === "done" ? (
          <Check className="h-5 w-5" />
        ) : status === "error" ? (
          <AlertCircle className="h-5 w-5" />
        ) : (
          <Sparkles className="h-5 w-5" />
        )}
        {status === "loading"
          ? "Preparando…"
          : status === "done"
            ? "Condiviso!"
            : status === "error"
              ? "Riprova"
              : "Condividi il tuo recap"}
        {status === "idle" && <Share2 className="h-4 w-4 opacity-60" />}
      </button>
    </>
  )
}
