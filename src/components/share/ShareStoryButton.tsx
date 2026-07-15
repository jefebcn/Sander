"use client"

import { useEffect, useRef, useState } from "react"
import { Share2, Download, AlertCircle, Check } from "lucide-react"
import { ShareableStory } from "./ShareableStory"
import type { StoryVariant } from "./ShareableStory"
import type { PlayerCardData } from "@/components/player/SanderCardFut"
import { captureNodeToBlob, shareOrDownloadBlob, makeQrDataUrl } from "@/lib/captureNode"

interface Props {
  playerData: PlayerCardData
  variant?: StoryVariant
  headline?: string
  subline?: string
  /** Button label. Defaults to a variant-appropriate CTA. */
  label?: string
  /** Visual style: "primary" (lime filled) or "ghost" (subtle). */
  tone?: "primary" | "ghost"
}

const DEFAULT_LABEL: Record<StoryVariant, string> = {
  card: "Condividi la mia carta",
  win: "Condividi la vittoria",
  levelup: "Condividi il traguardo",
  tier: "Condividi la carta",
  record: "Condividi il record",
}

function caption(variant: StoryVariant, url: string): string {
  const base: Record<StoryVariant, string> = {
    card: "La mia carta su SANDER 🏐",
    win: "Vittoria su SANDER 🏐",
    levelup: "Level up su SANDER 🏐",
    tier: "Nuova carta sbloccata su SANDER 🏐",
    record: "Nuovo record su SANDER 🏐",
  }
  return `${base[variant]} Crea la tua → ${url}`
}

export function ShareStoryButton({
  playerData,
  variant = "card",
  headline,
  subline,
  label,
  tone = "primary",
}: Props) {
  const storyRef = useRef<HTMLDivElement>(null)
  const [qr, setQr] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")

  // Absolute URL back to the app, tagged for attribution.
  const shareUrl =
    (typeof window !== "undefined" ? window.location.origin : "https://www.sanderbv.it") +
    "/?ref=story"

  // Generate the QR once (fails soft → URL text fallback in the story).
  useEffect(() => {
    let alive = true
    makeQrDataUrl(shareUrl).then((data) => {
      if (alive) setQr(data)
    })
    return () => {
      alive = false
    }
  }, [shareUrl])

  async function handleShare() {
    if (!storyRef.current) return
    setStatus("loading")
    try {
      const blob = await captureNodeToBlob(storyRef.current, { pixelRatio: 1 })
      const safeName = playerData.name.replace(/\s+/g, "_")
      const result = await shareOrDownloadBlob(
        blob,
        `SANDER_${variant}_${safeName}.png`,
        caption(variant, shareUrl.replace("/?ref=story", "")),
      )
      setStatus(result === "cancelled" ? "idle" : "done")
      if (result !== "cancelled") setTimeout(() => setStatus("idle"), 2500)
    } catch (err) {
      console.error("[ShareStory]", err)
      setStatus("error")
      setTimeout(() => setStatus("idle"), 3000)
    }
  }

  const primary = tone === "primary"
  const btnLabel = label ?? DEFAULT_LABEL[variant]

  return (
    <>
      {/* Off-screen 1080×1920 render target */}
      <div
        aria-hidden
        style={{ position: "fixed", top: 0, left: -99999, width: 1080, pointerEvents: "none" }}
      >
        <div ref={storyRef}>
          <ShareableStory
            playerData={playerData}
            variant={variant}
            headline={headline}
            subline={subline}
            qrDataUrl={qr}
            shareUrl={shareUrl.replace("/?ref=story", "")}
          />
        </div>
      </div>

      <button
        onClick={handleShare}
        disabled={status === "loading"}
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-base transition-opacity active:opacity-80"
        style={{
          background:
            status === "error"
              ? "rgba(239,68,68,0.1)"
              : primary
                ? "var(--accent)"
                : "rgba(201,243,29,0.08)",
          border: primary ? "none" : "1px solid rgba(201,243,29,0.25)",
          color: status === "error" ? "var(--danger)" : primary ? "#000" : "var(--accent)",
          opacity: status === "loading" ? 0.6 : 1,
          cursor: status === "loading" ? "wait" : "pointer",
        }}
      >
        {status === "loading" ? (
          <Download className="h-5 w-5 animate-bounce" />
        ) : status === "done" ? (
          <Check className="h-5 w-5" />
        ) : status === "error" ? (
          <AlertCircle className="h-5 w-5" />
        ) : (
          <Share2 className="h-5 w-5" />
        )}
        {status === "loading"
          ? "Preparando…"
          : status === "done"
            ? "Condivisa!"
            : status === "error"
              ? "Riprova"
              : btnLabel}
      </button>
    </>
  )
}
