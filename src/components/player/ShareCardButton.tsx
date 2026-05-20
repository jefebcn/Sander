"use client"

import { useRef, useState } from "react"
import { Share2, Download, AlertCircle } from "lucide-react"
import { SanderCardFut } from "./SanderCardFut"
import type { PlayerCardData } from "./SanderCardFut"

interface Props {
  playerData: PlayerCardData
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/** Replace every external <img> src with a same-origin proxy URL so
 *  html-to-image can inline them without CORS issues.
 *  Returns a cleanup function that restores original srcs. */
async function inlineImages(node: HTMLElement): Promise<() => void> {
  const imgs = Array.from(node.querySelectorAll<HTMLImageElement>("img"))
  const restorers: (() => void)[] = []

  await Promise.all(
    imgs.map(async (img) => {
      const src = img.src
      if (!src || src.startsWith("data:") || src.startsWith(window.location.origin)) return
      try {
        const proxied = `/api/img-proxy?url=${encodeURIComponent(src)}`
        const res = await fetch(proxied)
        if (!res.ok) return
        const dataUrl = await blobToDataUrl(await res.blob())
        img.src = dataUrl
        restorers.push(() => { img.src = src })
      } catch {
        // leave original src — capture may still succeed
      }
    }),
  )

  // Wait for re-paint after src swaps
  await new Promise((r) => setTimeout(r, 150))
  return () => restorers.forEach((r) => r())
}

export function ShareCardButton({ playerData }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  async function captureCard(): Promise<Blob> {
    const { toPng } = await import("html-to-image")
    const node = cardRef.current
    if (!node) throw new Error("Card element not found")

    // Wait for all <img> to finish loading
    const imgs = Array.from(node.querySelectorAll<HTMLImageElement>("img"))
    await Promise.all(
      imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((res) => {
              img.onload = () => res()
              img.onerror = () => res()
            }),
      ),
    )

    // Inline external images via proxy to avoid CORS canvas taint
    const restore = await inlineImages(node)

    const opts = { pixelRatio: 2, cacheBust: true, skipFonts: false }

    try {
      // First pass warms html-to-image's internal font/asset cache
      await toPng(node, opts)
      // Second pass produces the clean render
      const dataUrl = await toPng(node, opts)
      const res = await fetch(dataUrl)
      return res.blob()
    } finally {
      restore()
    }
  }

  async function handleShare() {
    setLoading(true)
    setError(false)
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
        // Desktop / unsupported browser: trigger download
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
        setError(true)
      }
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
          background: error ? "rgba(239,68,68,0.07)" : "rgba(201,243,29,0.07)",
          border: `1px solid ${error ? "rgba(239,68,68,0.3)" : "rgba(201,243,29,0.2)"}`,
          color: error ? "var(--danger)" : "var(--accent)",
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
        {loading ? "Preparando…" : error ? "Riprova" : "Condividi Carta"}
      </button>
    </>
  )
}
