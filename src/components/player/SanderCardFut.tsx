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

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Country flag SVG component                                                 */
/* ──────────────────────────────────────────────────────────────────────────── */

const FLAGS: Record<string, { colors: string[] }> = {
  IT: { colors: ["#009246", "#ffffff", "#CE2B37"] },
  FR: { colors: ["#0055A4", "#ffffff", "#EF4135"] },
  DE: { colors: ["#000000", "#DD0000", "#FFCE00"] },
  ES: { colors: ["#AA151B", "#F1BF00", "#AA151B"] },
  BR: { colors: ["#009739", "#FEDD00", "#009739"] },
  AR: { colors: ["#74ACDF", "#ffffff", "#74ACDF"] },
  NO: { colors: ["#EF2B2D", "#002868", "#EF2B2D"] },
}

function CountryFlag({ code }: { code: string }) {
  const upper = code.toUpperCase()
  const flag = FLAGS[upper]

  if (!flag) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-sm bg-gray-500 text-[0.45rem] font-black text-white">
        {upper}
      </div>
    )
  }

  // Vertical tricolor (IT, FR) vs horizontal (DE)
  const isHorizontal = upper === "DE"

  return (
    <svg viewBox="0 0 30 20" className="h-full w-full rounded-[2px]">
      {isHorizontal ? (
        <>
          <rect width="30" height="7" fill={flag.colors[0]} />
          <rect y="7" width="30" height="6" fill={flag.colors[1]} />
          <rect y="13" width="30" height="7" fill={flag.colors[2]} />
        </>
      ) : (
        <>
          <rect width="10" height="20" fill={flag.colors[0]} />
          <rect x="10" width="10" height="20" fill={flag.colors[1]} />
          <rect x="20" width="10" height="20" fill={flag.colors[2]} />
        </>
      )}
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Rarity visual configs                                                      */
/* ──────────────────────────────────────────────────────────────────────────── */

interface RarityStyle {
  bg: string
  bgDarker: string
  border: string
  text: string
  accent: string
  statBg: string
  circuitOpacity: number
  isRare: boolean
  shellClass: string
}

const RARITY: Record<Rarity, RarityStyle> = {
  bronze: {
    bg: "linear-gradient(170deg, #B0844A 0%, #8B6914 30%, #7A5A2E 55%, #96723C 80%, #A87840 100%)",
    bgDarker: "linear-gradient(170deg, #7A5A2E 0%, #6B4E20 50%, #7A5A2E 100%)",
    border: "#9B7530",
    text: "#F0DCC0",
    accent: "#E8C880",
    statBg: "rgba(80, 58, 20, 0.85)",
    circuitOpacity: 0.1,
    isRare: false,
    shellClass: "",
  },
  bronzeRare: {
    bg: "linear-gradient(170deg, #D4A843 0%, #CD7F32 30%, #B8860B 55%, #E8C06A 80%, #CD7F32 100%)",
    bgDarker: "linear-gradient(170deg, #9B7530 0%, #8B6914 50%, #9B7530 100%)",
    border: "#D4A843",
    text: "#FFF5E6",
    accent: "#FFD700",
    statBg: "rgba(120, 90, 20, 0.8)",
    circuitOpacity: 0.12,
    isRare: true,
    shellClass: "fut-shine",
  },
  silver: {
    bg: "linear-gradient(170deg, #A8B4BE 0%, #8A939E 30%, #7A8590 55%, #B0BCC6 80%, #98A4AE 100%)",
    bgDarker: "linear-gradient(170deg, #6E7880 0%, #606A72 50%, #6E7880 100%)",
    border: "#8A939E",
    text: "#F0F0F0",
    accent: "#D0D4D8",
    statBg: "rgba(70, 78, 88, 0.85)",
    circuitOpacity: 0.1,
    isRare: false,
    shellClass: "",
  },
  silverRare: {
    bg: "linear-gradient(170deg, #C8D4DE 0%, #A8B8C8 30%, #98AAB8 55%, #D8E0E8 80%, #B8C8D4 100%)",
    bgDarker: "linear-gradient(170deg, #8898A8 0%, #788898 50%, #8898A8 100%)",
    border: "#B0C0D0",
    text: "#FFFFFF",
    accent: "#E8F0F8",
    statBg: "rgba(90, 105, 120, 0.8)",
    circuitOpacity: 0.12,
    isRare: true,
    shellClass: "fut-holo",
  },
  gold: {
    bg: "linear-gradient(170deg, #E8B820 0%, #C8960C 30%, #B08008 55%, #E0B418 80%, #D0A010 100%)",
    bgDarker: "linear-gradient(170deg, #907010 0%, #806008 50%, #907010 100%)",
    border: "#D4A820",
    text: "#FFF8E0",
    accent: "#FFD700",
    statBg: "rgba(100, 78, 10, 0.85)",
    circuitOpacity: 0.1,
    isRare: false,
    shellClass: "",
  },
  goldRare: {
    bg: "linear-gradient(170deg, #FFE040 0%, #F0C420 30%, #E0B000 55%, #FFE860 80%, #F0C820 100%)",
    bgDarker: "linear-gradient(170deg, #B09020 0%, #A08018 50%, #B09020 100%)",
    border: "#FFE44D",
    text: "#FFFFFF",
    accent: "#FFF8D0",
    statBg: "rgba(140, 110, 10, 0.8)",
    circuitOpacity: 0.15,
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

const CIRCUIT_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M0 40h28m8 0h44M40 0v28m0 8v44' stroke='white' stroke-width='.7' opacity='.4' fill='none'/%3E%3Ccircle cx='40' cy='40' r='2.5' stroke='white' stroke-width='.6' opacity='.35' fill='none'/%3E%3Ccircle cx='40' cy='40' r='.8' fill='white' opacity='.4'/%3E%3Cpath d='M20 0v16h-20M60 80v-16h20' stroke='white' stroke-width='.5' opacity='.25' fill='none'/%3E%3Ccircle cx='20' cy='16' r='1.2' fill='white' opacity='.25'/%3E%3Ccircle cx='60' cy='64' r='1.2' fill='white' opacity='.25'/%3E%3Cpath d='M0 60h10l3-3h5' stroke='white' stroke-width='.4' opacity='.2' fill='none'/%3E%3Cpath d='M80 20h-10l-3 3h-5' stroke='white' stroke-width='.4' opacity='.2' fill='none'/%3E%3Cpath d='M70 0v8l-4 4' stroke='white' stroke-width='.3' opacity='.15' fill='none'/%3E%3Cpath d='M10 80v-8l4-4' stroke='white' stroke-width='.3' opacity='.15' fill='none'/%3E%3C/svg%3E")`

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Shield clip-path (compact, closer to FUT reference)                        */
/* ──────────────────────────────────────────────────────────────────────────── */

const SHIELD_CLIP =
  "polygon(0% 3%, 3% 0%, 97% 0%, 100% 3%, 100% 80%, 58% 94%, 50% 100%, 42% 94%, 0% 80%)"

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Component                                                                  */
/* ──────────────────────────────────────────────────────────────────────────── */

export function SanderCardFut({ playerData, className }: SanderCardFutProps) {
  const rarity = getRarity(playerData.glicko2)
  const s = RARITY[rarity]
  const overall = glickoToOverall(playerData.glicko2)

  return (
    <div
      className={cn("relative mx-auto w-full max-w-[340px]", className)}
      style={{ aspectRatio: "10 / 14" }}
    >
      {/* ── Shield shell ──────────────────────────────────────────────── */}
      <div
        className={cn("absolute inset-0 overflow-hidden", s.shellClass)}
        style={{ clipPath: SHIELD_CLIP, background: s.bg }}
      >
        {/* Circuit-board pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: CIRCUIT_SVG,
            backgroundSize: "80px 80px",
            opacity: s.circuitOpacity,
          }}
        />

        {/* Brushed-metal texture */}
        <div
          className="pointer-events-none absolute inset-0 mix-blend-soft-light"
          style={{
            backgroundImage:
              "repeating-linear-gradient(120deg, transparent, transparent 1.5px, rgba(255,255,255,0.02) 1.5px, rgba(255,255,255,0.02) 3px)",
          }}
        />

        {/* Decorative arc swoosh (right side) */}
        <div
          className="pointer-events-none absolute"
          style={{
            top: "5%",
            right: "2%",
            width: "28%",
            height: "48%",
            border: `2px solid ${s.border}`,
            borderLeft: "none",
            borderRadius: "0 50% 50% 0",
            opacity: 0.2,
          }}
        />

        {/* Small diagonal cuts at top corners */}
        <div
          className="pointer-events-none absolute left-0 top-0 h-[8%] w-[12%]"
          style={{
            background: `linear-gradient(135deg, transparent 60%, ${s.border}30 60%, ${s.border}30 65%, transparent 65%)`,
          }}
        />
        <div
          className="pointer-events-none absolute right-0 top-0 h-[8%] w-[12%]"
          style={{
            background: `linear-gradient(-135deg, transparent 60%, ${s.border}30 60%, ${s.border}30 65%, transparent 65%)`,
          }}
        />

        {/* Shine overlay for Rare variants */}
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
                  top: `${10 + ((i * 37) % 65)}%`,
                  left: `${8 + ((i * 29) % 80)}%`,
                  animationDelay: `${i * 0.4}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* ── Card content ──────────────────────────────────────────── */}
        <div className="relative flex h-full flex-col">

          {/* ── UPPER: Name + Photo + Rating (flex row) ────────────── */}
          <div className="flex" style={{ height: "55%" }}>

            {/* Vertical player name (left rail) */}
            <div
              className="flex w-[12%] items-center justify-center"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              <span
                className="truncate text-sm font-black uppercase tracking-[0.25em]"
                style={{
                  color: s.text,
                  textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                  maxHeight: "80%",
                }}
              >
                {playerData.name}
              </span>
            </div>

            {/* Center photo area */}
            <div className="flex flex-1 items-center justify-center px-1">
              <div
                className="relative overflow-hidden rounded-lg"
                style={{
                  width: "68%",
                  aspectRatio: "1",
                  border: `3.5px solid ${s.border}`,
                  boxShadow: `inset 0 2px 8px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.5), 0 0 0 1.5px rgba(0,0,0,0.2)`,
                }}
              >
                {playerData.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={playerData.imageUrl}
                    alt={playerData.name}
                    className="h-full w-full object-cover object-[center_20%]"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-4xl font-black"
                    style={{
                      background: `linear-gradient(135deg, ${s.statBg}, rgba(0,0,0,0.4))`,
                      color: s.accent,
                    }}
                  >
                    {playerData.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            </div>

            {/* Right column: Overall + Flag */}
            <div className="flex w-[24%] flex-col items-center pt-[6%] pr-[3%]">
              <span
                className="text-[2.8rem] font-black leading-none"
                style={{
                  color: s.text,
                  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                {overall}
              </span>
              <div
                className="mt-2 overflow-hidden rounded-[3px]"
                style={{
                  width: "36px",
                  height: "24px",
                  border: `1.5px solid ${s.border}60`,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
                }}
              >
                <CountryFlag code={playerData.nationalityCode} />
              </div>
            </div>
          </div>

          {/* ── ROLE BANNER ────────────────────────────────────────── */}
          <div
            className="flex items-center justify-center"
            style={{
              height: "7%",
              borderTop: `1px solid ${s.border}40`,
              borderBottom: `1px solid ${s.border}40`,
            }}
          >
            <span
              className="text-sm font-black uppercase tracking-[0.35em]"
              style={{
                color: s.text,
                textShadow: "0 1px 3px rgba(0,0,0,0.5)",
              }}
            >
              {playerData.role}
            </span>
          </div>

          {/* ── STATS SECTION (darker panel) ───────────────────────── */}
          <div
            className="relative mx-[4%] mt-[2%] flex-1 overflow-hidden rounded-xl"
            style={{ background: s.statBg }}
          >
            {/* Circuit pattern on stats panel too */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage: CIRCUIT_SVG,
                backgroundSize: "80px 80px",
                opacity: s.circuitOpacity * 1.5,
              }}
            />

            <div className="relative flex h-full flex-col items-center justify-center gap-0.5 px-2">
              {/* Icons row */}
              <div className="grid w-full grid-cols-6">
                {STATS.map(({ key, Icon }) => (
                  <div key={key} className="flex justify-center">
                    <Icon
                      className="h-[18px] w-[18px]"
                      style={{ color: s.accent, opacity: 0.75 }}
                      strokeWidth={2.5}
                    />
                  </div>
                ))}
              </div>

              {/* Labels row */}
              <div className="grid w-full grid-cols-6">
                {STATS.map(({ key, label }) => (
                  <span
                    key={key}
                    className="text-center text-[0.6rem] font-bold uppercase tracking-wide"
                    style={{ color: s.text, opacity: 0.55 }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              {/* Values row */}
              <div className="grid w-full grid-cols-6">
                {STATS.map(({ key }) => (
                  <span
                    key={key}
                    className="text-center text-xl font-black leading-tight"
                    style={{
                      color: s.accent,
                      textShadow: "0 1px 3px rgba(0,0,0,0.4)",
                    }}
                  >
                    {playerData.stats[key]}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── LOGO ───────────────────────────────────────────────── */}
          <div
            className="flex items-center justify-center"
            style={{ height: "14%", paddingBottom: "4%" }}
          >
            <div
              className="flex h-7 w-7 items-center justify-center rounded-full"
              style={{
                border: `1px solid ${s.border}50`,
                background: s.statBg,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/sander-logo.png"
                alt="Sander"
                className="h-4 w-4 object-contain"
                style={{ filter: "brightness(1.3)" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Inner border highlight (inside clip) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          clipPath: SHIELD_CLIP,
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.15)",
        }}
      />
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Helper: convert Prisma Player model to PlayerCardData                      */
/* ──────────────────────────────────────────────────────────────────────────── */

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
