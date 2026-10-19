import { cn } from "@/lib/utils"
import { PlayerPhoto } from "@/components/player/PlayerPhoto"
import { FlagImage } from "@/components/ui/FlagImage"

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Types                                                                      */
/* ──────────────────────────────────────────────────────────────────────────── */

export interface PlayerCardData {
  name: string
  glicko2: number
  /** ISO 3166-1 alpha-2, or "" when unknown (no flag is shown). */
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
  /** "lazy" for a card below the fold: its frame is a multi-MB image. */
  frameLoading?: "eager" | "lazy"
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Constants                                                                  */
/* ──────────────────────────────────────────────────────────────────────────── */

const SHADOW = "0.5px 0.5px 0px rgba(255,255,255,0.1), -0.5px -0.5px 0px rgba(0,0,0,0.6)"
const FONT = "'Chakra Petch', sans-serif"

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Rating → text color (dark engraved metallic per tier)                      */
/* ──────────────────────────────────────────────────────────────────────────── */

function getTextColor(glicko2: number): string {
  if (glicko2 >= 2000) return "#5e3a00"  // Gold tiers — deep burnt gold/brass
  if (glicko2 >= 1500) return "#2d2d2d"  // Silver tiers — dark gunmetal
  return "#4a2c1d"                        // Bronze tiers — dark burned bronze
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Rating → frame template mapping                                            */
/* ──────────────────────────────────────────────────────────────────────────── */

function getFrameTemplate(glicko2: number): string {
  if (glicko2 >= 2300) return "/assets/cards/gold_premium.webp"
  if (glicko2 >= 2000) return "/assets/cards/gold.webp"
  if (glicko2 >= 1800) return "/assets/cards/silver_premium.webp"
  if (glicko2 >= 1500) return "/assets/cards/silver.webp"
  if (glicko2 >= 1200) return "/assets/cards/bronze_premium.webp"
  return "/assets/cards/bronze.webp"
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Flag via CDN                                                               */
/* ──────────────────────────────────────────────────────────────────────────── */

function FlagIcon({ code }: { code: string }) {
  // Hidden when the code is missing or the image fails (FlagImage handles both).
  return <FlagImage code={code} className="h-full w-full object-cover" />
}

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Stat positioning: each number centred in its recessed slot on the frame.   */
/*  Slot centres measured on the 2000×2000 frames (x) and the slot row (y).    */
/* ──────────────────────────────────────────────────────────────────────────── */

const STAT_POSITIONS: { key: keyof PlayerCardData["stats"]; left: string }[] = [
  { key: "att", left: "29.4%" },
  { key: "dif", left: "38.1%" },
  { key: "ric", left: "46.2%" },
  { key: "mur", left: "54.5%" },
  { key: "alz", left: "62.9%" },
  { key: "sta", left: "71.2%" },
]
const STAT_ROW = "72.3%"
/** Numbers sit in dark recessed slots: light, with a shadow to read on any metal. */
const STAT_COLOR = "#f6f4ee"
const STAT_SHADOW = "0 1px 2px rgba(0,0,0,0.85)"

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Component: 3-layer sandwich (square 2000×2000 assets)                      */
/*  Layer 0 (Z-0):  Player photo — visible through PNG aperture                */
/*  Layer 1 (Z-10): PNG template frame — object-contain, never distorted       */
/*  Layer 2 (Z-20): All data/text — absolute positioned per 20×20 grid         */
/*  Debug  (Z-50):  20×20 calibration grid (temporary)                         */
/* ──────────────────────────────────────────────────────────────────────────── */

export function SanderCardFut({ playerData, className, frameLoading }: SanderCardFutProps) {
  const glicko = Math.round(playerData.glicko2)
  const frame = getFrameTemplate(glicko)
  const roleAbbr = playerData.stats.mur > playerData.stats.dif ? "MUR" : "DIF"
  const textColor = getTextColor(glicko)

  return (
    <>
      {/* Google Fonts: Chakra Petch 700 */}
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
        {/* ── Z-0 — Player photo (rows 3–10, cols 7–15) ─────────────── */}
        {playerData.imageUrl ? (
          <PlayerPhoto
            src={playerData.imageUrl}
            alt={playerData.name}
            initials={playerData.name.slice(0, 2).toUpperCase()}
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

        {/* ── Z-10 — PNG template frame ──────────────────────────────── */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frame}
          alt="Card frame"
          crossOrigin="anonymous"
          loading={frameLoading}
          decoding={frameLoading === "lazy" ? "async" : undefined}
          className="pointer-events-none absolute inset-0 h-full w-full object-contain"
          style={{ zIndex: 10 }}
        />

        {/* ── Z-20 — Data elements ───────────────────────────────────── */}

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

        {/* Player Name — Row 10.458, Col 6.0–14.0 (auto-scale to fit) */}
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

        {/* Stats — centred in the recessed slots */}
        {STAT_POSITIONS.map(({ key, left }) => (
          <span
            key={key}
            className="absolute text-sm font-bold leading-none tabular-nums"
            style={{
              top: STAT_ROW,
              left,
              transform: "translate(-50%, -50%)",
              zIndex: 20,
              fontFamily: FONT,
              letterSpacing: "0.03em",
              color: STAT_COLOR,
              textShadow: STAT_SHADOW,
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

/** "" when unknown: nationality is optional, so don't pretend everyone is Italian. */
function resolveNationalityCode(raw: string | null | undefined): string {
  if (!raw) return ""
  if (raw.length === 2 && raw === raw.toUpperCase()) return raw
  return COUNTRY_ISO[raw] ?? COUNTRY_ISO[raw.charAt(0).toUpperCase() + raw.slice(1)] ?? ""
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
