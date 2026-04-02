"use client"

import { useRef, useState } from "react"
import { Share2, Download } from "lucide-react"
import { SanderCardFut } from "./SanderCardFut"
import type { PlayerCardData } from "./SanderCardFut"

interface Props {
  playerData: PlayerCardData
}

/** Wait until every <img> inside el has finished loading (or errored). */
function waitForImages(el: HTMLElement): Promise<void> {
  const imgs = Array.from(el.querySelectorAll<HTMLImageElement>("img"))
  return Promise.all(
    imgs.map(
      (img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              img.onload = () => resolve()
              img.onerror = () => resolve() // don't block on broken images
            }),
    ),
  ).then(() => undefined)
}

export function ShareCardButton({ playerData }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)

  async function captureCard(): Promise<Blob> {
    const { toPng } = await import("html-to-image")
    const node = cardRef.current
    if (!node) throw new Error("Card element not found")

    // 1. Wait for all images (frame PNG, flag CDN, avatar) to finish loading
    await waitForImages(node)

    // 2. Short buffer for fonts (Chakra Petch) and layout paint
    await new Promise((r) => setTimeout(r, 350))

    const opts = {
      pixelRatio: 2,
      cacheBust: true,
      skipFonts: false,
      fetchRequestInit: { mode: "cors" as RequestMode },
    }

    // 3. First pass warms html-to-image's internal asset cache
    await toPng(node, opts)
    // 4. Second pass produces the clean, fully-rendered image
    const dataUrl = await toPng(node, opts)

    const res = await fetch(dataUrl)
    return res.blob()
  }

  async function handleShare() {
    setLoading(true)
    try {
      const blob = await captureCard()
      const safeName = playerData.name.replace(/\s+/g, "_")
      const file = new File([blob], `SanderCard_${safeName}.png`, { type: "image/png" })

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
        // Desktop / unsupported browser: download PNG
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `SanderCard_${safeName}.png`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("[ShareCard]", err)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/*
        Off-screen render target.
        - Fixed + far off-screen so it never affects layout
        - No debug grid rendered here (SanderCardFut never mounts the grid)
        - Width 400px matches the card's max-w-[400px]
      */}
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
          background: "rgba(201,243,29,0.07)",
          border: "1px solid rgba(201,243,29,0.2)",
          color: "var(--accent)",
          opacity: loading ? 0.6 : 1,
          cursor: loading ? "wait" : "pointer",
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
