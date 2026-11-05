/* ────────────────────────────────────────────────────────────────────────── */
/*  Clubs (pure rules, no DB). A club — a university sports centre, a bagno,  */
/*  an association — runs its own tournaments on SANDER: players stay in its  */
/*  circle, everything stays organised in one place. See lib/clubAccess.ts.   */
/* ────────────────────────────────────────────────────────────────────────── */

/** URL name of a club page (/c/<slug>): "CUS Torino – Beach" → "cus-torino-beach". */
export function clubSlug(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "")
}

/** A free slug: the base, else base-2, base-3… given the taken ones. */
export function freeSlug(base: string, taken: string[]): string {
  const root = base || "club"
  if (!taken.includes(root)) return root
  for (let i = 2; ; i++) if (!taken.includes(`${root}-${i}`)) return `${root}-${i}`
}

/** "@custorino", "instagram.com/custorino/" or a full URL → "custorino". */
export function instagramHandle(raw: string | null | undefined): string | null {
  if (!raw) return null
  const m = raw.trim().match(/^(?:https?:\/\/)?(?:www\.)?(?:instagram\.com\/)?@?([A-Za-z0-9._]{1,30})\/?$/)
  return m ? m[1] : null
}

/** Club tournaments are paid at the court (cash, Satispay): SANDER doesn't collect for clubs. */
export const ON_SITE = "ON_SITE"

/** What a club offers, shown as chips on its page. */
export const CLUB_SERVICES = [
  { key: "DOCCE", label: "Docce" },
  { key: "SPOGLIATOI", label: "Spogliatoi" },
  { key: "BAR", label: "Bar" },
  { key: "PARCHEGGIO", label: "Parcheggio" },
  { key: "PALLONI", label: "Noleggio palloni" },
  { key: "LUCI", label: "Campi illuminati" },
] as const
export const CLUB_SERVICE_KEYS = CLUB_SERVICES.map((s) => s.key) as [string, ...string[]]

export const COURT_TYPES = { OUTDOOR: "All'aperto", INDOOR: "Coperti", BOTH: "All'aperto e coperti" } as const
export const MAX_CLUB_PHOTOS = 6

/** "Portami lì": Google Maps directions to the club's courts. */
export function mapsUrl(address: string | null | undefined, city: string): string {
  const q = [address, city].filter(Boolean).join(", ")
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`
}

/** "Primi passi" of a new club: what's done, in order, for its back office. */
export function clubChecklist(c: {
  logoUrl: string | null
  description: string | null
  courts: number | null
  photos: string[]
  tournaments: number
}) {
  return [
    { key: "logo", label: "Carica il logo", done: !!c.logoUrl },
    { key: "desc", label: "Racconta chi siete", done: !!c.description?.trim() },
    { key: "campi", label: "Indica campi, orari e servizi", done: (c.courts ?? 0) > 0 },
    { key: "foto", label: "Aggiungi le foto dei campi", done: c.photos.length > 0 },
    { key: "torneo", label: "Crea il primo torneo", done: c.tournaments > 0 },
  ]
}

/** Ready-made tournaments: one tap and the form is filled in. */
export const TOURNAMENT_TEMPLATES = {
  girone8: {
    label: "Girone 2v2 · 8 coppie",
    hint: "Tutti contro tutti, 7 partite garantite",
    values: { type: "ROUND_ROBIN", maxTeams: 8, priceEuros: "25", numCourts: 2, description: "Iscrizione a coppia fissa o da soli (le coppie le forma il club). Tutti contro tutti, partite ai 21 punti. Premiazione primi 3 classificati." },
  },
  kotb16: {
    label: "King of the Beach · 16 giocatori",
    hint: "Ci si iscrive da soli, il compagno cambia ogni turno",
    values: { type: "KING_OF_THE_BEACH", maxTeams: 16, priceEuros: "15", numCourts: 2, description: "Iscrizione individuale: a ogni turno cambi compagno. Vince chi fa più punti." },
  },
  elim16: {
    label: "Eliminazione diretta · 16 coppie",
    hint: "Tabellone classico, chi perde esce",
    values: { type: "BRACKETS", maxTeams: 16, priceEuros: "20", numCourts: 4, description: "Tabellone a eliminazione diretta, partite ai 21. Finale per il primo posto." },
  },
  chicece: {
    label: "Chicece · 16 giocatori",
    hint: "Gironi a coppie miste, poi la finale",
    values: { type: "CHICECE", maxTeams: 16, priceEuros: "15", numCourts: 2, description: "Formato Chicece: fase a gironi con compagni che cambiano, poi la finale." },
  },
} as const
export type TournamentTemplateKey = keyof typeof TOURNAMENT_TEMPLATES
