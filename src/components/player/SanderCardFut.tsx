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

function getTextColor(glicko2: number): string {
  if (glicko2 >= 2000) return "#3A2800" // dark brown/gold text
  if (glicko2 >= 1500) return "#1A2430" // dark slate for silver
  return "#2A1800" // dark bronze for bronze
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

const EMBOSS = "0 1px 2px rgba(0,0,0,.4), 0 -1px 0 rgba(255,255,255,.25)"
const EMBOSS_STRONG = "0 2px 4px rgba(0,0,0,.5), 0 -1px 0 rgba(255,255,255,.3), 1px 1px 3px rgba(0,0,0,.3)"

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Stat keys in order                                                         */
/* ──────────────────────────────────────────────────────────────────────────── */

const STAT_KEYS: (keyof PlayerCardData["stats"])[] = ["att", "dif", "ric", "mur", "alz", "sta"]

/* ──────────────────────────────────────────────────────────────────────────── */
/*  Component: 3-layer sandwich                                                */
/*  Layer 0: Profile photo (z-0)                                               */
/*  Layer 1: PNG frame template (z-10)                                         */
/*  Layer 2: Dynamic text & elements (z-20)                                    */
/* ──────────────────────────────────────────────────────────────────────────── */

export function SanderCardFut({ playerData, className }: SanderCardFutProps) {
  const glicko = Math.round(playerData.glicko2)
  const frame = getFrameTemplate(glicko)
  const textColor = getTextColor(glicko)

  return (
    <div
      className={cn("relative mx-auto w-full max-w-[400px] select-none", className)}
      style={{ aspectRatio: "1 / 1" }}
    >
      {/* ═══════════════════════════════════════════════════════════════
          LAYER 0 — Profile photo behind the frame
          ═══════════════════════════════════════════════════════════ */}
      <div
        className="absolute overflow-hidden"
        style={{
          top: "14%",
          left: "27%",
          width: "34%",
          height: "32%",
          zIndex: 0,
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
            style={{ background: "rgba(0,0,0,.3)", color: "#ccc" }}
          >
            {playerData.name.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          LAYER 1 — PNG frame template
          ═══════════════════════════════════════════════════════════ */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={frame}
        alt="Card frame"
        className="pointer-events-none absolute inset-0 h-full w-full object-contain"
        style={{ zIndex: 10 }}
      />

      {/* ═══════════════════════════════════════════════════════════════
          LAYER 2 — Dynamic text & elements
          ═══════════════════════════════════════════════════════════ */}

      {/* Role — vertical text (left bar) */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          top: "15%",
          left: "10.5%",
          width: "6%",
          height: "27%",
          zIndex: 20,
          writingMode: "vertical-rl",
          transform: "rotate(180deg)",
        }}
      >
        <span
          className="whitespace-nowrap text-[0.6rem] font-black uppercase tracking-[0.35em]"
          style={{ color: textColor, textShadow: EMBOSS }}
        >
          {playerData.role}
        </span>
      </div>

      {/* Rating — top right upper box */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          top: "13%",
          left: "66%",
          width: "16%",
          height: "9%",
          zIndex: 20,
        }}
      >
        <span
          className="text-[1.4rem] font-black leading-none"
          style={{ color: textColor, textShadow: EMBOSS_STRONG }}
        >
          {glicko}
        </span>
      </div>

      {/* Flag — top right lower box */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          top: "25%",
          left: "68%",
          width: "12%",
          height: "7%",
          zIndex: 20,
        }}
      >
        <div className="h-full w-[80%] overflow-hidden rounded-[2px]">
          <FlagIcon code={playerData.nationalityCode} />
        </div>
      </div>

      {/* Name — center horizontal bar */}
      <div
        className="absolute flex items-center justify-center"
        style={{
          top: "51.5%",
          left: "18%",
          width: "64%",
          height: "5.5%",
          zIndex: 20,
        }}
      >
        <span
          className="text-sm font-black uppercase tracking-wider"
          style={{ color: textColor, textShadow: EMBOSS_STRONG }}
        >
          {playerData.name}
        </span>
      </div>

      {/* Stats — bottom 6 boxes (ATT, DIF, RIC, MUR, ALZ, STA) */}
      {STAT_KEYS.map((key, i) => (
        <div
          key={key}
          className="absolute flex items-center justify-center"
          style={{
            top: "67.5%",
            left: `${12.5 + i * 12.5}%`,
            width: "11%",
            height: "7%",
            zIndex: 20,
          }}
        >
          <span
            className="text-[1.1rem] font-black leading-none"
            style={{ color: textColor, textShadow: EMBOSS_STRONG }}
          >
            {playerData.stats[key]}
          </span>
        </div>
      ))}
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
