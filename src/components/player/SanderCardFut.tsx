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

type Rarity = "bronze" | "bronzeRare" | "silver" | "silverRare" | "gold" | "goldRare"

function getRarity(glicko2: number): Rarity {
  if (glicko2 >= 2400) return "goldRare"
  if (glicko2 >= 2000) return "gold"
  if (glicko2 >= 1700) return "silverRare"
  if (glicko2 >= 1500) return "silver"
  if (glicko2 >= 1200) return "bronzeRare"
  return "bronze"
}

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
      className="h-full w-full object-cover"
      loading="eager"
    />
  )
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Emboss helpers                                                             */
/* ──────────────────────────────────────────────────────────────────────────── */

const EMBOSS = "1px 2px 3px rgba(0,0,0,.7), 0 -1px 0 rgba(255,255,255,.15), -1px -1px 2px rgba(0,0,0,.4)"
const EMBOSS_DEEP = "2px 3px 5px rgba(0,0,0,.8), 0 -1px 0 rgba(255,255,255,.2), -1px -1px 3px rgba(0,0,0,.5), 0 0 12px rgba(0,0,0,.3)"

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Shield clip-path (badge shape like reference)                              */
/* ──────────────────────────────────────────────────────────────────────────── */

const SHIELD = "polygon(4% 2%, 12% 0%, 88% 0%, 96% 2%, 100% 6%, 100% 78%, 88% 88%, 50% 100%, 12% 88%, 0% 78%, 0% 6%)"
const SHIELD_INNER = "polygon(5% 3%, 13% 1%, 87% 1%, 95% 3%, 99% 7%, 99% 77%, 87% 87%, 50% 99%, 13% 87%, 1% 77%, 1% 7%)"

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Rarity style config                                                        */
/* ──────────────────────────────────────────────────────────────────────────── */

interface RS {
  // Main colors
  base: string        // primary metallic base
  baseDark: string    // darker shade
  baseLight: string   // lighter/highlight shade
  baseMid: string     // mid tone
  // Text
  t1: string          // primary text
  t2: string          // secondary text
  tA: string          // accent text (numbers)
  // Effects
  borderColor: string
  innerBorder: string
  fx: string
  // Glow for ring
  ringGlow: string
}

const STYLES: Record<Rarity, RS> = {
  bronze: {
    base: "#7A5820", baseDark: "#5A3E12", baseLight: "#B89050", baseMid: "#906828",
    t1: "#E8D4B8", t2: "rgba(232,212,184,.55)", tA: "#E8C878",
    borderColor: "#A08040", innerBorder: "rgba(200,170,100,.2)",
    fx: "", ringGlow: "0 2px 8px rgba(0,0,0,.5)",
  },
  bronzeRare: {
    base: "#9A6C28", baseDark: "#6B4C18", baseLight: "#D4A843", baseMid: "#B08030",
    t1: "#FFF5E0", t2: "rgba(255,245,224,.55)", tA: "#FFD860",
    borderColor: "#D4A843", innerBorder: "rgba(212,168,67,.25)",
    fx: "fut-shine", ringGlow: "0 0 14px rgba(212,168,67,.35), 0 2px 8px rgba(0,0,0,.5)",
  },
  silver: {
    base: "#6E7880", baseDark: "#525C64", baseLight: "#A0ACB6", baseMid: "#848E98",
    t1: "#E8ECF0", t2: "rgba(232,236,240,.55)", tA: "#C8D0D8",
    borderColor: "#8A96A2", innerBorder: "rgba(200,212,224,.2)",
    fx: "", ringGlow: "0 2px 8px rgba(0,0,0,.5)",
  },
  silverRare: {
    base: "#8898A8", baseDark: "#667888", baseLight: "#C0D0DC", baseMid: "#A0B0C0",
    t1: "#FFFFFF", t2: "rgba(255,255,255,.55)", tA: "#E0ECF8",
    borderColor: "#B0C0D0", innerBorder: "rgba(220,235,250,.25)",
    fx: "fut-holo", ringGlow: "0 0 16px rgba(180,200,220,.35), 0 2px 8px rgba(0,0,0,.5)",
  },
  gold: {
    base: "#A07C10", baseDark: "#705008", baseLight: "#E0B828", baseMid: "#C8A020",
    t1: "#FFF8E0", t2: "rgba(255,248,224,.55)", tA: "#FFE060",
    borderColor: "#D4A820", innerBorder: "rgba(255,230,120,.25)",
    fx: "", ringGlow: "0 0 20px rgba(218,165,32,.4), 0 2px 8px rgba(0,0,0,.5)",
  },
  goldRare: {
    base: "#C09818", baseDark: "#906810", baseLight: "#FFD840", baseMid: "#E0C030",
    t1: "#FFFFFF", t2: "rgba(255,255,255,.6)", tA: "#FFF0A0",
    borderColor: "#FFE060", innerBorder: "rgba(255,248,180,.3)",
    fx: "fut-shimmer", ringGlow: "0 0 28px rgba(255,215,0,.5), 0 0 56px rgba(255,215,0,.15)",
  },
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Stats config                                                               */
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
/*  Tech/circuit pattern background                                            */
/* ──────────────────────────────────────────────────────────────────────────── */

function techPatterns(c: string): string {
  const a = `rgba(${c},.07)`
  const b = `rgba(${c},.05)`
  const d = `rgba(${c},.1)`
  return [
    // Diagonal hatch
    `repeating-linear-gradient(45deg,transparent,transparent 8px,${a} 8px,${a} 9px)`,
    `repeating-linear-gradient(-45deg,transparent,transparent 8px,${b} 8px,${b} 9px)`,
    // Horizontal lines
    `repeating-linear-gradient(0deg,transparent,transparent 16px,${a} 16px,${a} 17px)`,
    // Vertical lines
    `repeating-linear-gradient(90deg,transparent,transparent 16px,${b} 16px,${b} 17px)`,
    // Subtle grid dots
    `radial-gradient(circle at 16px 16px,${d} 1px,transparent 1px)`,
  ].join(",")
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Component                                                                  */
/* ──────────────────────────────────────────────────────────────────────────── */

export function SanderCardFut({ playerData, className }: SanderCardFutProps) {
  const rarity = getRarity(playerData.glicko2)
  const s = STYLES[rarity]
  const glicko = Math.round(playerData.glicko2)

  // Compute brushed-metal gradient for the card body
  const metalBg = `
    linear-gradient(170deg,
      ${s.baseLight} 0%,
      ${s.baseMid} 15%,
      ${s.base} 35%,
      ${s.baseDark} 55%,
      ${s.base} 70%,
      ${s.baseMid} 85%,
      ${s.baseLight} 100%
    )
  `
  // Lighter strip for the role band
  const bandBg = `
    linear-gradient(180deg,
      ${s.baseMid} 0%,
      ${s.baseLight} 50%,
      ${s.baseMid} 100%
    )
  `
  // Slightly darker for stats zone
  const statsBg = `
    linear-gradient(180deg,
      ${s.baseDark} 0%,
      ${s.base} 40%,
      ${s.baseDark} 100%
    )
  `

  // Pattern color channel for tech lines
  const patternRgb =
    rarity.startsWith("gold") ? "255,230,100" :
    rarity.startsWith("silver") ? "200,212,224" :
    "200,160,80"

  return (
    <div
      className={cn("relative mx-auto w-full max-w-[360px]", s.fx, className)}
      style={{
        aspectRatio: "3 / 4.2",
        filter: "drop-shadow(0 12px 32px rgba(0,0,0,.6)) drop-shadow(0 4px 12px rgba(0,0,0,.4))",
      }}
    >
      {/* ── Outer metallic bevel ──────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: SHIELD,
          background: `linear-gradient(180deg, ${s.baseLight} 0%, ${s.borderColor} 30%, ${s.baseDark} 100%)`,
        }}
      />

      {/* ── Main card body ────────────────────────────────────────── */}
      <div
        className="absolute overflow-hidden"
        style={{
          inset: "4px",
          clipPath: SHIELD_INNER,
          background: metalBg,
        }}
      >
        {/* Tech circuit pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-[2]"
          style={{
            backgroundImage: techPatterns(patternRgb),
            backgroundSize: "32px 32px",
          }}
        />

        {/* Brushed metal texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 z-[1]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              92deg,
              rgba(255,255,255,.03) 0px,
              transparent 1px,
              transparent 3px,
              rgba(255,255,255,.02) 4px
            )`,
          }}
        />

        {/* Rare hover shine */}
        {s.fx && (
          <div className="fut-shine-overlay pointer-events-none absolute inset-0 z-20" />
        )}

        {/* Gold Rare sparkles */}
        {rarity === "goldRare" && (
          <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="fut-sparkle absolute rounded-full bg-white"
                style={{
                  width: i % 3 === 0 ? "3px" : "2px",
                  height: i % 3 === 0 ? "3px" : "2px",
                  top: `${8 + ((i * 31) % 78)}%`,
                  left: `${6 + ((i * 23) % 84)}%`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Inner decorative border */}
        <div
          className="pointer-events-none absolute z-[3]"
          style={{
            inset: "6px",
            clipPath: SHIELD_INNER,
            border: `1px solid ${s.innerBorder}`,
          }}
        />

        {/* ═══════════════════════════════════════════════════════════
            HEADER — Name (vertical) + Photo + Flag/Rating
            Height ~48%
            ═══════════════════════════════════════════════════════ */}
        <div className="relative z-[5] flex" style={{ height: "48%" }}>
          {/* Left: Player name vertical */}
          <div
            className="flex shrink-0 items-center justify-center"
            style={{
              writingMode: "vertical-rl",
              transform: "rotate(180deg)",
              width: "32px",
              background: `linear-gradient(0deg, transparent, ${s.innerBorder}, transparent)`,
            }}
          >
            <span
              className="whitespace-nowrap text-xs font-black uppercase tracking-[0.4em]"
              style={{ color: s.t1, textShadow: EMBOSS }}
            >
              {playerData.name}
            </span>
          </div>

          {/* Vertical divider line */}
          <div
            className="my-6 w-px shrink-0"
            style={{ background: `linear-gradient(180deg, transparent, ${s.innerBorder}, transparent)` }}
          />

          {/* Center: Photo circle */}
          <div className="flex flex-1 items-center justify-center">
            <div
              className="relative overflow-hidden rounded-full"
              style={{
                width: "clamp(100px, 34vw, 130px)",
                height: "clamp(100px, 34vw, 130px)",
                border: `4px solid ${s.borderColor}`,
                boxShadow: `${s.ringGlow}, inset 0 2px 8px rgba(0,0,0,.4)`,
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
                    background: `radial-gradient(circle, ${s.baseMid}, ${s.baseDark})`,
                    color: s.tA,
                    textShadow: EMBOSS_DEEP,
                  }}
                >
                  {playerData.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* Right: Flag + Rating */}
          <div className="flex shrink-0 flex-col items-center justify-center gap-2 pr-3" style={{ width: "60px" }}>
            <div
              className="overflow-hidden rounded-[3px]"
              style={{
                width: "36px",
                height: "24px",
                border: `2px solid ${s.borderColor}`,
                boxShadow: "0 2px 6px rgba(0,0,0,.5)",
              }}
            >
              <FlagIcon code={playerData.nationalityCode} />
            </div>
            <span
              className="text-[1.6rem] font-black leading-none"
              style={{ color: s.t1, textShadow: EMBOSS_DEEP }}
            >
              {glicko}
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            ROLE BAND — "DIFENSORE" raised strip
            Height ~10%
            ═══════════════════════════════════════════════════════ */}
        <div
          className="relative z-[6] flex items-center justify-center"
          style={{
            height: "10%",
            background: bandBg,
            boxShadow: `
              0 -3px 8px rgba(0,0,0,.3),
              0 3px 8px rgba(0,0,0,.3),
              inset 0 1px 0 ${s.innerBorder},
              inset 0 -1px 0 rgba(0,0,0,.2)
            `,
          }}
        >
          {/* Top bevel line */}
          <div
            className="absolute inset-x-0 top-0 h-[2px]"
            style={{ background: `linear-gradient(90deg, transparent 5%, ${s.baseLight}88 50%, transparent 95%)` }}
          />
          {/* Bottom bevel line */}
          <div
            className="absolute inset-x-0 bottom-0 h-[1px]"
            style={{ background: `linear-gradient(90deg, transparent 5%, ${s.baseDark} 50%, transparent 95%)` }}
          />
          <h3
            className="text-base font-black uppercase tracking-[0.3em]"
            style={{ color: s.t1, textShadow: EMBOSS_DEEP }}
          >
            {playerData.role}
          </h3>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            STATS ZONE
            Height ~42%
            ═══════════════════════════════════════════════════════ */}
        <div
          className="relative z-[5] flex flex-1 flex-col items-center"
          style={{ background: statsBg }}
        >
          {/* Stats grid */}
          <div className="z-10 grid w-full grid-cols-6 gap-0.5 px-4 pt-4">
            {STATS.map(({ key, label, Icon }) => (
              <div key={key} className="flex flex-col items-center gap-0.5">
                <Icon
                  className="h-[22px] w-[22px]"
                  style={{
                    color: s.tA,
                    filter: "drop-shadow(0 2px 2px rgba(0,0,0,.5))",
                  }}
                  strokeWidth={2.2}
                />
                <span
                  className="text-[0.5rem] font-bold uppercase tracking-wider"
                  style={{ color: s.t2, textShadow: EMBOSS }}
                >
                  {label}
                </span>
                <span
                  className="text-[1.25rem] font-black leading-none"
                  style={{ color: s.t1, textShadow: EMBOSS_DEEP }}
                >
                  {playerData.stats[key]}
                </span>
              </div>
            ))}
          </div>

          {/* Decorative wings + Sander logo */}
          <div className="z-10 mt-auto flex items-center justify-center gap-1 pb-8 pt-2">
            {/* Left wing */}
            <svg viewBox="0 0 40 16" className="h-3 w-8 opacity-40" style={{ color: s.tA }}>
              <path
                d="M40 8 C35 8, 28 4, 20 2 C14 1, 6 0, 0 8 C6 6, 14 7, 20 8 C14 9, 6 10, 0 8 C6 16, 14 15, 20 14 C28 12, 35 8, 40 8Z"
                fill="currentColor"
              />
            </svg>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sander-logo.png"
              alt="Sander"
              className="object-contain"
              style={{ height: "36px", opacity: 0.5, filter: "brightness(1.4)" }}
            />
            {/* Right wing */}
            <svg viewBox="0 0 40 16" className="h-3 w-8 opacity-40" style={{ color: s.tA, transform: "scaleX(-1)" }}>
              <path
                d="M40 8 C35 8, 28 4, 20 2 C14 1, 6 0, 0 8 C6 6, 14 7, 20 8 C14 9, 6 10, 0 8 C6 16, 14 15, 20 14 C28 12, 35 8, 40 8Z"
                fill="currentColor"
              />
            </svg>
          </div>
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
  "Arabia Saudita":"SA","Arabia saudita":"SA",
}

function resolveNationalityCode(raw: string | null | undefined): string {
  if (!raw) return "IT"
  if (raw.length === 2 && raw === raw.toUpperCase()) return raw
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
