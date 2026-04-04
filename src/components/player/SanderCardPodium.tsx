import { cn } from "@/lib/utils"
import type { PlayerCardData } from "./SanderCardFut"

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Constants (same as SanderCardFut — duplicated to avoid coupling)           */
/* ──────────────────────────────────────────────────────────────────────────── */

const SHADOW = "0.5px 0.5px 0px rgba(255,255,255,0.1), -0.5px -0.5px 0px rgba(0,0,0,0.6)"
const FONT = "'Chakra Petch', sans-serif"

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Position → frame & text color                                              */
/* ──────────────────────────────────────────────────────────────────────────── */

const PODIUM_FRAMES: Record<1 | 2 | 3, string> = {
  1: "/assets/cards/podium_1.png",
  2: "/assets/cards/podium_2.png",
  3: "/assets/cards/podium_3.png",
}

const PODIUM_COLORS: Record<1 | 2 | 3, string> = {
  1: "#5e3a00", // Gold
  2: "#2d2d2d", // Silver
  3: "#4a2c1d", // Bronze
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Stat positioning (20x20 grid — identical to SanderCardFut)                 */
/* ──────────────────────────────────────────────────────────────────────────── */

const STAT_POSITIONS: { key: keyof PlayerCardData["stats"]; left: string }[] = [
  { key: "att", left: "28.125%" },
  { key: "dif", left: "36.25%" },
  { key: "ric", left: "44.375%" },
  { key: "mur", left: "52.5%" },
  { key: "alz", left: "60.625%" },
  { key: "sta", left: "68.75%" },
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
/*  Component                                                                  */
/* ──────────────────────────────────────────────────────────────────────────── */

interface SanderCardPodiumProps {
  playerData: PlayerCardData
  position: 1 | 2 | 3
  className?: string
}

export function SanderCardPodium({ playerData, position, className }: SanderCardPodiumProps) {
  const glicko = Math.round(playerData.glicko2)
  const frame = PODIUM_FRAMES[position]
  const textColor = PODIUM_COLORS[position]
  const roleAbbr = playerData.stats.mur > playerData.stats.dif ? "MUR" : "DIF"

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link
        href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@700&display=swap"
        rel="stylesheet"
      />

      <div
        className={cn(
          "relative mx-auto w-full max-w-[400px] select-none overflow-hidden bg-transparent",
          className,
        )}
        style={{ aspectRatio: "1 / 1" }}
      >
        {/* Z-0 — Player photo */}
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

        {/* Z-10 — PNG template frame */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frame}
          alt="Card frame"
          crossOrigin="anonymous"
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          style={{ zIndex: 10 }}
        />

        {/* Z-20 — Data elements */}

        {/* Glicko Rating — Row 3.5, Col 4.5 */}
        <span
          className="absolute text-sm font-bold uppercase leading-none"
          style={{
            top: "17.5%",
            left: "22.5%",
            zIndex: 20,
            fontFamily: FONT,
            letterSpacing: "0.05em",
            color: textColor,
            textShadow: SHADOW,
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
            color: textColor,
            textShadow: SHADOW,
          }}
        >
          {roleAbbr}
        </span>

        {/* Player Name — Row 10.458 (auto-scale to fit) */}
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
              color: textColor,
              textShadow: SHADOW,
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
              color: textColor,
              textShadow: SHADOW,
            }}
          >
            {playerData.stats[key]}
          </span>
        ))}
      </div>
    </>
  )
}
