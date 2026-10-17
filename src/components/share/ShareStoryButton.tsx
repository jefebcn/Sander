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
  /**
   * Build the hidden story (its card frame and logo are several MB of images)
   * and the QR only when the button is about to be used, not on page load.
   * For screens many people open but few share from, like the home.
   */
  lazy?: boolean
}

/** Resolves after React has committed and the browser has painted once. */
function nextPaint(): Promise<void> {
  return new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())))
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
  lazy = false,
}: Props) {
  const storyRef = useRef<HTMLDivElement>(null)
  const [armed, setArmed] = useState(!lazy)
  const [qr, setQr] = useState<string | null>(null)
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle")

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://www.sanderbv.it"
  // QR + caption point to the conversion landing; the displayed text stays clean.
  const landingUrl = `${origin}/scarica?ref=story`

  // Generate the QR once (fails soft → URL text fallback in the story).
  useEffect(() => {
    if (!armed) return
    let alive = true
    makeQrDataUrl(landingUrl).then((data) => {
      if (alive) setQr(data)
    })
    return () => {
      alive = false
    }
  }, [landingUrl, armed])

  async function handleShare() {
    setStatus("loading")
    if (!armed || !qr) {
      // First use of a lazy button (or the QR isn't ready yet): build the
      // story with its QR, let it render, then capture it.
      setQr(qr ?? (await makeQrDataUrl(landingUrl)))
      setArmed(true)
      await nextPaint()
    }
    const node = storyRef.current
    if (!node) {
      setStatus("idle")
      return
    }
    try {
      const blob = await captureNodeToBlob(node, { pixelRatio: 1 })
      const safeName = playerData.name.replace(/\s+/g, "_")
      const result = await shareOrDownloadBlob(
        blob,
        `SANDER_${variant}_${safeName}.png`,
        caption(variant, `${origin}/scarica`),
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
      {armed && (
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
              shareUrl={origin}
            />
          </div>
        </div>
      )}

      <button
        onClick={handleShare}
        // Start loading the story's images as the finger lands, not on release.
        onPointerDown={() => setArmed(true)}
        onFocus={() => setArmed(true)}
        disabled={status === "loading"}
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-base transition-opacity active:opacity-80"
        style={{
          background:
            status === "error"
              ? "color-mix(in srgb, var(--danger) 10%, transparent)"
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
