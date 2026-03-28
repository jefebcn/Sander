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
/*  Rarity                                                                     */
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

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Country flag (inline SVG — no emoji)                                       */
/* ──────────────────────────────────────────────────────────────────────────── */

const FLAG_COLORS: Record<string, string[]> = {
  IT: ["#009246", "#fff", "#CE2B37"],
  FR: ["#0055A4", "#fff", "#EF4135"],
  DE: ["#000", "#DD0000", "#FFCE00"],
  ES: ["#AA151B", "#F1BF00", "#AA151B"],
  BR: ["#009739", "#FEDD00", "#009739"],
  AR: ["#74ACDF", "#fff", "#74ACDF"],
  NO: ["#EF2B2D", "#002868", "#EF2B2D"],
  PT: ["#006600", "#FF0000", "#FF0000"],
  RO: ["#002B7F", "#FCD116", "#CE1126"],
  PL: ["#fff", "#fff", "#DC143C"],
  GB: ["#012169", "#C8102E", "#012169"],
  HR: ["#FF0000", "#fff", "#171796"],
  RS: ["#C6363C", "#0C4076", "#fff"],
  AL: ["#E41E20", "#000", "#E41E20"],
}

function CountryFlag({ code }: { code: string }) {
  const c = FLAG_COLORS[code.toUpperCase()]
  if (!c) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-sm bg-neutral-500 text-[7px] font-black text-white leading-none">
        {code.toUpperCase()}
      </div>
    )
  }
  const horiz = ["DE", "PL", "HR", "RS", "AL"].includes(code.toUpperCase())
  return (
    <svg viewBox="0 0 30 20" className="h-full w-full">
      {horiz ? (
        <>
          <rect width="30" height="7" fill={c[0]} />
          <rect y="7" width="30" height="6" fill={c[1]} />
          <rect y="13" width="30" height="7" fill={c[2]} />
        </>
      ) : (
        <>
          <rect width="10" height="20" fill={c[0]} />
          <rect x="10" width="10" height="20" fill={c[1]} />
          <rect x="20" width="10" height="20" fill={c[2]} />
        </>
      )}
    </svg>
  )
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Rarity visual config                                                       */
/* ──────────────────────────────────────────────────────────────────────────── */

interface RarityStyle {
  /** Main background (multi-layer gradient) */
  bg: string
  /** Outer card border */
  borderColor: string
  borderWidth: string
  /** Inner decorative frame */
  innerFrame: boolean
  innerFrameColor: string
  /** Corner ornaments (gold+) */
  corners: boolean
  /** Photo ring */
  ringColor: string
  ringGlow: string
  /** Text colors */
  textPrimary: string
  textSecondary: string
  textAccent: string
  /** Stats divider */
  divider: string
  /** Hover animation class */
  hoverClass: string
  /** Circuit pattern opacity */
  circuitOp: number
}

const R: Record<Rarity, RarityStyle> = {
  bronze: {
    bg: "linear-gradient(160deg, #B8864A 0%, #946828 25%, #7A5520 50%, #A07838 75%, #B88850 100%)",
    borderColor: "#8B6B30",
    borderWidth: "2px",
    innerFrame: false,
    innerFrameColor: "",
    corners: false,
    ringColor: "#A07838",
    ringGlow: "none",
    textPrimary: "#F5E8D4",
    textSecondary: "rgba(245,232,212,0.5)",
    textAccent: "#E8C878",
    divider: "rgba(245,232,212,0.12)",
    hoverClass: "",
    circuitOp: 0.06,
  },
  bronzeRare: {
    bg: "radial-gradient(ellipse at 30% 20%, rgba(232,200,106,0.25) 0%, transparent 50%), radial-gradient(ellipse at 80% 70%, rgba(205,127,50,0.2) 0%, transparent 50%), linear-gradient(160deg, #D4A843 0%, #CD7F32 25%, #B07028 50%, #D4A843 75%, #E8C06A 100%)",
    borderColor: "#D4A843",
    borderWidth: "2.5px",
    innerFrame: false,
    innerFrameColor: "",
    corners: false,
    ringColor: "#D4A843",
    ringGlow: "0 0 12px rgba(212,168,67,0.4)",
    textPrimary: "#FFF5E0",
    textSecondary: "rgba(255,245,224,0.55)",
    textAccent: "#FFD860",
    divider: "rgba(255,245,224,0.15)",
    hoverClass: "fut-shine",
    circuitOp: 0.08,
  },
  silver: {
    bg: "linear-gradient(160deg, #B0BAC4 0%, #8A96A2 25%, #748088 50%, #A0ACB6 75%, #B8C4CE 100%)",
    borderColor: "#8A96A2",
    borderWidth: "2px",
    innerFrame: true,
    innerFrameColor: "rgba(200,212,224,0.2)",
    corners: false,
    ringColor: "#A0ACB6",
    ringGlow: "none",
    textPrimary: "#F0F4F8",
    textSecondary: "rgba(240,244,248,0.5)",
    textAccent: "#D8E0E8",
    divider: "rgba(240,244,248,0.12)",
    hoverClass: "",
    circuitOp: 0.07,
  },
  silverRare: {
    bg: "radial-gradient(ellipse at 25% 15%, rgba(220,230,245,0.3) 0%, transparent 45%), radial-gradient(ellipse at 75% 80%, rgba(180,200,220,0.25) 0%, transparent 45%), linear-gradient(160deg, #C8D4E0 0%, #A8B8C8 25%, #90A0B0 50%, #C0D0DC 75%, #D0DCE8 100%)",
    borderColor: "#B0C0D0",
    borderWidth: "2.5px",
    innerFrame: true,
    innerFrameColor: "rgba(220,230,245,0.25)",
    corners: false,
    ringColor: "#C0D0DC",
    ringGlow: "0 0 14px rgba(180,200,220,0.4)",
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.55)",
    textAccent: "#E8F0FF",
    divider: "rgba(255,255,255,0.15)",
    hoverClass: "fut-holo",
    circuitOp: 0.09,
  },
  gold: {
    bg: "radial-gradient(ellipse at 35% 20%, rgba(255,240,120,0.2) 0%, transparent 50%), radial-gradient(ellipse at 70% 75%, rgba(218,165,32,0.2) 0%, transparent 50%), linear-gradient(160deg, #E8C020 0%, #D4A420 25%, #B08810 50%, #DAB820 75%, #E8C830 100%)",
    borderColor: "#D4A820",
    borderWidth: "2.5px",
    innerFrame: true,
    innerFrameColor: "rgba(255,230,120,0.2)",
    corners: true,
    ringColor: "#E8C830",
    ringGlow: "0 0 18px rgba(218,165,32,0.45)",
    textPrimary: "#FFF8E0",
    textSecondary: "rgba(255,248,224,0.55)",
    textAccent: "#FFE060",
    divider: "rgba(255,248,224,0.18)",
    hoverClass: "",
    circuitOp: 0.08,
  },
  goldRare: {
    bg: "radial-gradient(ellipse at 30% 15%, rgba(255,255,180,0.35) 0%, transparent 45%), radial-gradient(ellipse at 75% 80%, rgba(255,215,0,0.25) 0%, transparent 45%), radial-gradient(ellipse at 50% 50%, rgba(255,240,160,0.15) 0%, transparent 60%), linear-gradient(160deg, #FFE040 0%, #F0C820 20%, #E0B010 40%, #FFD830 60%, #F0C420 80%, #FFE850 100%)",
    borderColor: "#FFE060",
    borderWidth: "3px",
    innerFrame: true,
    innerFrameColor: "rgba(255,248,180,0.3)",
    corners: true,
    ringColor: "#FFE850",
    ringGlow: "0 0 24px rgba(255,215,0,0.5), 0 0 48px rgba(255,215,0,0.2)",
    textPrimary: "#FFFFFF",
    textSecondary: "rgba(255,255,255,0.6)",
    textAccent: "#FFF8D0",
    divider: "rgba(255,255,255,0.2)",
    hoverClass: "fut-shimmer",
    circuitOp: 0.1,
  },
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Stat definitions                                                           */
/* ──────────────────────────────────────────────────────────────────────────── */

const STATS: { key: keyof PlayerCardData["stats"]; label: string; Icon: LucideIcon }[] = [
  { key: "att", label: "ATT", Icon: Swords },
  { key: "dif", label: "DIF", Icon: Shield },
  { key: "ric", label: "RIC", Icon: Target },
  { key: "mur", label: "MUR", Icon: Hand },
  { key: "alz", label: "ALZ", Icon: ChevronsUp },
  { key: "sta", label: "STA", Icon: Zap },
]

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Circuit-board SVG pattern                                                  */
/* ──────────────────────────────────────────────────────────────────────────── */

const CIRCUIT = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Cpath d='M0 40h28m8 0h44M40 0v28m0 8v44' stroke='white' stroke-width='.7' opacity='.4' fill='none'/%3E%3Ccircle cx='40' cy='40' r='2.5' stroke='white' stroke-width='.5' opacity='.35' fill='none'/%3E%3Ccircle cx='40' cy='40' r='.8' fill='white' opacity='.4'/%3E%3Cpath d='M20 0v16h-20M60 80v-16h20' stroke='white' stroke-width='.4' opacity='.2' fill='none'/%3E%3Ccircle cx='20' cy='16' r='1' fill='white' opacity='.2'/%3E%3Ccircle cx='60' cy='64' r='1' fill='white' opacity='.2'/%3E%3Cpath d='M0 60h10l3-3h5' stroke='white' stroke-width='.3' opacity='.15' fill='none'/%3E%3Cpath d='M80 20h-10l-3 3h-5' stroke='white' stroke-width='.3' opacity='.15' fill='none'/%3E%3C/svg%3E")`

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Component                                                                  */
/* ──────────────────────────────────────────────────────────────────────────── */

export function SanderCardFut({ playerData, className }: SanderCardFutProps) {
  const rarity = getRarity(playerData.glicko2)
  const s = R[rarity]
  const glickoDisplay = Math.round(playerData.glicko2)

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[360px] overflow-hidden rounded-2xl",
        s.hoverClass,
        className,
      )}
      style={{
        aspectRatio: "3 / 4",
        background: s.bg,
        border: `${s.borderWidth} solid ${s.borderColor}`,
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)`,
      }}
    >
      {/* ── Background layers ──────────────────────────────────────── */}

      {/* Circuit pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: CIRCUIT,
          backgroundSize: "80px 80px",
          opacity: s.circuitOp,
        }}
      />

      {/* Brushed metal texture */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-soft-light"
        style={{
          backgroundImage:
            "repeating-linear-gradient(115deg, transparent, transparent 1px, rgba(255,255,255,0.018) 1px, rgba(255,255,255,0.018) 2.5px)",
        }}
      />

      {/* Rare hover shine overlay */}
      {s.hoverClass && (
        <div className="fut-shine-overlay pointer-events-none absolute inset-0 rounded-2xl" />
      )}

      {/* Gold Rare sparkles */}
      {rarity === "goldRare" && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="fut-sparkle absolute rounded-full bg-white"
              style={{
                width: i % 3 === 0 ? "3px" : "2px",
                height: i % 3 === 0 ? "3px" : "2px",
                top: `${8 + ((i * 31) % 78)}%`,
                left: `${6 + ((i * 23) % 85)}%`,
                animationDelay: `${i * 0.3}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Inner decorative frame (silver+ tiers) ─────────────────── */}
      {s.innerFrame && (
        <div
          className="pointer-events-none absolute rounded-xl"
          style={{
            inset: "8px",
            border: `1px solid ${s.innerFrameColor}`,
          }}
        />
      )}

      {/* ── Corner ornaments (gold tiers) ──────────────────────────── */}
      {s.corners && (
        <>
          {/* Top-left */}
          <div className="pointer-events-none absolute left-[10px] top-[10px]">
            <div style={{ width: 16, height: 1, background: s.innerFrameColor }} />
            <div style={{ width: 1, height: 16, background: s.innerFrameColor }} />
          </div>
          {/* Top-right */}
          <div className="pointer-events-none absolute right-[10px] top-[10px]">
            <div style={{ width: 16, height: 1, background: s.innerFrameColor, marginLeft: "auto" }} />
            <div style={{ width: 1, height: 16, background: s.innerFrameColor, marginLeft: "auto" }} />
          </div>
          {/* Bottom-left */}
          <div className="pointer-events-none absolute bottom-[10px] left-[10px] flex flex-col justify-end">
            <div style={{ width: 1, height: 16, background: s.innerFrameColor }} />
            <div style={{ width: 16, height: 1, background: s.innerFrameColor }} />
          </div>
          {/* Bottom-right */}
          <div className="pointer-events-none absolute bottom-[10px] right-[10px] flex flex-col items-end justify-end">
            <div style={{ width: 1, height: 16, background: s.innerFrameColor, marginLeft: "auto" }} />
            <div style={{ width: 16, height: 1, background: s.innerFrameColor, marginLeft: "auto" }} />
          </div>
        </>
      )}

      {/* ── Card content ───────────────────────────────────────────── */}
      <div className="relative flex h-full flex-col px-5 pb-4 pt-5">

        {/* ── UPPER: Role (vertical) + Photo (center) + Rating+Flag (right) ── */}
        <div className="flex flex-1 items-center gap-2">

          {/* Role — vertical left */}
          <div
            className="flex shrink-0 items-center justify-center self-stretch"
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              width: "22px",
            }}
          >
            <span
              className="whitespace-nowrap text-xs font-black uppercase tracking-[0.35em]"
              style={{
                color: s.textSecondary,
                textShadow: "0 1px 2px rgba(0,0,0,0.3)",
              }}
            >
              {playerData.role}
            </span>
          </div>

          {/* Thin vertical divider */}
          <div
            className="h-[70%] w-px shrink-0 self-center"
            style={{ background: s.divider }}
          />

          {/* Photo — round, centered */}
          <div className="flex flex-1 justify-center">
            <div
              className="relative overflow-hidden rounded-full"
              style={{
                width: "clamp(110px, 40vw, 150px)",
                height: "clamp(110px, 40vw, 150px)",
                border: `3.5px solid ${s.ringColor}`,
                boxShadow: `${s.ringGlow}, inset 0 2px 8px rgba(0,0,0,0.3)`,
              }}
            >
              {playerData.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={playerData.imageUrl}
                  alt={playerData.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-4xl font-black"
                  style={{
                    background: `linear-gradient(135deg, rgba(0,0,0,0.25), rgba(0,0,0,0.45))`,
                    color: s.textAccent,
                  }}
                >
                  {playerData.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Glicko-2 + Flag — right column */}
          <div className="flex shrink-0 flex-col items-center gap-2" style={{ width: "60px" }}>
            <span
              className="text-[2rem] font-black leading-none"
              style={{
                color: s.textPrimary,
                textShadow: "0 2px 6px rgba(0,0,0,0.4)",
              }}
            >
              {glickoDisplay}
            </span>
            <div
              className="overflow-hidden rounded-[3px]"
              style={{
                width: "32px",
                height: "22px",
                border: `1.5px solid ${s.borderColor}60`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
              }}
            >
              <CountryFlag code={playerData.nationalityCode} />
            </div>
          </div>
        </div>

        {/* ── PLAYER NAME ──────────────────────────────────────────── */}
        <h3
          className="mt-2 text-center text-xl font-black uppercase tracking-wide"
          style={{
            color: s.textPrimary,
            textShadow: "0 1px 4px rgba(0,0,0,0.4)",
          }}
        >
          {playerData.name}
        </h3>

        {/* ── Gradient divider ─────────────────────────────────────── */}
        <div
          className="mx-auto my-2 h-px w-[85%]"
          style={{
            background: `linear-gradient(90deg, transparent, ${s.divider.replace(")", "").replace("rgba(", "rgba(")} 200%), transparent)`,
          }}
        />

        {/* ── STATS ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-6 gap-1">
          {STATS.map(({ key, label, Icon }) => (
            <div key={key} className="flex flex-col items-center gap-0.5">
              <Icon
                className="h-[18px] w-[18px]"
                style={{ color: s.textAccent, opacity: 0.75 }}
                strokeWidth={2.2}
              />
              <span
                className="text-[0.55rem] font-bold uppercase tracking-wide"
                style={{ color: s.textSecondary }}
              >
                {label}
              </span>
              <span
                className="text-lg font-black leading-none"
                style={{
                  color: s.textAccent,
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                {playerData.stats[key]}
              </span>
            </div>
          ))}
        </div>

        {/* ── SANDER LOGO ──────────────────────────────────────────── */}
        <div className="mt-auto flex justify-center pt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sander-logo.png"
            alt="Sander"
            className="object-contain"
            style={{
              height: "32px",
              opacity: 0.7,
              filter: "brightness(1.4)",
            }}
          />
        </div>
      </div>
    </div>
  )
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Helper: Prisma Player → PlayerCardData                                     */
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
