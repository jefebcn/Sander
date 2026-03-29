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
/*  SVG Flag component (reliable, no emoji issues)                             */
/* ──────────────────────────────────────────────────────────────────────────── */

/* ──────────────────────────────────────────────────────────────────────────── */
/*  SVG Flag component — uses flagcdn.com for real flags                       */
/* ──────────────────────────────────────────────────────────────────────────── */

function FlagIcon({ code }: { code: string }) {
  const iso = code.toLowerCase()
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://flagcdn.com/w80/${iso}.png`}
      alt={code}
      className="h-full w-full object-cover"
      loading="eager"
    />
  )
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Embossed text shadow helpers                                               */
/* ──────────────────────────────────────────────────────────────────────────── */

const EMBOSS_LIGHT = "0 2px 4px rgba(0,0,0,.5), 0 -1px 0 rgba(255,255,255,.12), 1px 1px 2px rgba(0,0,0,.3)"
const EMBOSS_SUBTLE = "0 1px 3px rgba(0,0,0,.4), 0 -1px 0 rgba(255,255,255,.08)"

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Rarity style config                                                        */
/* ──────────────────────────────────────────────────────────────────────────── */

interface RS {
  headerBg: string
  bodyBg: string
  statsBg: string
  patterns: string
  borderColor: string
  borderW: number
  innerFrame: boolean
  innerColor: string
  corners: boolean
  ring: string
  ringW: number
  ringGlow: string
  ringOuter: string
  t1: string
  t2: string
  tA: string
  div: string
  fx: string
  topStripe: string
}

const STYLES: Record<Rarity, RS> = {
  bronze: {
    headerBg: "linear-gradient(180deg, #906828 0%, #7A5820 60%, #6B4C18 100%)",
    bodyBg: "linear-gradient(180deg, #8B6520 0%, #A07838 50%, #8B6520 100%)",
    statsBg: "linear-gradient(180deg, #8B6828 0%, #7A5820 50%, #8B6828 100%)",
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
    ringOuter: "",
    t1: "#F0DCC0",
    t2: "rgba(240,220,192,.5)",
    tA: "#E8C878",
    div: "rgba(240,220,192,.15)",
    fx: "",
    topStripe: "rgba(180,130,60,.3)",
  },
  bronzeRare: {
    headerBg: "linear-gradient(180deg, #B08030 0%, #9A6C28 60%, #886020 100%)",
    bodyBg: "radial-gradient(ellipse at 40% 40%,rgba(232,200,106,.2),transparent 60%),linear-gradient(180deg, #A07030 0%, #C09040 50%, #A07030 100%)",
    statsBg: "linear-gradient(180deg, #9A7028 0%, #886020 50%, #9A7028 100%)",
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
    ringOuter: "",
    t1: "#FFF5E0",
    t2: "rgba(255,245,224,.55)",
    tA: "#FFD860",
    div: "rgba(255,245,224,.18)",
    fx: "fut-shine",
    topStripe: "rgba(212,168,67,.4)",
  },
  silver: {
    headerBg: "linear-gradient(180deg, #7A848E 0%, #6E7880 60%, #626C74 100%)",
    bodyBg: "linear-gradient(180deg, #8A96A2 0%, #A0ACB6 50%, #8A96A2 100%)",
    statsBg: "linear-gradient(180deg, #8490A0 0%, #788898 50%, #8490A0 100%)",
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
    ringOuter: "0 0 0 2px rgba(200,212,224,.15)",
    t1: "#F0F4F8",
    t2: "rgba(240,244,248,.5)",
    tA: "#D4DCE4",
    div: "rgba(240,244,248,.12)",
    fx: "",
    topStripe: "rgba(200,212,224,.3)",
  },
  silverRare: {
    headerBg: "linear-gradient(180deg, #98A8B8 0%, #8898A8 60%, #788898 100%)",
    bodyBg: "radial-gradient(ellipse at 35% 35%,rgba(220,235,255,.2),transparent 55%),linear-gradient(180deg, #A0B4C4 0%, #C0D0DC 50%, #A0B4C4 100%)",
    statsBg: "linear-gradient(180deg, #90A0B0 0%, #8494A4 50%, #90A0B0 100%)",
    patterns: [
      "repeating-linear-gradient(120deg,transparent,transparent 12px,rgba(200,220,240,.15) 12px,rgba(200,220,240,.15) 14px)",
      "repeating-linear-gradient(60deg,transparent,transparent 12px,rgba(170,190,210,.11) 12px,rgba(170,190,210,.11) 14px)",
      "repeating-linear-gradient(0deg,transparent,transparent 24px,rgba(220,235,250,.09) 24px,rgba(220,235,250,.09) 25px)",
      "repeating-linear-gradient(90deg,transparent,transparent 24px,rgba(220,235,250,.07) 24px,rgba(220,235,250,.07) 25px)",
      "radial-gradient(circle at 25% 25%,rgba(200,220,255,.1),transparent 35%)",
      "radial-gradient(circle at 75% 75%,rgba(180,200,230,.08),transparent 35%)",
    ].join(","),
    borderColor: "#B0C0D0",
    borderW: 2,
    innerFrame: true,
    innerColor: "rgba(220,235,250,.22)",
    corners: false,
    ring: "#C0D0DC",
    ringW: 4,
    ringGlow: "0 0 16px rgba(180,200,220,.35), 0 2px 8px rgba(0,0,0,.35)",
    ringOuter: "0 0 0 3px rgba(220,235,250,.12)",
    t1: "#FFFFFF",
    t2: "rgba(255,255,255,.55)",
    tA: "#E8F0FF",
    div: "rgba(255,255,255,.15)",
    fx: "fut-holo",
    topStripe: "rgba(220,235,250,.35)",
  },
  gold: {
    headerBg: "linear-gradient(180deg, #B89018 0%, #A07C10 60%, #907010 100%)",
    bodyBg: "radial-gradient(ellipse at 50% 40%,rgba(255,240,120,.12),transparent 55%),linear-gradient(180deg, #C8A020 0%, #E0B828 50%, #C8A020 100%)",
    statsBg: "linear-gradient(180deg, #A88818 0%, #987810 50%, #A88818 100%)",
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
    ringOuter: "0 0 0 3px rgba(255,230,120,.15)",
    t1: "#FFF8E0",
    t2: "rgba(255,248,224,.55)",
    tA: "#FFE060",
    div: "rgba(255,248,224,.18)",
    fx: "",
    topStripe: "rgba(255,230,120,.35)",
  },
  goldRare: {
    headerBg: "linear-gradient(180deg, #D4A820 0%, #C09818 60%, #B08810 100%)",
    bodyBg: "radial-gradient(ellipse at 30% 30%,rgba(255,255,180,.22),transparent 50%),radial-gradient(ellipse at 70% 70%,rgba(255,215,0,.15),transparent 50%),linear-gradient(180deg, #E0C030 0%, #FFD840 50%, #E0C030 100%)",
    statsBg: "linear-gradient(180deg, #C0A020 0%, #B09018 50%, #C0A020 100%)",
    patterns: [
      "repeating-linear-gradient(115deg,transparent,transparent 10px,rgba(255,248,180,.16) 10px,rgba(255,248,180,.16) 12px)",
      "repeating-linear-gradient(65deg,transparent,transparent 10px,rgba(255,220,60,.12) 10px,rgba(255,220,60,.12) 12px)",
      "repeating-linear-gradient(0deg,transparent,transparent 20px,rgba(255,255,200,.1) 20px,rgba(255,255,200,.1) 21px)",
      "repeating-linear-gradient(90deg,transparent,transparent 20px,rgba(255,255,200,.08) 20px,rgba(255,255,200,.08) 21px)",
      "radial-gradient(circle at 20% 20%,rgba(255,255,200,.15),transparent 30%)",
      "radial-gradient(circle at 80% 30%,rgba(255,240,120,.12),transparent 30%)",
      "radial-gradient(circle at 50% 80%,rgba(255,215,0,.1),transparent 30%)",
    ].join(","),
    borderColor: "#FFE060",
    borderW: 3,
    innerFrame: true,
    innerColor: "rgba(255,248,180,.28)",
    corners: true,
    ring: "#FFE850",
    ringW: 4,
    ringGlow: "0 0 28px rgba(255,215,0,.5), 0 0 56px rgba(255,215,0,.15), 0 2px 8px rgba(0,0,0,.3)",
    ringOuter: "0 0 0 4px rgba(255,248,180,.18)",
    t1: "#FFFFFF",
    t2: "rgba(255,255,255,.6)",
    tA: "#FFF8D0",
    div: "rgba(255,255,255,.2)",
    fx: "fut-shimmer",
    topStripe: "rgba(255,248,180,.4)",
  },
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Stats                                                                      */
/* ──────────────────────────────────────────────────────────────────────────── */

const STATS: { key: keyof PlayerCardData["stats"]; label: string; Icon: LucideIcon; color: string }[] = [
  { key: "att", label: "ATT", Icon: Swords, color: "#FF6B6B" },
  { key: "dif", label: "DIF", Icon: Shield, color: "#4ECDC4" },
  { key: "ric", label: "RIC", Icon: Target, color: "#FFE66D" },
  { key: "mur", label: "MUR", Icon: Hand, color: "#A78BFA" },
  { key: "alz", label: "ALZ", Icon: ChevronsUp, color: "#6BCB77" },
  { key: "sta", label: "STA", Icon: Zap, color: "#FFA94D" },
]

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Component                                                                  */
/* ──────────────────────────────────────────────────────────────────────────── */

export function SanderCardFut({ playerData, className }: SanderCardFutProps) {
  const rarity = getRarity(playerData.glicko2)
  const s = STYLES[rarity]
  const glicko = Math.round(playerData.glicko2)

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[360px] overflow-hidden",
        s.fx,
        className,
      )}
      style={{
        aspectRatio: "3 / 4.3",
        background: s.statsBg,
        clipPath: "polygon(0% 0%, 100% 0%, 100% 82%, 50% 100%, 0% 82%)",
        filter: `drop-shadow(0 10px 30px rgba(0,0,0,.55)) drop-shadow(0 2px 8px rgba(0,0,0,.3))`,
      }}
    >
      {/* ── Border outline via inset shape ────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 z-30"
        style={{
          clipPath: "polygon(0% 0%, 100% 0%, 100% 82%, 50% 100%, 0% 82%)",
          border: `${s.borderW}px solid ${s.borderColor}`,
        }}
      />
      {/* ── Pattern overlay (chevrons, zigzag, stripes) ────────────── */}
      <div
        className="pointer-events-none absolute inset-0 z-10"
        style={{ backgroundImage: s.patterns }}
      />

      {/* ── Top decorative stripe ──────────────────────────────────── */}
      <div
        className="absolute left-0 right-0 top-0 z-10 h-[3px]"
        style={{ background: `linear-gradient(90deg, transparent, ${s.topStripe}, transparent)` }}
      />

      {/* ── Bottom decorative stripe ─────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 h-[3px]"
        style={{ background: `linear-gradient(90deg, transparent, ${s.topStripe}, transparent)` }}
      />

      {/* ── Rare hover shine ───────────────────────────────────────── */}
      {s.fx && (
        <div className="fut-shine-overlay pointer-events-none absolute inset-0 z-20" />
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

      {/* ── Inner decorative frame (silver+) ───────────────────────── */}
      {s.innerFrame && (
        <div
          className="pointer-events-none absolute z-10"
          style={{
            inset: "7px",
            border: `1px solid ${s.innerColor}`,
            clipPath: "polygon(0% 0%, 100% 0%, 100% 83%, 50% 100%, 0% 83%)",
          }}
        />
      )}

      {/* ── Corner ornaments (gold — top corners only for shield) ──── */}
      {s.corners && (
        <>
          <div className="pointer-events-none absolute left-[9px] top-[9px] z-10">
            <div style={{ width: 20, height: 1, background: s.innerColor }} />
            <div style={{ width: 1, height: 20, background: s.innerColor }} />
          </div>
          <div className="pointer-events-none absolute right-[9px] top-[9px] z-10 flex flex-col items-end">
            <div style={{ width: 20, height: 1, background: s.innerColor }} />
            <div style={{ width: 1, height: 20, background: s.innerColor, marginLeft: "auto" }} />
          </div>
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════
          HEADER ZONE (~52%)
          ═══════════════════════════════════════════════════════════ */}
      <div className="relative" style={{ height: "52%", background: s.headerBg }}>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[30%]"
          style={{ background: "linear-gradient(to bottom, transparent, rgba(0,0,0,.1))" }}
        />
        {/* Subtle large watermark "S" */}
        <div
          className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center select-none"
          style={{
            fontSize: "clamp(120px, 40vw, 200px)",
            fontWeight: 900,
            color: "transparent",
            WebkitTextStroke: `1px ${s.div}`,
            opacity: 0.4,
            lineHeight: 1,
          }}
        >
          S
        </div>

        <div className="relative z-10 flex h-full items-center px-4">

          {/* Role — vertical left */}
          <div
            className="flex shrink-0 items-center justify-center self-stretch"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", width: "26px" }}
          >
            <span
              className="whitespace-nowrap text-xs font-black uppercase tracking-[0.35em]"
              style={{ color: s.t1, textShadow: EMBOSS_LIGHT }}
            >
              {playerData.role}
            </span>
          </div>

          {/* Thin divider */}
          <div className="mx-2 h-[60%] w-px shrink-0 self-center" style={{ background: s.div }} />

          {/* Photo — round with ring */}
          <div className="flex flex-1 justify-center">
            <div
              className="relative overflow-hidden rounded-full"
              style={{
                width: "clamp(100px, 36vw, 140px)",
                height: "clamp(100px, 36vw, 140px)",
                border: `${s.ringW}px solid ${s.ring}`,
                boxShadow: [s.ringGlow, s.ringOuter].filter(Boolean).join(", "),
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
                  className="flex h-full w-full items-center justify-center text-3xl font-black"
                  style={{
                    background: "linear-gradient(135deg, rgba(0,0,0,.2), rgba(0,0,0,.4))",
                    color: s.tA,
                    textShadow: EMBOSS_LIGHT,
                  }}
                >
                  {playerData.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Right column: Glicko + Flag */}
          <div className="flex shrink-0 flex-col items-center gap-1.5" style={{ width: "52px" }}>
            <div
              className="overflow-hidden rounded-[3px]"
              style={{
                width: "36px",
                height: "24px",
                border: `2px solid ${s.borderColor}88`,
                boxShadow: `0 2px 6px rgba(0,0,0,.4), 0 0 0 1px ${s.borderColor}33`,
              }}
            >
              <FlagIcon code={playerData.nationalityCode} />
            </div>
            <span
              className="text-[1.2rem] font-black leading-none"
              style={{ color: s.tA, textShadow: EMBOSS_LIGHT }}
            >
              {glicko}
            </span>
            <span
              className="text-[0.45rem] font-bold uppercase tracking-widest"
              style={{ color: s.t2, textShadow: EMBOSS_SUBTLE }}
            >
              GLK
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          BODY ZONE — player name (~12%)
          ═══════════════════════════════════════════════════════════ */}
      <div
        className="relative z-20 flex flex-col items-center justify-center"
        style={{
          height: "12%",
          background: s.bodyBg,
          boxShadow: `0 -4px 12px rgba(0,0,0,.25), 0 4px 12px rgba(0,0,0,.25), inset 0 1px 0 ${s.topStripe}, inset 0 -1px 0 ${s.topStripe}`,
        }}
      >
        {/* Top metallic separator */}
        <div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent 5%, ${s.div} 30%, ${s.topStripe} 50%, ${s.div} 70%, transparent 95%)` }}
        />
        {/* Bottom metallic separator */}
        <div
          className="absolute inset-x-0 bottom-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent 5%, ${s.div} 30%, ${s.topStripe} 50%, ${s.div} 70%, transparent 95%)` }}
        />

        {/* Ornamental diamonds flanking the name */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="h-px w-8" style={{ background: `linear-gradient(90deg, transparent, ${s.tA}44)` }} />
            <div className="h-[5px] w-[5px] rotate-45" style={{ background: s.tA, opacity: 0.5 }} />
            <div className="h-px w-3" style={{ background: `${s.tA}44` }} />
          </div>
          <h3
            className="text-lg font-black uppercase tracking-wider"
            style={{ color: s.t1, textShadow: EMBOSS_LIGHT }}
          >
            {playerData.name}
          </h3>
          <div className="flex items-center gap-1">
            <div className="h-px w-3" style={{ background: `${s.tA}44` }} />
            <div className="h-[5px] w-[5px] rotate-45" style={{ background: s.tA, opacity: 0.5 }} />
            <div className="h-px w-8" style={{ background: `linear-gradient(90deg, ${s.tA}44, transparent)` }} />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          STATS ZONE (~36%)
          ═══════════════════════════════════════════════════════════ */}
      <div className="relative flex flex-1 flex-col" style={{ height: "36%", background: s.statsBg }}>
        {/* Top metallic separator */}
        <div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent 5%, ${s.div} 30%, ${s.topStripe} 50%, ${s.div} 70%, transparent 95%)` }}
        />

        {/* Stats grid */}
        <div className="z-10 grid grid-cols-6 gap-1 px-3 pt-4">
          {STATS.map(({ key, label, Icon, color }) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <Icon
                className="h-[20px] w-[20px]"
                style={{ color, filter: `drop-shadow(0 1px 3px ${color}66) drop-shadow(0 1px 1px rgba(0,0,0,.4))` }}
                strokeWidth={2.4}
              />
              <span
                className="text-[0.5rem] font-bold uppercase tracking-wider"
                style={{ color: s.t2, textShadow: EMBOSS_SUBTLE }}
              >
                {label}
              </span>
              <span
                className="text-[1.35rem] font-black leading-none"
                style={{ color: "#fff", textShadow: `0 0 8px ${color}55, ${EMBOSS_LIGHT}` }}
              >
                {playerData.stats[key]}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom decorative line with dots */}
        <div className="mx-auto mt-2 flex items-center justify-center gap-2 w-[70%]">
          <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, transparent, ${s.div})` }} />
          <div className="h-1 w-1 rounded-full" style={{ background: s.tA, opacity: 0.4 }} />
          <div className="h-1.5 w-1.5 rounded-full" style={{ background: s.tA, opacity: 0.6 }} />
          <div className="h-1 w-1 rounded-full" style={{ background: s.tA, opacity: 0.4 }} />
          <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${s.div}, transparent)` }} />
        </div>

        {/* Sander logo */}
        <div className="z-10 mt-auto flex justify-center pb-6 pt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sander-logo.png"
            alt="Sander"
            className="object-contain"
            style={{ height: "40px", opacity: 0.55, filter: "brightness(1.5)" }}
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

// Map Italian country names → ISO 3166-1 alpha-2 codes
const COUNTRY_ISO: Record<string, string> = {
  "Afghanistan":"AF","Albania":"AL","Algeria":"DZ","Andorra":"AD","Angola":"AO",
  "Argentina":"AR","Armenia":"AM","Australia":"AU","Austria":"AT","Azerbaigian":"AZ",
  "Bahamas":"BS","Bahrain":"BH","Bangladesh":"BD","Belgio":"BE","Belize":"BZ",
  "Benin":"BJ","Bielorussia":"BY","Bolivia":"BO","Bosnia ed Erzegovina":"BA",
  "Botswana":"BW","Brasile":"BR","Bulgaria":"BG","Burkina Faso":"BF","Burundi":"BI",
  "Cambogia":"KH","Camerun":"CM","Canada":"CA","Ciad":"TD","Cile":"CL","Cina":"CN",
  "Cipro":"CY","Colombia":"CO","Congo":"CG","Corea del Nord":"KP","Corea del Sud":"KR",
  "Costa Rica":"CR","Croazia":"HR","Cuba":"CU","Danimarca":"DK","Ecuador":"EC",
  "Egitto":"EG","El Salvador":"SV","Emirati Arabi Uniti":"AE","Eritrea":"ER",
  "Estonia":"EE","Etiopia":"ET","Filippine":"PH","Finlandia":"FI","Francia":"FR",
  "Georgia":"GE","Germania":"DE","Ghana":"GH","Giappone":"JP","Gibuti":"DJ",
  "Giordania":"JO","Grecia":"GR","Guatemala":"GT","Guinea":"GN","Haiti":"HT",
  "Honduras":"HN","India":"IN","Indonesia":"ID","Iran":"IR","Iraq":"IQ",
  "Irlanda":"IE","Islanda":"IS","Israele":"IL","Italia":"IT","Kazakistan":"KZ",
  "Kenya":"KE","Kosovo":"XK","Kuwait":"KW","Laos":"LA","Lettonia":"LV",
  "Libano":"LB","Libia":"LY","Liechtenstein":"LI","Lituania":"LT","Lussemburgo":"LU",
  "Macedonia":"MK","Madagascar":"MG","Malawi":"MW","Malaysia":"MY","Maldive":"MV",
  "Mali":"ML","Malta":"MT","Marocco":"MA","Mauritania":"MR","Messico":"MX",
  "Moldavia":"MD","Monaco":"MC","Mongolia":"MN","Montenegro":"ME","Mozambico":"MZ",
  "Myanmar":"MM","Namibia":"NA","Nepal":"NP","Nicaragua":"NI","Niger":"NE",
  "Nigeria":"NG","Norvegia":"NO","Nuova Zelanda":"NZ","Oman":"OM","Pakistan":"PK",
  "Panama":"PA","Paraguay":"PY","Perù":"PE","Polonia":"PL","Portogallo":"PT",
  "Qatar":"QA","Repubblica Ceca":"CZ","Repubblica Dominicana":"DO","Romania":"RO",
  "Russia":"RU","Ruanda":"RW","San Marino":"SM","Senegal":"SN","Serbia":"RS",
  "Sierra Leone":"SL","Singapore":"SG","Siria":"SY","Slovenia":"SI","Somalia":"SO",
  "Spagna":"ES","Sri Lanka":"LK","Sudafrica":"ZA","Sudan":"SD","Svezia":"SE",
  "Svizzera":"CH","Taiwan":"TW","Tanzania":"TZ","Thailandia":"TH","Togo":"TG",
  "Tunisia":"TN","Turchia":"TR","Ucraina":"UA","Uganda":"UG","Ungheria":"HU",
  "Uruguay":"UY","Uzbekistan":"UZ","Venezuela":"VE","Vietnam":"VN","Yemen":"YE",
  "Zambia":"ZM","Zimbabwe":"ZW",
  // Also accept direct ISO codes
  "Arabia Saudita":"SA","Arabia saudita":"SA",
}

function resolveNationalityCode(raw: string | null | undefined): string {
  if (!raw) return "IT"
  // If it's already a 2-letter ISO code, use it directly
  if (raw.length === 2 && raw === raw.toUpperCase()) return raw
  // Try mapping from Italian name
  return COUNTRY_ISO[raw] ?? COUNTRY_ISO[raw.charAt(0).toUpperCase() + raw.slice(1)] ?? "IT"
}

export function playerToCardData(player: PrismaPlayerLike): PlayerCardData {
  const g = player.glickoRating
  return {
    name: player.name,
    glicko2: g,
    nationalityCode: resolveNationalityCode(player.nationality),
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
