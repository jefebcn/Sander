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

/** Country code → flag emoji (works on iOS/Android browsers). */
function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(0x1f1e6 + c.charCodeAt(0) - 65))
    .join("")
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Rarity style config                                                        */
/* ──────────────────────────────────────────────────────────────────────────── */

interface RarityStyle {
  /* Card zones */
  headerBg: string
  bodyBg: string
  statsBg: string
  /* Pattern overlays (chevrons, zigzag, stripes — different shades) */
  patterns: string
  /* Border & frame */
  borderColor: string
  borderW: number
  innerFrame: boolean
  innerColor: string
  corners: boolean
  /* Photo ring */
  ring: string
  ringW: number
  ringGlow: string
  /* Text */
  t1: string // primary
  t2: string // secondary / muted
  tA: string // accent / values
  /* Divider line */
  div: string
  /* Hover animation class */
  fx: string
}

const S: Record<Rarity, RarityStyle> = {
  /* ─── Bronze ─────────────────────────────────────────────────────────── */
  bronze: {
    headerBg: "linear-gradient(180deg, #906828 0%, #7A5820 60%, #6B4C18 100%)",
    bodyBg: "linear-gradient(180deg, #8B6520 0%, #A07838 50%, #8B6520 100%)",
    statsBg: "linear-gradient(180deg, #6B4C18 0%, #5A3E12 50%, #6B4C18 100%)",
    patterns: [
      "repeating-linear-gradient(125deg,transparent,transparent 18px,rgba(180,130,60,.1) 18px,rgba(180,130,60,.1) 20px)",
      "repeating-linear-gradient(55deg,transparent,transparent 18px,rgba(140,100,30,.08) 18px,rgba(140,100,30,.08) 20px)",
      "repeating-linear-gradient(0deg,transparent,transparent 36px,rgba(200,160,80,.06) 36px,rgba(200,160,80,.06) 37px)",
      "repeating-linear-gradient(90deg,transparent,transparent 36px,rgba(200,160,80,.04) 36px,rgba(200,160,80,.04) 37px)",
    ].join(","),
    borderColor: "#8B6B30",
    borderW: 2,
    innerFrame: false,
    innerColor: "",
    corners: false,
    ring: "#A07838",
    ringW: 3,
    ringGlow: "0 2px 8px rgba(0,0,0,.4)",
    t1: "#F0DCC0",
    t2: "rgba(240,220,192,.45)",
    tA: "#E8C878",
    div: "rgba(240,220,192,.15)",
    fx: "",
  },

  /* ─── Bronze Rare ────────────────────────────────────────────────────── */
  bronzeRare: {
    headerBg: "linear-gradient(180deg, #B08030 0%, #9A6C28 60%, #886020 100%)",
    bodyBg: "radial-gradient(ellipse at 40% 40%,rgba(232,200,106,.2),transparent 60%),linear-gradient(180deg, #A07030 0%, #C09040 50%, #A07030 100%)",
    statsBg: "linear-gradient(180deg, #7A5820 0%, #6B4C18 50%, #7A5820 100%)",
    patterns: [
      "repeating-linear-gradient(120deg,transparent,transparent 14px,rgba(212,168,67,.14) 14px,rgba(212,168,67,.14) 16px)",
      "repeating-linear-gradient(60deg,transparent,transparent 14px,rgba(180,120,40,.1) 14px,rgba(180,120,40,.1) 16px)",
      "repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(232,200,100,.08) 28px,rgba(232,200,100,.08) 29px)",
      "repeating-linear-gradient(90deg,transparent,transparent 28px,rgba(232,200,100,.06) 28px,rgba(232,200,100,.06) 29px)",
      "radial-gradient(circle at 20% 30%,rgba(255,220,80,.08),transparent 40%)",
      "radial-gradient(circle at 80% 70%,rgba(205,127,50,.1),transparent 40%)",
    ].join(","),
    borderColor: "#D4A843",
    borderW: 2,
    innerFrame: false,
    innerColor: "",
    corners: false,
    ring: "#D4A843",
    ringW: 3,
    ringGlow: "0 0 14px rgba(212,168,67,.35), 0 2px 8px rgba(0,0,0,.4)",
    t1: "#FFF5E0",
    t2: "rgba(255,245,224,.5)",
    tA: "#FFD860",
    div: "rgba(255,245,224,.18)",
    fx: "fut-shine",
  },

  /* ─── Silver ─────────────────────────────────────────────────────────── */
  silver: {
    headerBg: "linear-gradient(180deg, #7A848E 0%, #6E7880 60%, #626C74 100%)",
    bodyBg: "linear-gradient(180deg, #8A96A2 0%, #A0ACB6 50%, #8A96A2 100%)",
    statsBg: "linear-gradient(180deg, #626C74 0%, #566068 50%, #626C74 100%)",
    patterns: [
      "repeating-linear-gradient(125deg,transparent,transparent 16px,rgba(180,196,210,.12) 16px,rgba(180,196,210,.12) 18px)",
      "repeating-linear-gradient(55deg,transparent,transparent 16px,rgba(140,155,170,.09) 16px,rgba(140,155,170,.09) 18px)",
      "repeating-linear-gradient(0deg,transparent,transparent 32px,rgba(200,212,224,.07) 32px,rgba(200,212,224,.07) 33px)",
      "repeating-linear-gradient(90deg,transparent,transparent 32px,rgba(200,212,224,.05) 32px,rgba(200,212,224,.05) 33px)",
    ].join(","),
    borderColor: "#8A96A2",
    borderW: 2,
    innerFrame: true,
    innerColor: "rgba(200,212,224,.18)",
    corners: false,
    ring: "#A0ACB6",
    ringW: 3,
    ringGlow: "0 2px 8px rgba(0,0,0,.35)",
    t1: "#F0F4F8",
    t2: "rgba(240,244,248,.45)",
    tA: "#D4DCE4",
    div: "rgba(240,244,248,.12)",
    fx: "",
  },

  /* ─── Silver Rare ────────────────────────────────────────────────────── */
  silverRare: {
    headerBg: "linear-gradient(180deg, #98A8B8 0%, #8898A8 60%, #788898 100%)",
    bodyBg: "radial-gradient(ellipse at 35% 35%,rgba(220,235,255,.2),transparent 55%),linear-gradient(180deg, #A0B4C4 0%, #C0D0DC 50%, #A0B4C4 100%)",
    statsBg: "linear-gradient(180deg, #6E7E8E 0%, #5E6E7E 50%, #6E7E8E 100%)",
    patterns: [
      "repeating-linear-gradient(120deg,transparent,transparent 12px,rgba(200,220,240,.15) 12px,rgba(200,220,240,.15) 14px)",
      "repeating-linear-gradient(60deg,transparent,transparent 12px,rgba(170,190,210,.11) 12px,rgba(170,190,210,.11) 14px)",
      "repeating-linear-gradient(0deg,transparent,transparent 24px,rgba(220,235,250,.09) 24px,rgba(220,235,250,.09) 25px)",
      "repeating-linear-gradient(90deg,transparent,transparent 24px,rgba(220,235,250,.07) 24px,rgba(220,235,250,.07) 25px)",
      "radial-gradient(circle at 25% 25%,rgba(200,220,255,.1),transparent 35%)",
      "radial-gradient(circle at 75% 75%,rgba(180,200,230,.08),transparent 35%)",
      "repeating-conic-gradient(from 0deg,transparent 0deg,transparent 88deg,rgba(220,235,250,.04) 88deg,rgba(220,235,250,.04) 92deg)",
    ].join(","),
    borderColor: "#B0C0D0",
    borderW: 2,
    innerFrame: true,
    innerColor: "rgba(220,235,250,.22)",
    corners: false,
    ring: "#C0D0DC",
    ringW: 4,
    ringGlow: "0 0 16px rgba(180,200,220,.35), 0 2px 8px rgba(0,0,0,.35)",
    t1: "#FFFFFF",
    t2: "rgba(255,255,255,.5)",
    tA: "#E8F0FF",
    div: "rgba(255,255,255,.15)",
    fx: "fut-holo",
  },

  /* ─── Gold ───────────────────────────────────────────────────────────── */
  gold: {
    headerBg: "linear-gradient(180deg, #B89018 0%, #A07C10 60%, #907010 100%)",
    bodyBg: "radial-gradient(ellipse at 50% 40%,rgba(255,240,120,.12),transparent 55%),linear-gradient(180deg, #C8A020 0%, #E0B828 50%, #C8A020 100%)",
    statsBg: "linear-gradient(180deg, #806010 0%, #705008 50%, #806010 100%)",
    patterns: [
      "repeating-linear-gradient(120deg,transparent,transparent 14px,rgba(255,230,80,.12) 14px,rgba(255,230,80,.12) 16px)",
      "repeating-linear-gradient(60deg,transparent,transparent 14px,rgba(218,165,32,.1) 14px,rgba(218,165,32,.1) 16px)",
      "repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(255,240,100,.07) 28px,rgba(255,240,100,.07) 29px)",
      "repeating-linear-gradient(90deg,transparent,transparent 28px,rgba(255,240,100,.05) 28px,rgba(255,240,100,.05) 29px)",
      "radial-gradient(circle at 30% 20%,rgba(255,240,120,.1),transparent 35%)",
      "radial-gradient(circle at 70% 80%,rgba(218,165,32,.08),transparent 35%)",
    ].join(","),
    borderColor: "#D4A820",
    borderW: 3,
    innerFrame: true,
    innerColor: "rgba(255,230,120,.2)",
    corners: true,
    ring: "#E0B828",
    ringW: 4,
    ringGlow: "0 0 20px rgba(218,165,32,.4), 0 2px 8px rgba(0,0,0,.35)",
    t1: "#FFF8E0",
    t2: "rgba(255,248,224,.5)",
    tA: "#FFE060",
    div: "rgba(255,248,224,.18)",
    fx: "",
  },

  /* ─── Gold Rare ──────────────────────────────────────────────────────── */
  goldRare: {
    headerBg: "linear-gradient(180deg, #D4A820 0%, #C09818 60%, #B08810 100%)",
    bodyBg: "radial-gradient(ellipse at 30% 30%,rgba(255,255,180,.22),transparent 50%),radial-gradient(ellipse at 70% 70%,rgba(255,215,0,.15),transparent 50%),linear-gradient(180deg, #E0C030 0%, #FFD840 50%, #E0C030 100%)",
    statsBg: "linear-gradient(180deg, #907010 0%, #806008 50%, #907010 100%)",
    patterns: [
      "repeating-linear-gradient(115deg,transparent,transparent 10px,rgba(255,248,180,.16) 10px,rgba(255,248,180,.16) 12px)",
      "repeating-linear-gradient(65deg,transparent,transparent 10px,rgba(255,220,60,.12) 10px,rgba(255,220,60,.12) 12px)",
      "repeating-linear-gradient(0deg,transparent,transparent 20px,rgba(255,255,200,.1) 20px,rgba(255,255,200,.1) 21px)",
      "repeating-linear-gradient(90deg,transparent,transparent 20px,rgba(255,255,200,.08) 20px,rgba(255,255,200,.08) 21px)",
      "radial-gradient(circle at 20% 20%,rgba(255,255,200,.15),transparent 30%)",
      "radial-gradient(circle at 80% 30%,rgba(255,240,120,.12),transparent 30%)",
      "radial-gradient(circle at 50% 80%,rgba(255,215,0,.1),transparent 30%)",
      "repeating-conic-gradient(from 0deg,transparent 0deg,transparent 85deg,rgba(255,248,180,.05) 85deg,rgba(255,248,180,.05) 95deg)",
    ].join(","),
    borderColor: "#FFE060",
    borderW: 3,
    innerFrame: true,
    innerColor: "rgba(255,248,180,.28)",
    corners: true,
    ring: "#FFE850",
    ringW: 4,
    ringGlow: "0 0 28px rgba(255,215,0,.5), 0 0 56px rgba(255,215,0,.15), 0 2px 8px rgba(0,0,0,.3)",
    t1: "#FFFFFF",
    t2: "rgba(255,255,255,.55)",
    tA: "#FFF8D0",
    div: "rgba(255,255,255,.2)",
    fx: "fut-shimmer",
  },
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Stats                                                                      */
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
/*  Component                                                                  */
/* ──────────────────────────────────────────────────────────────────────────── */

export function SanderCardFut({ playerData, className }: SanderCardFutProps) {
  const rarity = getRarity(playerData.glicko2)
  const s = S[rarity]
  const glicko = Math.round(playerData.glicko2)
  const flag = countryFlag(playerData.nationalityCode)

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[360px] overflow-hidden rounded-2xl",
        s.fx,
        className,
      )}
      style={{
        aspectRatio: "3 / 4",
        border: `${s.borderW}px solid ${s.borderColor}`,
        boxShadow: "0 10px 40px rgba(0,0,0,.55), 0 2px 10px rgba(0,0,0,.3)",
      }}
    >
      {/* ── Pattern overlay (covers entire card — chevrons, zigzag, stripes) ── */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{ backgroundImage: s.patterns }}
      />

      {/* ── Rare hover shine ───────────────────────────────────────── */}
      {s.fx && (
        <div className="fut-shine-overlay pointer-events-none absolute inset-0 z-20 rounded-2xl" />
      )}

      {/* ── Gold Rare sparkles ─────────────────────────────────────── */}
      {rarity === "goldRare" && (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="fut-sparkle absolute rounded-full bg-white"
              style={{
                width: i % 4 === 0 ? "3px" : "2px",
                height: i % 4 === 0 ? "3px" : "2px",
                top: `${6 + ((i * 29) % 82)}%`,
                left: `${4 + ((i * 23) % 88)}%`,
                animationDelay: `${i * 0.25}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* ── Inner decorative frame (silver+ tiers) ─────────────────── */}
      {s.innerFrame && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl"
          style={{ inset: "7px", border: `1px solid ${s.innerColor}` }}
        />
      )}

      {/* ── Corner ornaments (gold tiers) ──────────────────────────── */}
      {s.corners && (
        <>
          <div className="pointer-events-none absolute left-[9px] top-[9px] z-10">
            <div style={{ width: 18, height: 1, background: s.innerColor }} />
            <div style={{ width: 1, height: 18, background: s.innerColor }} />
          </div>
          <div className="pointer-events-none absolute right-[9px] top-[9px] z-10 flex flex-col items-end">
            <div style={{ width: 18, height: 1, background: s.innerColor }} />
            <div style={{ width: 1, height: 18, background: s.innerColor, marginLeft: "auto" }} />
          </div>
          <div className="pointer-events-none absolute bottom-[9px] left-[9px] z-10 flex flex-col justify-end">
            <div style={{ width: 1, height: 18, background: s.innerColor }} />
            <div style={{ width: 18, height: 1, background: s.innerColor }} />
          </div>
          <div className="pointer-events-none absolute bottom-[9px] right-[9px] z-10 flex flex-col items-end justify-end">
            <div style={{ width: 1, height: 18, background: s.innerColor, marginLeft: "auto" }} />
            <div style={{ width: 18, height: 1, background: s.innerColor }} />
          </div>
        </>
      )}

      {/* ════════════════════════════════════════════════════════════════
          CARD ZONES — each zone has its own background shade
          ════════════════════════════════════════════════════════════ */}

      {/* ── HEADER ZONE (top ~55%) ─────────────────────────────────── */}
      <div className="relative" style={{ height: "55%", background: s.headerBg }}>
        {/* Subtle gradient transition at bottom */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[30%]"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,.12))" }}
        />

        <div className="relative z-10 flex h-full px-4 pt-4 pb-2">
          {/* Role — vertical left */}
          <div
            className="flex shrink-0 items-center justify-center"
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              width: "20px",
            }}
          >
            <span
              className="whitespace-nowrap text-[0.65rem] font-black uppercase tracking-[0.4em]"
              style={{ color: s.t2, textShadow: "0 1px 2px rgba(0,0,0,.4)" }}
            >
              {playerData.role}
            </span>
          </div>

          {/* Thin divider */}
          <div className="mx-2 h-[65%] w-px shrink-0 self-center" style={{ background: s.div }} />

          {/* Photo — round, centered */}
          <div className="flex flex-1 justify-center">
            <div
              className="relative overflow-hidden rounded-full"
              style={{
                width: "clamp(105px, 38vw, 145px)",
                height: "clamp(105px, 38vw, 145px)",
                border: `${s.ringW}px solid ${s.ring}`,
                boxShadow: s.ringGlow,
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
                    background: "linear-gradient(135deg, rgba(0,0,0,.2), rgba(0,0,0,.4))",
                    color: s.tA,
                  }}
                >
                  {playerData.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Glicko-2 + Flag — right */}
          <div className="flex shrink-0 flex-col items-center gap-1.5 pt-1" style={{ width: "56px" }}>
            <span
              className="text-[1.9rem] font-black leading-none"
              style={{ color: s.t1, textShadow: "0 2px 6px rgba(0,0,0,.45)" }}
            >
              {glicko}
            </span>
            <span className="text-xl leading-none">{flag}</span>
          </div>
        </div>
      </div>

      {/* ── BODY ZONE (name + divider) ─────────────────────────────── */}
      <div
        className="relative flex flex-col items-center justify-center"
        style={{ height: "12%", background: s.bodyBg }}
      >
        {/* Top edge highlight */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent 10%, ${s.div} 50%, transparent 90%)` }}
        />
        <h3
          className="text-lg font-black uppercase tracking-wider"
          style={{ color: s.t1, textShadow: "0 1px 3px rgba(0,0,0,.4)" }}
        >
          {playerData.name}
        </h3>
      </div>

      {/* ── STATS ZONE (bottom ~33%) ───────────────────────────────── */}
      <div className="relative flex flex-1 flex-col" style={{ background: s.statsBg }}>
        {/* Top edge highlight */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent 10%, ${s.div} 50%, transparent 90%)` }}
        />

        {/* Stats grid */}
        <div className="z-10 grid grid-cols-6 gap-1 px-4 pt-4">
          {STATS.map(({ key, label, Icon }) => (
            <div key={key} className="flex flex-col items-center gap-0.5">
              <Icon
                className="h-[18px] w-[18px]"
                style={{ color: s.tA, opacity: 0.7 }}
                strokeWidth={2.2}
              />
              <span
                className="text-[0.55rem] font-bold uppercase tracking-wide"
                style={{ color: s.t2 }}
              >
                {label}
              </span>
              <span
                className="text-xl font-black leading-none"
                style={{ color: s.tA, textShadow: "0 1px 2px rgba(0,0,0,.3)" }}
              >
                {playerData.stats[key]}
              </span>
            </div>
          ))}
        </div>

        {/* Sander logo — bigger */}
        <div className="z-10 mt-auto flex justify-center pb-3 pt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sander-logo.png"
            alt="Sander"
            className="object-contain"
            style={{ height: "44px", opacity: 0.65, filter: "brightness(1.5)" }}
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
