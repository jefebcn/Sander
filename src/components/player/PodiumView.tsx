"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { Trophy, Share2, Download } from "lucide-react"
import { SanderCardPodium } from "./SanderCardPodium"
import { playerToCardData } from "./SanderCardFut"
import type { PlayerCardData } from "./SanderCardFut"
import type { Player } from "@/generated/prisma/client"

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Types                                                                      */
/* ──────────────────────────────────────────────────────────────────────────── */

export interface PodiumEntry {
  player: Player
  wins: number
  position: 1 | 2 | 3
}

interface Props {
  podium: PodiumEntry[]
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Share helper (same pattern as ShareCardButton)                             */
/* ──────────────────────────────────────────────────────────────────────────── */

function waitForImages(el: HTMLElement): Promise<void> {
  const imgs = Array.from(el.querySelectorAll<HTMLImageElement>("img"))
  return Promise.all(
    imgs.map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.onload = () => resolve()
            img.onerror = () => resolve()
          }),
    ),
  ).then(() => undefined)
}

async function captureAndShare(node: HTMLElement, name: string) {
  const { toPng } = await import("html-to-image")
  await waitForImages(node)
  await new Promise((r) => setTimeout(r, 350))

  const opts = {
    pixelRatio: 2,
    cacheBust: true,
    skipFonts: false,
    fetchRequestInit: { mode: "cors" as RequestMode },
  }

  // Two-pass rendering (warm cache, then capture)
  await toPng(node, opts)
  const dataUrl = await toPng(node, opts)

  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const safeName = name.replace(/\s+/g, "_")
  const file = new File([blob], `SanderPodium_${safeName}.png`, { type: "image/png" })

  if (
    typeof navigator !== "undefined" &&
    navigator.share &&
    navigator.canShare?.({ files: [file] })
  ) {
    await navigator.share({ files: [file], title: `${name} — Podio del Mese` })
  } else {
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `SanderPodium_${safeName}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Individual podium slot                                                     */
/* ──────────────────────────────────────────────────────────────────────────── */

const POSITION_LABELS: Record<1 | 2 | 3, string> = { 1: "1\u00B0", 2: "2\u00B0", 3: "3\u00B0" }
const MEDAL_COLORS: Record<1 | 2 | 3, string> = {
  1: "var(--gold)",
  2: "var(--silver)",
  3: "var(--bronze)",
}

function PodiumSlot({ entry, isCenter }: { entry: PodiumEntry; isCenter: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [sharing, setSharing] = useState(false)
  const cardData: PlayerCardData = playerToCardData(entry.player)

  async function handleShare() {
    if (!cardRef.current) return
    setSharing(true)
    try {
      await captureAndShare(cardRef.current, entry.player.name)
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("[PodiumShare]", err)
      }
    } finally {
      setSharing(false)
    }
  }

  return (
    <div
      className="flex flex-col items-center gap-2"
      style={{ flex: isCenter ? "1.2" : "1", marginTop: isCenter ? 0 : "2rem" }}
    >
      {/* Position badge */}
      <span
        className="text-lg font-black"
        style={{ color: MEDAL_COLORS[entry.position] }}
      >
        {POSITION_LABELS[entry.position]}
      </span>

      {/* Card (visible) */}
      <Link href={`/players/${entry.player.id}`} className="w-full">
        <SanderCardPodium
          playerData={cardData}
          position={entry.position}
        />
      </Link>

      {/* Win count */}
      <p className="text-sm font-bold text-white">
        {entry.wins} {entry.wins === 1 ? "vittoria" : "vittorie"}
      </p>

      {/* Share button */}
      <button
        onClick={handleShare}
        disabled={sharing}
        className="flex min-h-[2.5rem] items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold"
        style={{
          background: "rgba(201,243,29,0.07)",
          border: "1px solid rgba(201,243,29,0.2)",
          color: "var(--accent)",
          opacity: sharing ? 0.6 : 1,
          cursor: sharing ? "wait" : "pointer",
        }}
      >
        {sharing ? (
          <Download className="h-3.5 w-3.5 animate-bounce" />
        ) : (
          <Share2 className="h-3.5 w-3.5" />
        )}
        {sharing ? "..." : "Condividi"}
      </button>

      {/* Off-screen render target for share */}
      <div
        aria-hidden
        className="pointer-events-none fixed"
        style={{ top: "-9999px", left: "-9999px", width: "400px" }}
      >
        <div ref={cardRef}>
          <SanderCardPodium playerData={cardData} position={entry.position} />
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Main component                                                             */
/* ──────────────────────────────────────────────────────────────────────────── */

export function PodiumView({ podium }: Props) {
  if (podium.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 pt-16 text-center px-4">
        <Trophy className="h-12 w-12 opacity-20" />
        <p className="text-[var(--muted-text)]">Nessuna partita questo mese</p>
      </div>
    )
  }

  const first = podium.find((e) => e.position === 1)
  const second = podium.find((e) => e.position === 2)
  const third = podium.find((e) => e.position === 3)

  return (
    <div className="px-4">
      {/* Month label */}
      <p className="text-center text-sm font-bold text-[var(--muted-text)] pb-4">
        {new Date().toLocaleDateString("it-IT", { month: "long", year: "numeric" })}
      </p>

      {/* Podium: 2nd | 1st | 3rd in stepped arrangement */}
      <div className="flex items-start justify-center gap-2">
        {second ? (
          <PodiumSlot entry={second} isCenter={false} />
        ) : (
          <div className="flex-1" />
        )}
        {first ? (
          <PodiumSlot entry={first} isCenter={true} />
        ) : (
          <div style={{ flex: 1.2 }} />
        )}
        {third ? (
          <PodiumSlot entry={third} isCenter={false} />
        ) : (
          <div className="flex-1" />
        )}
      </div>
    </div>
  )
}
