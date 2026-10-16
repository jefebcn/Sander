import { daysFromNow } from "@/lib/datetime"
import { parseCity } from "@/lib/cities"

/* Pure helpers for the home screen: which open matches to show and how to label them. */

export const FORMAT_SHORT: Record<string, string> = {
  TWO_VS_TWO: "2 contro 2",
  THREE_VS_THREE: "3 contro 3",
  FOUR_VS_FOUR: "4 contro 4",
}

/** "Gratis", "3 crediti", "5 € a testa", "Paga chi perde" */
export function matchPriceLabel(paymentType: string, quotaAmount: number | null): string {
  if (paymentType === "SC" && quotaAmount) return `${quotaAmount} ${quotaAmount === 1 ? "credito" : "crediti"}`
  if (paymentType === "QUOTA" && quotaAmount) {
    const euro = quotaAmount / 100
    return `${Number.isInteger(euro) ? euro : euro.toFixed(2).replace(".", ",")} € a testa`
  }
  if (paymentType === "LOSER_PAYS") return "Paga chi perde"
  return "Gratis"
}

export interface HomeMatchRow {
  id: string
  title: string
  location: string
  city: string | null
  date: Date
  format: string
  maxPlayers: number
  players: number
  paymentType: string
  quotaAmount: number | null
}

export interface HomeMatch extends HomeMatchRow {
  spotsLeft: number
  cityName: string | null
}

export interface HomeMatchPick {
  /** One open match a single player away from starting soon: the "manca 1" card. */
  missing: HomeMatch | null
  /** A short list of other joinable matches, home comune first. */
  list: HomeMatch[]
  /** Comune the list is about, when it's the player's own. */
  listCity: string | null
  /** Joinable matches today / in the coming days (home comune if any there). */
  todayCount: number
  weekCount: number
}

const SOON_MS = 36 * 3600_000

export function pickHomeMatches(rows: HomeMatchRow[], homeCity: string | null, now: Date = new Date()): HomeMatchPick {
  const open: HomeMatch[] = rows
    .map((r) => ({ ...r, spotsLeft: r.maxPlayers - r.players, cityName: r.city ?? parseCity(r.location) }))
    .filter((r) => r.spotsLeft > 0)
    .sort((a, b) => a.date.getTime() - b.date.getTime())

  const local = homeCity ? open.filter((r) => r.cityName === homeCity) : []
  const pool = local.length > 0 ? local : open

  const missing =
    [...local, ...open].find((r) => r.spotsLeft === 1 && r.date.getTime() - now.getTime() < SOON_MS) ?? null

  return {
    missing,
    list: pool.filter((r) => r.id !== missing?.id).slice(0, 3),
    listCity: local.length > 0 ? homeCity : null,
    todayCount: pool.filter((r) => daysFromNow(r.date, now) === 0).length,
    weekCount: pool.length,
  }
}

/** Matches played and won this week, from the player's seats in completed matches. */
export function weekResults(
  seats: { team: number | null; sets: { teamAScore: number; teamBScore: number }[] }[],
): { played: number; won: number } {
  let won = 0
  for (const s of seats) {
    if (s.team !== 0 && s.team !== 1) continue
    const a = s.sets.filter((x) => x.teamAScore > x.teamBScore).length
    const b = s.sets.filter((x) => x.teamBScore > x.teamAScore).length
    if ((s.team === 0 && a > b) || (s.team === 1 && b > a)) won++
  }
  return { played: seats.length, won }
}
