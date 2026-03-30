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
/*  Text shadow for embossed look on metallic backgrounds                      */
/* ──────────────────────────────────────────────────────────────────────────── */

const SHADOW = "2px 2px 3px rgba(0,0,0,0.8)"

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Stat keys in order                                                         */
/* ──────────────────────────────────────────────────────────────────────────── */

const STAT_KEYS: (keyof PlayerCardData["stats"])[] = ["att", "dif", "ric", "mur", "alz", "sta"]

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Component: 3-layer sandwich                                                */
/*  Layer 0: Profile photo — absolute inset-0 z-0                              */
/*  Layer 1: PNG frame — absolute inset-0 z-10                                 */
/*  Layer 2: Data text — absolute z-20                                         */
/* ──────────────────────────────────────────────────────────────────────────── */

export function SanderCardFut({ playerData, className }: SanderCardFutProps) {
  const glicko = Math.round(playerData.glicko2)
  const frame = getFrameTemplate(glicko)

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[400px] select-none overflow-hidden bg-transparent",
        className,
      )}
      style={{ aspectRatio: "1 / 1.4" }}
    >
      {/* ── LAYER 0 — Profile photo (sized to fit PNG hole) ──────── */}
      {playerData.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={playerData.imageUrl}
          alt={playerData.name}
          className="absolute object-cover object-top"
          style={{ zIndex: 0, top: "12%", left: "33%", width: "34%", height: "38%" }}
        />
      ) : (
        <div
          className="absolute flex items-center justify-center text-3xl font-black"
          style={{ zIndex: 0, top: "12%", left: "33%", width: "34%", height: "38%", background: "#222", color: "rgba(255,255,255,.5)" }}
        >
          {playerData.name.slice(0, 2).toUpperCase()}
        </div>
      )}

      {/* ── LAYER 1 — PNG frame template ─────────────────────────── */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={frame}
        alt="Card frame"
        className="pointer-events-none absolute inset-0 h-full w-full"
        style={{ zIndex: 10 }}
      />

      {/* ── LAYER 2 — Data elements (all absolute z-20) ──────────── */}

      {/* Role — vertical, left side */}
      <span
        className="absolute whitespace-nowrap text-xs font-bold uppercase tracking-[0.3em] text-white"
        style={{
          top: "18%",
          left: "8%",
          zIndex: 20,
          transform: "rotate(-90deg)",
          transformOrigin: "left center",
          textShadow: SHADOW,
        }}
      >
        {playerData.role}
      </span>

      {/* Rating — top right */}
      <span
        className="absolute text-2xl font-bold leading-none text-white"
        style={{
          top: "14%",
          right: "13%",
          zIndex: 20,
          textShadow: SHADOW,
        }}
      >
        {glicko}
      </span>

      {/* Flag — below rating */}
      <div
        className="absolute overflow-hidden rounded-[2px]"
        style={{
          top: "28%",
          right: "13%",
          width: "12%",
          zIndex: 20,
        }}
      >
        <FlagIcon code={playerData.nationalityCode} />
      </div>

      {/* Name — center horizontal */}
      <span
        className="absolute w-full text-center text-sm font-bold uppercase tracking-wider text-white"
        style={{
          top: "53%",
          left: 0,
          zIndex: 20,
          textShadow: SHADOW,
        }}
      >
        {playerData.name}
      </span>

      {/* Stats — bottom row */}
      <div
        className="absolute flex justify-around"
        style={{
          top: "68%",
          left: "8%",
          width: "84%",
          zIndex: 20,
        }}
      >
        {STAT_KEYS.map((key) => (
          <span
            key={key}
            className="text-lg font-bold leading-none text-white"
            style={{ textShadow: SHADOW }}
          >
            {playerData.stats[key]}
          </span>
        ))}
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
