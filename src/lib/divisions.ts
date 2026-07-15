/* ────────────────────────────────────────────────────────────────────────── */
/*  Divisions — a beach-themed ranked ladder derived from Glicko rating.        */
/*                                                                             */
/*  Pure logic (no DB) so it can be used on client + server and unit-tested.   */
/*  Distinct from card tiers (bronze/silver/gold) on purpose: divisions are    */
/*  the seasonal, contestable ladder — a reason to climb.                       */
/* ────────────────────────────────────────────────────────────────────────── */

export interface Division {
  key: string
  name: string
  /** Inclusive rating floor. */
  min: number
  /** Tier color (hex). */
  color: string
  emoji: string
  /** 0 = lowest tier. */
  order: number
}

export const DIVISIONS: Division[] = [
  { key: "sabbia", name: "Sabbia", min: 0, color: "#d9c8a0", emoji: "🏖️", order: 0 },
  { key: "onda", name: "Onda", min: 1450, color: "#2dd4bf", emoji: "🌊", order: 1 },
  { key: "corrente", name: "Corrente", min: 1600, color: "#3b82f6", emoji: "💨", order: 2 },
  { key: "tempesta", name: "Tempesta", min: 1750, color: "#a855f7", emoji: "⚡", order: 3 },
  { key: "leggenda", name: "Leggenda", min: 1900, color: "#ffd700", emoji: "👑", order: 4 },
]

/** The division a given rating currently sits in. */
export function getDivision(rating: number): Division {
  let current = DIVISIONS[0]
  for (const d of DIVISIONS) {
    if (rating >= d.min) current = d
  }
  return current
}

/** The next division up, or null if already at the top. */
export function getNextDivision(rating: number): Division | null {
  const current = getDivision(rating)
  return DIVISIONS.find((d) => d.order === current.order + 1) ?? null
}

/** Rating points still needed to reach the next division, or null at the top. */
export function pointsToNext(rating: number): number | null {
  const next = getNextDivision(rating)
  return next ? Math.max(0, Math.ceil(next.min - rating)) : null
}

/** Progress (0–100) through the current division band toward the next. */
export function divisionProgress(rating: number): number {
  const current = getDivision(rating)
  const next = getNextDivision(rating)
  if (!next) return 100
  const span = next.min - current.min
  if (span <= 0) return 100
  return Math.min(100, Math.max(0, Math.round(((rating - current.min) / span) * 100)))
}
