import {
  Swords,
  Shield,
  Target,
  Hand,
  ChevronsUp,
  Zap,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Types                                                                      */
/* ──────────────────────────────────────────────────────────────────────────── */

export interface PlayerCardData {
  name: string
  glicko2: number
  nationalityCode: string
  role: string
  stats: {
    att: number
    dif: number
    ric: number
    mur: number
    alz: number
    sta: number
  }
  imageUrl?: string | null
}

interface SanderCardFutProps {
  playerData: PlayerCardData
  className?: string
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Rarity system                                                              */
/* ──────────────────────────────────────────────────────────────────────────── */

type Rarity =
  | "bronze"
  | "bronzeRare"
  | "silver"
  | "silverRare"
  | "gold"
  | "goldRare"

function getRarity(glicko2: number): Rarity {
  if (glicko2 >= 2400) return "goldRare"
  if (glicko2 >= 2000) return "gold"
  if (glicko2 >= 1700) return "silverRare"
  if (glicko2 >= 1500) return "silver"
  if (glicko2 >= 1200) return "bronzeRare"
  return "bronze"
}

/** Map raw Glicko-2 (typically 600-2800) to a 1-99 overall display value. */
function glickoToOverall(glicko: number): number {
  const raw = 20 + glicko / 30
  return Math.min(99, Math.max(1, Math.round(raw)))
}

/** ISO-3166-1 alpha-2 country code to flag emoji. */
function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("")
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Rarity visual configs                                                      */
/* ──────────────────────────────────────────────────────────────────────────── */

interface RarityStyle {
  /** Main card background gradient */
  bg: string
  /** Photo frame & accent border color */
  border: string
  /** Primary text color */
  text: string
  /** Stat value / accent text */
  accent: string
  /** Stat section background */
  statBg: string
  /** Circuit pattern opacity */
  circuitOpacity: number
  /** Shows animated shine on hover */
  isRare: boolean
  /** Extra CSS class on outer shell */
  shellClass: string
}

const RARITY: Record<Rarity, RarityStyle> = {
  bronze: {
    bg: "linear-gradient(165deg, #A0784C 0%, #8B6914 20%, #7A5A2E 45%, #96723C 70%, #A0784C 100%)",
    border: "#8B6914",
    text: "#F5E6D0",
    accent: "#D4A843",
    statBg: "rgba(100, 72, 30, 0.75)",
    circuitOpacity: 0.08,
    isRare: false,
    shellClass: "",
  },
  bronzeRare: {
    bg: "linear-gradient(165deg, #B8860B 0%, #D4A843 20%, #CD7F32 40%, #E8C06A 65%, #B8860B 100%)",
    border: "#CD7F32",
    text: "#FFF5E6",
    accent: "#FFD700",
    statBg: "rgba(160, 120, 30, 0.65)",
    circuitOpacity: 0.1,
    isRare: true,
    shellClass: "fut-shine",
  },
  silver: {
    bg: "linear-gradient(165deg, #8A939E 0%, #B8C4CE 20%, #808B96 45%, #A0ABB5 70%, #8A939E 100%)",
    border: "#9CA3AF",
    text: "#F0F0F0",
    accent: "#D4D4D4",
    statBg: "rgba(100, 110, 125, 0.75)",
    circuitOpacity: 0.08,
    isRare: false,
    shellClass: "",
  },
  silverRare: {
    bg: "linear-gradient(165deg, #B0BEC5 0%, #E0E8F0 20%, #A0B0C0 40%, #D0D8E0 65%, #B0BEC5 100%)",
    border: "#C0CCD8",
    text: "#FFFFFF",
    accent: "#F0F4FF",
    statBg: "rgba(140, 155, 170, 0.65)",
    circuitOpacity: 0.1,
    isRare: true,
    shellClass: "fut-holo",
  },
  gold: {
    bg: "linear-gradient(165deg, #C8960C 0%, #F0C420 20%, #B8860B 45%, #DAA520 70%, #C8960C 100%)",
    border: "#DAA520",
    text: "#FFF8E0",
    accent: "#FFD700",
    statBg: "rgba(150, 110, 10, 0.75)",
    circuitOpacity: 0.08,
    isRare: false,
    shellClass: "",
  },
  goldRare: {
    bg: "linear-gradient(165deg, #FFD700 0%, #FFF0A0 20%, #E0B000 40%, #FFE44D 60%, #DAA520 80%, #FFD700 100%)",
    border: "#FFE44D",
    text: "#FFFFFF",
    accent: "#FFF8D0",
    statBg: "rgba(190, 150, 20, 0.6)",
    circuitOpacity: 0.12,
    isRare: true,
    shellClass: "fut-shimmer",
  },
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Stat definitions                                                           */
/* ──────────────────────────────────────────────────────────────────────────── */

interface StatDef {
  key: keyof PlayerCardData["stats"]
  label: string
  Icon: LucideIcon
}

const STATS: StatDef[] = [
  { key: "att", label: "ATT", Icon: Swords },
  { key: "dif", label: "DIF", Icon: Shield },
  { key: "ric", label: "RIC", Icon: Target },
  { key: "mur", label: "MUR", Icon: Hand },
  { key: "alz", label: "ALZ", Icon: ChevronsUp },
  { key: "sta", label: "STA", Icon: Zap },
]

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Circuit board SVG pattern (data URI)                                       */
/* ──────────────────────────────────────────────────────────────────────────── */

const CIRCUIT_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cpath d='M0 50h35m10 0h55M50 0v35m0 10v55' stroke='white' stroke-width='.6' opacity='.35' fill='none'/%3E%3Ccircle cx='50' cy='50' r='3' stroke='white' stroke-width='.5' opacity='.3' fill='none'/%3E%3Ccircle cx='50' cy='50' r='1' fill='white' opacity='.35'/%3E%3Cpath d='M25 0v20h-25M75 100v-20h25' stroke='white' stroke-width='.4' opacity='.2' fill='none'/%3E%3Ccircle cx='25' cy='20' r='1.5' fill='white' opacity='.2'/%3E%3Ccircle cx='75' cy='80' r='1.5' fill='white' opacity='.2'/%3E%3Cpath d='M0 75h12l4-4h6' stroke='white' stroke-width='.3' opacity='.15' fill='none'/%3E%3Cpath d='M100 25h-12l-4 4h-6' stroke='white' stroke-width='.3' opacity='.15' fill='none'/%3E%3C/svg%3E")`

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Shield clip-path                                                           */
/* ──────────────────────────────────────────────────────────────────────────── */

const SHIELD_CLIP =
  "polygon(3% 0%, 97% 0%, 100% 2%, 100% 85%, 60% 96%, 50% 100%, 40% 96%, 0% 85%, 0% 2%)"

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Component                                                                  */
/* ──────────────────────────────────────────────────────────────────────────── */

export function SanderCardFut({ playerData, className }: SanderCardFutProps) {
  const rarity = getRarity(playerData.glicko2)
  const s = RARITY[rarity]
  const overall = glickoToOverall(playerData.glicko2)
  const flag = countryFlag(playerData.nationalityCode)

  return (
    <div
      className={cn("relative mx-auto w-full max-w-[340px]", className)}
      style={{ aspectRatio: "5 / 7" }}
    >
      {/* ── Shield shell ──────────────────────────────────────────────── */}
      <div
        className={cn(
          "absolute inset-0 overflow-hidden",
          s.shellClass,
        )}
        style={{
          clipPath: SHIELD_CLIP,
          background: s.bg,
        }}
      >
        {/* Circuit-board pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: CIRCUIT_SVG,
            backgroundSize: "100px 100px",
            opacity: s.circuitOpacity,
          }}
        />

        {/* Brushed-metal texture (subtle noise) */}
        <div
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(255,255,255,0.015) 2px, rgba(255,255,255,0.015) 4px)",
          }}
        />

        {/* Decorative arc swoosh (right side) */}
        <div
          className="pointer-events-none absolute"
          style={{
            top: "8%",
            right: "4%",
            width: "30%",
            height: "52%",
            border: `2px solid ${s.border}`,
            borderLeft: "none",
            borderRadius: "0 50% 50% 0",
            opacity: 0.25,
          }}
        />

        {/* Shine overlay for Rare variants (animated on hover) */}
        {s.isRare && (
          <div className="fut-shine-overlay pointer-events-none absolute inset-0" />
        )}

        {/* Gold Rare sparkle particles */}
        {rarity === "goldRare" && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="fut-sparkle absolute rounded-full bg-white"
                style={{
                  width: i % 3 === 0 ? "3px" : "2px",
                  height: i % 3 === 0 ? "3px" : "2px",
                  top: `${12 + ((i * 37) % 70)}%`,
                  left: `${8 + ((i * 29) % 80)}%`,
                  animationDelay: `${i * 0.4}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* ── Card content ──────────────────────────────────────────── */}
        <div className="relative flex h-full flex-col">
          {/* ── Upper section: Name (vertical) + Photo + Rating ──── */}
          <div className="relative flex flex-1 min-h-0">
            {/* Vertical player name (left rail) */}
            <div
              className="flex w-[13%] items-center justify-center"
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
              }}
            >
              <span
                className="truncate text-base font-black uppercase tracking-[0.2em]"
                style={{
                  color: s.text,
                  textShadow: "0 1px 4px rgba(0,0,0,0.4)",
                  maxHeight: "75%",
                }}
              >
                {playerData.name}
              </span>
            </div>

            {/* Left vertical divider accent */}
            <div
              className="w-px self-stretch opacity-25"
              style={{ background: s.border }}
            />

            {/* Center: Photo */}
            <div className="flex flex-1 flex-col items-center justify-center pb-1 pt-[8%]">
              <div
                className="relative aspect-square w-[62%] overflow-hidden rounded-lg"
                style={{
                  border: `3px solid ${s.border}`,
                  boxShadow: `inset 0 2px 6px rgba(0,0,0,0.35), 0 3px 8px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.15)`,
                }}
              >
                {playerData.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={playerData.imageUrl}
                    alt={playerData.name}
                    className="h-full w-full object-cover object-[center_15%]"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-4xl font-black"
                    style={{
                      background: `linear-gradient(135deg, ${s.statBg}, rgba(0,0,0,0.3))`,
                      color: s.accent,
                    }}
                  >
                    {playerData.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Right column: Overall + Flag */}
            <div className="flex w-[22%] flex-col items-center gap-1 pt-[10%] pr-[4%]">
              <span
                className="text-[2.5rem] font-black leading-none"
                style={{
                  color: s.text,
                  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                {overall}
              </span>
              <span
                className="mt-1 rounded-sm border px-1.5 py-0.5 text-lg leading-none"
                style={{
                  borderColor: `${s.border}88`,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
                }}
              >
                {flag}
              </span>
            </div>
          </div>

          {/* ── Role banner ──────────────────────────────────────── */}
          <div
            className="relative mx-[5%] flex items-center justify-center py-2"
            style={{
              borderTop: `1px solid ${s.border}55`,
              borderBottom: `1px solid ${s.border}55`,
            }}
          >
            <span
              className="text-sm font-black uppercase tracking-[0.3em]"
              style={{
                color: s.text,
                textShadow: "0 1px 3px rgba(0,0,0,0.4)",
              }}
            >
              {playerData.role}
            </span>
          </div>

          {/* ── Stats section ────────────────────────────────────── */}
          <div
            className="mx-[3%] mt-1 rounded-xl px-2 py-2"
            style={{ background: s.statBg }}
          >
            {/* Stat icons row */}
            <div className="mb-1 grid grid-cols-6">
              {STATS.map(({ key, Icon }) => (
                <div key={key} className="flex justify-center">
                  <Icon
                    className="h-4 w-4"
                    style={{ color: s.accent, opacity: 0.8 }}
                    strokeWidth={2.5}
                  />
                </div>
              ))}
            </div>

            {/* Stat labels row */}
            <div className="mb-0.5 grid grid-cols-6">
              {STATS.map(({ key, label }) => (
                <span
                  key={key}
                  className="text-center text-[0.55rem] font-bold uppercase tracking-wider"
                  style={{ color: s.text, opacity: 0.6 }}
                >
                  {label}
                </span>
              ))}
            </div>

            {/* Stat values row */}
            <div className="grid grid-cols-6">
              {STATS.map(({ key }) => (
                <span
                  key={key}
                  className="text-center text-lg font-black leading-tight"
                  style={{
                    color: s.accent,
                    textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                  }}
                >
                  {playerData.stats[key]}
                </span>
              ))}
            </div>
          </div>

          {/* ── Club logo (SANDER) ───────────────────────────────── */}
          <div className="flex flex-1 items-center justify-center pb-[12%]">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{
                border: `1.5px solid ${s.border}66`,
                background: s.statBg,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/sander-logo.png"
                alt="Sander"
                className="h-5 w-5 object-contain"
                style={{ filter: "brightness(1.2)" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Outer drop shadow (outside clip-path via wrapper) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          clipPath: SHIELD_CLIP,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.15), inset 0 -1px 0 rgba(0,0,0,0.2)",
        }}
      />
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Helper: convert Prisma Player model to PlayerCardData                      */
/* ──────────────────────────────────────────────────────────────────────────── */

/** Compute a single stat value from distribution percentage + Glicko-2. */
function statValue(pct: number, glicko: number) {
  return Math.round(glicko / 40 + pct)
}

export interface PrismaPlayerLike {
  name: string
  glickoRating: number
  nationality?: string | null
  preferredRole: "BLOCKER" | "DEFENDER"
  avatarUrl?: string | null
  attPct: number
  difPct: number
  ricPct: number
  murPct: number
  alzPct: number
  staPct: number
}

/**
 * Convert a Prisma Player record into the props shape expected
 * by `<SanderCardFut>`.
 */
export function playerToCardData(player: PrismaPlayerLike): PlayerCardData {
  const g = player.glickoRating
  return {
    name: player.name,
    glicko2: g,
    nationalityCode: player.nationality ?? "IT",
    role: player.preferredRole === "BLOCKER" ? "MURO" : "DIFENSORE",
    stats: {
      att: statValue(player.attPct, g),
      dif: statValue(player.difPct, g),
      ric: statValue(player.ricPct, g),
      mur: statValue(player.murPct, g),
      alz: statValue(player.alzPct, g),
      sta: statValue(player.staPct, g),
    },
    imageUrl: player.avatarUrl,
  }
}
