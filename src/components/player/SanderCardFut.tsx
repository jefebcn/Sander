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

const FLAGS: Record<string, { type: "v" | "h"; c: [string, string, string] }> = {
  IT: { type: "v", c: ["#009246", "#fff", "#CE2B37"] },
  FR: { type: "v", c: ["#0055A4", "#fff", "#EF4135"] },
  DE: { type: "h", c: ["#000", "#DD0000", "#FFCE00"] },
  ES: { type: "h", c: ["#AA151B", "#F1BF00", "#AA151B"] },
  BR: { type: "v", c: ["#009739", "#FEDD00", "#009739"] },
  AR: { type: "h", c: ["#74ACDF", "#fff", "#74ACDF"] },
  NO: { type: "v", c: ["#EF2B2D", "#002868", "#EF2B2D"] },
  PT: { type: "v", c: ["#006600", "#FF0000", "#FF0000"] },
  RO: { type: "v", c: ["#002B7F", "#FCD116", "#CE1126"] },
  PL: { type: "h", c: ["#fff", "#fff", "#DC143C"] },
  GB: { type: "v", c: ["#012169", "#C8102E", "#012169"] },
  HR: { type: "h", c: ["#FF0000", "#fff", "#171796"] },
  RS: { type: "h", c: ["#C6363C", "#0C4076", "#fff"] },
  AL: { type: "h", c: ["#E41E20", "#000", "#E41E20"] },
  BE: { type: "v", c: ["#000", "#FAE042", "#ED2939"] },
  NL: { type: "h", c: ["#AE1C28", "#fff", "#21468B"] },
  CH: { type: "v", c: ["#FF0000", "#fff", "#FF0000"] },
  AT: { type: "h", c: ["#ED2939", "#fff", "#ED2939"] },
  GR: { type: "h", c: ["#0D5EAF", "#fff", "#0D5EAF"] },
  SE: { type: "v", c: ["#006AA7", "#FECC00", "#006AA7"] },
  US: { type: "h", c: ["#B22234", "#fff", "#3C3B6E"] },
  TR: { type: "h", c: ["#E30A17", "#fff", "#E30A17"] },
  UA: { type: "h", c: ["#0057B7", "#0057B7", "#FFD700"] },
  CZ: { type: "v", c: ["#11457E", "#fff", "#D7141A"] },
  SK: { type: "h", c: ["#fff", "#0B4EA2", "#EE1C25"] },
  HU: { type: "h", c: ["#CE2939", "#fff", "#477050"] },
  BG: { type: "h", c: ["#fff", "#00966E", "#D62612"] },
  SI: { type: "h", c: ["#fff", "#003DA5", "#ED1C24"] },
  IE: { type: "v", c: ["#169B62", "#fff", "#FF883E"] },
}

function FlagIcon({ code }: { code: string }) {
  const f = FLAGS[code.toUpperCase()]
  if (!f) {
    return (
      <svg viewBox="0 0 30 20" className="h-full w-full rounded-[2px]">
        <rect width="30" height="20" fill="#666" rx="1" />
        <text x="15" y="13" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">
          {code.toUpperCase().slice(0, 2)}
        </text>
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 30 20" className="h-full w-full rounded-[2px]">
      {f.type === "h" ? (
        <>
          <rect width="30" height="7" fill={f.c[0]} />
          <rect y="7" width="30" height="6" fill={f.c[1]} />
          <rect y="13" width="30" height="7" fill={f.c[2]} />
        </>
      ) : (
        <>
          <rect width="10" height="20" fill={f.c[0]} />
          <rect x="10" width="10" height="20" fill={f.c[1]} />
          <rect x="20" width="10" height="20" fill={f.c[2]} />
        </>
      )}
    </svg>
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
    statsBg: "linear-gradient(180deg, #6E7E8E 0%, #5E6E7E 50%, #6E7E8E 100%)",
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
    statsBg: "linear-gradient(180deg, #907010 0%, #806008 50%, #907010 100%)",
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
  const s = STYLES[rarity]
  const glicko = Math.round(playerData.glicko2)

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

      {/* ── Inner decorative frame (silver+) ───────────────────────── */}
      {s.innerFrame && (
        <div
          className="pointer-events-none absolute z-10 rounded-xl"
          style={{ inset: "7px", border: `1px solid ${s.innerColor}` }}
        />
      )}

      {/* ── Corner ornaments (gold) ────────────────────────────────── */}
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
          <div className="pointer-events-none absolute bottom-[9px] left-[9px] z-10 flex flex-col justify-end">
            <div style={{ width: 1, height: 20, background: s.innerColor }} />
            <div style={{ width: 20, height: 1, background: s.innerColor }} />
          </div>
          <div className="pointer-events-none absolute bottom-[9px] right-[9px] z-10 flex flex-col items-end justify-end">
            <div style={{ width: 1, height: 20, background: s.innerColor, marginLeft: "auto" }} />
            <div style={{ width: 20, height: 1, background: s.innerColor }} />
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

        <div className="relative z-10 flex h-full items-center px-4">

          {/* Role — vertical left */}
          <div
            className="flex shrink-0 items-center justify-center self-stretch"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", width: "20px" }}
          >
            <span
              className="whitespace-nowrap text-[0.6rem] font-black uppercase tracking-[0.4em]"
              style={{ color: s.t2, textShadow: EMBOSS_SUBTLE }}
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
          <div className="flex shrink-0 flex-col items-center gap-2" style={{ width: "52px" }}>
            <span
              className="text-[1.6rem] font-black leading-none"
              style={{ color: s.t1, textShadow: EMBOSS_LIGHT }}
            >
              {glicko}
            </span>
            <div
              className="overflow-hidden rounded-[2px]"
              style={{
                width: "30px",
                height: "20px",
                border: `1.5px solid ${s.borderColor}55`,
                boxShadow: "0 1px 3px rgba(0,0,0,.35)",
              }}
            >
              <FlagIcon code={playerData.nationalityCode} />
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          BODY ZONE — player name (~12%)
          ═══════════════════════════════════════════════════════════ */}
      <div
        className="relative flex flex-col items-center justify-center"
        style={{ height: "12%", background: s.bodyBg }}
      >
        {/* Top metallic separator */}
        <div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent 5%, ${s.div} 30%, ${s.topStripe} 50%, ${s.div} 70%, transparent 95%)` }}
        />

        <h3
          className="text-lg font-black uppercase tracking-wider"
          style={{ color: s.t1, textShadow: EMBOSS_LIGHT }}
        >
          {playerData.name}
        </h3>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          STATS ZONE (~36%)
          ═══════════════════════════════════════════════════════════ */}
      <div className="relative flex flex-1 flex-col" style={{ background: s.statsBg }}>
        {/* Top metallic separator */}
        <div
          className="absolute inset-x-0 top-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent 5%, ${s.div} 30%, ${s.topStripe} 50%, ${s.div} 70%, transparent 95%)` }}
        />

        {/* Stats grid */}
        <div className="z-10 grid grid-cols-6 gap-1 px-3 pt-4">
          {STATS.map(({ key, label, Icon }) => (
            <div key={key} className="flex flex-col items-center gap-0.5">
              <Icon
                className="h-[18px] w-[18px]"
                style={{ color: s.tA, opacity: 0.75, filter: "drop-shadow(0 1px 1px rgba(0,0,0,.3))" }}
                strokeWidth={2.2}
              />
              <span
                className="text-[0.5rem] font-bold uppercase tracking-wider"
                style={{ color: s.t2, textShadow: EMBOSS_SUBTLE }}
              >
                {label}
              </span>
              <span
                className="text-xl font-black leading-none"
                style={{ color: s.tA, textShadow: EMBOSS_LIGHT }}
              >
                {playerData.stats[key]}
              </span>
            </div>
          ))}
        </div>

        {/* Bottom decorative line */}
        <div
          className="mx-auto mt-2 h-px w-[70%]"
          style={{ background: `linear-gradient(90deg, transparent, ${s.div}, transparent)` }}
        />

        {/* Sander logo — bigger */}
        <div className="z-10 mt-auto flex justify-center pb-3 pt-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sander-logo.png"
            alt="Sander"
            className="object-contain"
            style={{ height: "48px", opacity: 0.6, filter: "brightness(1.5)" }}
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
