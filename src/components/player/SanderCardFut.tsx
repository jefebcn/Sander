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
  if (glicko2 >= 2300) return "/assets/cards/gold_premium.png"
  if (glicko2 >= 2000) return "/assets/cards/gold.png"
  if (glicko2 >= 1800) return "/assets/cards/silver_premium.png"
  if (glicko2 >= 1500) return "/assets/cards/silver.png"
  if (glicko2 >= 1200) return "/assets/cards/bronze_premium.png"
  return "/assets/cards/bronze.png"
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
/*  Stat positioning: each stat at a fixed column (20×20 grid units)           */
/*  ATT=6.75  DIF=8  RIC=9.75  MUR=11.75  ALZ=13  STA=14.75                  */
/* ──────────────────────────────────────────────────────────────────────────── */

const STAT_POSITIONS: { key: keyof PlayerCardData["stats"]; left: string }[] = [
  { key: "att", left: "27.5%" },     // Col 5.5
  { key: "dif", left: "35.625%" },   // Col 7.125
  { key: "ric", left: "44.375%" },   // Col 8.875
  { key: "mur", left: "51.875%" },   // Col 10.375
  { key: "alz", left: "60%" },       // Col 12.0
  { key: "sta", left: "68.75%" },    // Col 13.75
]

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Component: 3-layer sandwich (square 2000×2000 assets)                      */
/*  Layer 0 (Z-0):  Player photo — visible through PNG aperture                */
/*  Layer 1 (Z-10): PNG template frame — object-contain, never distorted       */
/*  Layer 2 (Z-20): All data/text — absolute positioned per 20×20 grid         */
/*  Debug  (Z-50):  20×20 calibration grid (temporary)                         */
/* ──────────────────────────────────────────────────────────────────────────── */

export function SanderCardFut({ playerData, className }: SanderCardFutProps) {
  const glicko = Math.round(playerData.glicko2)
  const frame = getFrameTemplate(glicko)
  const roleAbbr = playerData.role === "DIFENSORE" ? "DIF" : "MUR"
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
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={playerData.imageUrl}
            alt={playerData.name}
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

        {/* ── Z-10 — PNG template frame ──────────────────────────────── */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={frame}
          alt="Card frame"
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

        {/* Flag — Row 5, Col 4.5 */}
        <div
          className="absolute overflow-hidden rounded-[2px]"
          style={{
            top: "25%",
            left: "22.5%",
            width: "8%",
            zIndex: 20,
          }}
        >
          <FlagIcon code={playerData.nationalityCode} />
        </div>

        {/* Role — Row 6.5, Col 4.5, horizontal */}
        <span
          className="absolute font-bold uppercase"
          style={{
            top: "32.5%",
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

        {/* Player Name — Row 10.25, centered Col 6.5–14.5 */}
        <span
          className="absolute text-center text-base font-bold uppercase"
          style={{
            top: "51.25%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            left: "32.5%",
            width: "40%",
            zIndex: 20,
            fontFamily: FONT,
            letterSpacing: "0.05em",
            color: textColor,
            textShadow: SHADOW,
          }}
        >
          {playerData.name}
        </span>

        {/* Stats — Row 14, individually positioned */}
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
