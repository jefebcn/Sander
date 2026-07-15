"use client"

import { useEffect, useRef, useState } from "react"
import { Share2, Download, Check, AlertCircle } from "lucide-react"
import { DivisionStory } from "./DivisionStory"
import { DIVISIONS } from "@/lib/divisions"
import { captureNodeToBlob, shareOrDownloadBlob, makeQrDataUrl } from "@/lib/captureNode"

interface Props {
  playerName: string
  divisionKey: string
  rating: number
  seasonName: string
  rank?: number | null
}

export function DivisionShareButton({ playerName, divisionKey, rating, seasonName, rank }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://www.sanderbv.it"
  const landingUrl = `${origin}/scarica?ref=division`
  const divisionName = DIVISIONS.find((d) => d.key === divisionKey)?.name ?? "Sabbia"

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
        `SANDER_divisione_${playerName}.png`.replace(/\s+/g, "_"),
        `Sono in Divisione ${divisionName} su SANDER 🏐 Scala anche tu → ${origin}/scarica`,
      )
      setStatus(result === "cancelled" ? "idle" : "done")
      if (result !== "cancelled") setTimeout(() => setStatus("idle"), 2500)
    } catch (err) {
      console.error("[DivisionShare]", err)
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
          <DivisionStory
            playerName={playerName}
            divisionKey={divisionKey}
            rating={rating}
            seasonName={seasonName}
            rank={rank}
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
          background: status === "error" ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          color: status === "error" ? "var(--danger)" : "#fff",
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
          <Share2 className="h-4 w-4" />
        )}
        {status === "loading"
          ? "Preparando…"
          : status === "done"
            ? "Condivisa!"
            : status === "error"
              ? "Riprova"
              : "Condividi la divisione"}
      </button>
    </>
  )
}
