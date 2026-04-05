"use client"

import { useState, useRef } from "react"
import { X, Share2, Download } from "lucide-react"
import { createPortal } from "react-dom"
import type { PlayerCardData } from "@/components/player/SanderCardFut"

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Constants                                                                  */
/* ──────────────────────────────────────────────────────────────────────────── */

const FONT = "'Chakra Petch', sans-serif"

const PODIUM_FRAMES: Record<number, string> = {
  1: "/assets/cards/podium_1.png",
  2: "/assets/cards/podium_2.png",
  3: "/assets/cards/podium_3.png",
}

/** White text with dark relief shadow — optimised for podium cards */
const PODIUM_SHADOW =
  "1px 1px 2px rgba(0,0,0,0.8), -0.5px -0.5px 0px rgba(255,255,255,0.15)"

/** Gold Master stat column positions — 20×20 grid */
const STAT_POSITIONS: { key: keyof PlayerCardData["stats"]; left: string }[] = [
  { key: "att", left: "28.125%" },  // Col 5.625
  { key: "dif", left: "36.25%" },   // Col 7.25
  { key: "ric", left: "44.375%" },  // Col 8.875
  { key: "mur", left: "52.5%" },    // Col 10.5
  { key: "alz", left: "60.625%" },  // Col 12.125
  { key: "sta", left: "68.75%" },   // Col 13.75
]

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Flag via CDN                                                               */
/* ──────────────────────────────────────────────────────────────────────────── */

function FlagIcon({ code }: { code: string }) {
  const iso = code.toLowerCase()
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w80/${iso}.png`}
      alt={code}
      crossOrigin="anonymous"
      className="h-full w-full object-cover"
      loading="eager"
    />
  )
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Minimal Podium Preview (template + photo only, no text)                    */
/* ──────────────────────────────────────────────────────────────────────────── */

function PodiumPreview({
  playerData,
  position,
  onClick,
}: {
  playerData: PlayerCardData
  position: number
  onClick: () => void
}) {
  const frame = PODIUM_FRAMES[position]

  return (
    <button
      onClick={onClick}
      className="relative w-full select-none overflow-hidden rounded-2xl bg-transparent active:scale-95 transition-transform"
      style={{ aspectRatio: "1 / 1" }}
    >
      {/* Photo layer */}
      {playerData.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={playerData.imageUrl}
          alt={playerData.name}
          className="absolute object-cover object-center"
          style={{ zIndex: 0, top: "15%", left: "35%", width: "40%", height: "35%" }}
        />
      ) : (
        <div
          className="absolute flex items-center justify-center text-xl font-black"
          style={{
            zIndex: 0,
            top: "15%",
            left: "35%",
            width: "40%",
            height: "35%",
            fontFamily: FONT,
            color: "rgba(255,255,255,.5)",
          }}
        >
          {playerData.name.slice(0, 2).toUpperCase()}
        </div>
      )}

      {/* Template frame */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={frame}
        alt={`Podio ${position}`}
        className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        style={{ zIndex: 10 }}
      />
    </button>
  )
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Full Podium Card (white text, all data)                                    */
/* ──────────────────────────────────────────────────────────────────────────── */

function PodiumCardFull({
  playerData,
  position,
  cardRef,
}: {
  playerData: PlayerCardData
  position: number
  cardRef?: React.Ref<HTMLDivElement>
}) {
  const frame = PODIUM_FRAMES[position]
  const glicko = Math.round(playerData.glicko2)
  const roleAbbr = playerData.stats.mur > playerData.stats.dif ? "MUR" : "DIF"

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@700&display=swap"
        rel="stylesheet"
      />

      <div
        ref={cardRef}
        className="relative mx-auto w-full max-w-[400px] select-none overflow-hidden bg-transparent"
        style={{ aspectRatio: "1 / 1" }}
      >
        {/* Z-0 — Player photo (rows 3–10, cols 7–15) */}
        {playerData.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={playerData.imageUrl}
            alt={playerData.name}
            crossOrigin="anonymous"
            className="absolute object-cover object-center"
            style={{ zIndex: 0, top: "15%", left: "35%", width: "40%", height: "35%" }}
          />
        ) : (
          <div
            className="absolute flex items-center justify-center text-3xl font-black"
            style={{
              zIndex: 0,
              top: "15%",
              left: "35%",
              width: "40%",
              height: "35%",
              fontFamily: FONT,
              color: "rgba(255,255,255,.5)",
            }}
          >
            {playerData.name.slice(0, 2).toUpperCase()}
          </div>
        )}

        {/* Z-10 — Podium template frame */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frame}
          alt="Podium frame"
          crossOrigin="anonymous"
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          style={{ zIndex: 10 }}
        />

        {/* Z-20 — Data: ALL WHITE (#FFFFFF) */}

        {/* Glicko Rating — Row 3.5, Col 4.5 */}
        <span
          className="absolute text-sm font-bold uppercase leading-none"
          style={{
            top: "17.5%",
            left: "22.5%",
            zIndex: 20,
            fontFamily: FONT,
            letterSpacing: "0.05em",
            color: "#FFFFFF",
            textShadow: PODIUM_SHADOW,
          }}
        >
          {glicko}
        </span>

        {/* Flag — Row 4.5, Col 4.5 */}
        <div
          className="absolute overflow-hidden rounded-[2px]"
          style={{
            top: "22.5%",
            left: "22.5%",
            width: "8%",
            zIndex: 20,
          }}
        >
          <FlagIcon code={playerData.nationalityCode} />
        </div>

        {/* Role — Row 6.0, Col 4.5 */}
        <span
          className="absolute font-bold uppercase"
          style={{
            top: "30%",
            left: "22.5%",
            fontSize: "10px",
            zIndex: 20,
            fontFamily: FONT,
            color: "#FFFFFF",
            textShadow: PODIUM_SHADOW,
          }}
        >
          {roleAbbr}
        </span>

        {/* Player Name — Row 10.458, Col 6.0–14.0 (auto-scale) */}
        <div
          className="absolute flex items-center justify-center"
          style={{
            top: "52.29%",
            left: "30%",
            width: "40%",
            containerType: "inline-size",
            zIndex: 20,
          }}
        >
          <span
            className="font-bold uppercase text-center"
            style={{
              fontFamily: FONT,
              fontSize: "clamp(0.8rem, 4cqi, 1.125rem)",
              whiteSpace: "nowrap",
              letterSpacing: "0.04em",
              color: "#FFFFFF",
              textShadow: PODIUM_SHADOW,
            }}
          >
            {playerData.name}
          </span>
        </div>

        {/* Stats — Row 14.0 */}
        {STAT_POSITIONS.map(({ key, left }) => (
          <span
            key={key}
            className="absolute text-sm font-bold leading-none"
            style={{
              top: "70%",
              left,
              zIndex: 20,
              fontFamily: FONT,
              letterSpacing: "0.05em",
              color: "#FFFFFF",
              textShadow: PODIUM_SHADOW,
            }}
          >
            {playerData.stats[key]}
          </span>
        ))}
      </div>
    </>
  )
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Podium Detail Modal                                                        */
/* ──────────────────────────────────────────────────────────────────────────── */

function PodiumModal({
  playerData,
  position,
  onClose,
}: {
  playerData: PlayerCardData
  position: number
  onClose: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [saving, setSaving] = useState(false)

  async function handleShare() {
    setSaving(true)
    try {
      const { toPng } = await import("html-to-image")
      const node = cardRef.current
      if (!node) return

      // Wait for images
      const imgs = Array.from(node.querySelectorAll<HTMLImageElement>("img"))
      await Promise.all(
        imgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.onload = () => resolve()
                img.onerror = () => resolve()
              }),
        ),
      )
      await new Promise((r) => setTimeout(r, 350))

      const opts = {
        pixelRatio: 2,
        cacheBust: true,
        skipFonts: false,
        fetchRequestInit: { mode: "cors" as RequestMode },
      }
      await toPng(node, opts)
      const dataUrl = await toPng(node, opts)
      const res = await fetch(dataUrl)
      const blob = await res.blob()

      const safeName = playerData.name.replace(/\s+/g, "_")
      const file = new File([blob], `Podio_${position}_${safeName}.png`, {
        type: "image/png",
      })

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `Podio #${position} — ${playerData.name}` })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = file.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      if (err instanceof Error && err.name !== "AbortError") {
        console.error("[PodiumShare]", err)
      }
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[85] flex flex-col items-center justify-center p-6">
        <div className="relative w-full max-w-[360px]">
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute -top-3 -right-3 z-[90] flex h-8 w-8 items-center justify-center rounded-full bg-white/10 backdrop-blur-sm text-white active:opacity-70"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Card */}
          <PodiumCardFull
            playerData={playerData}
            position={position}
            cardRef={cardRef}
          />

          {/* Share button */}
          <button
            onClick={handleShare}
            disabled={saving}
            className="mt-4 flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-semibold"
            style={{
              background: "rgba(201,243,29,0.07)",
              border: "1px solid rgba(201,243,29,0.2)",
              color: "var(--accent)",
              opacity: saving ? 0.6 : 1,
              cursor: saving ? "wait" : "pointer",
            }}
          >
            {saving ? (
              <Download className="h-4 w-4 animate-bounce" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
            {saving ? "Preparando..." : "Salva / Condividi"}
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Main: Podio del Mese section                                               */
/* ──────────────────────────────────────────────────────────────────────────── */

export interface PodiumPlayer {
  playerData: PlayerCardData
  position: number // 1, 2, or 3
}

export function PodiumSection({ players }: { players: PodiumPlayer[] }) {
  const [selected, setSelected] = useState<PodiumPlayer | null>(null)

  // Build lookup by position for visual 2-1-3 arrangement
  const byPos: Record<number, PodiumPlayer> = {}
  for (const p of players) byPos[p.position] = p

  return (
    <div className="slide-up stagger-3 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-lg">🏆</span>
        <p className="text-sm font-bold text-white/80">Podio del mese</p>
      </div>

      {players.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <span className="text-4xl">🏆</span>
          <p className="text-sm text-white/50">Nessuna partita registrata questo mese</p>
        </div>
      ) : (
        /* 2-1-3 podium layout: 2nd left, 1st center (elevated), 3rd right */
        <div className="flex items-end gap-2">
          {/* 2nd place — left, baseline */}
          {byPos[2] && (
            <div className="flex-1">
              <PodiumPreview
                playerData={byPos[2].playerData}
                position={2}
                onClick={() => setSelected(byPos[2])}
              />
              <div className="mt-1.5 text-center">
                <p className="text-xs font-bold text-white truncate">{byPos[2].playerData.name}</p>
                <p className="text-[0.6rem] font-bold uppercase tracking-wider" style={{ color: "#A8A8A8" }}>
                  🥈 2° Posto
                </p>
              </div>
            </div>
          )}

          {/* 1st place — center, elevated + slightly larger */}
          {byPos[1] && (
            <div className="flex-[1.1]" style={{ transform: "translateY(-1rem)" }}>
              <PodiumPreview
                playerData={byPos[1].playerData}
                position={1}
                onClick={() => setSelected(byPos[1])}
              />
              <div className="mt-1.5 text-center">
                <p className="text-xs font-bold text-white truncate">{byPos[1].playerData.name}</p>
                <p className="text-[0.6rem] font-bold uppercase tracking-wider" style={{ color: "#FFD700" }}>
                  🏆 1° Posto
                </p>
              </div>
            </div>
          )}

          {/* 3rd place — right, baseline */}
          {byPos[3] && (
            <div className="flex-1">
              <PodiumPreview
                playerData={byPos[3].playerData}
                position={3}
                onClick={() => setSelected(byPos[3])}
              />
              <div className="mt-1.5 text-center">
                <p className="text-xs font-bold text-white truncate">{byPos[3].playerData.name}</p>
                <p className="text-[0.6rem] font-bold uppercase tracking-wider" style={{ color: "#CD7F32" }}>
                  🥉 3° Posto
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <PodiumModal
          playerData={selected.playerData}
          position={selected.position}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}
