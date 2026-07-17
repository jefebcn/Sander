/* ────────────────────────────────────────────────────────────────────────── */
/*  Bagni — canonical beach-club numbering for the Romagna coast.              */
/*                                                                             */
/*  Bagni are numbered (Rimini ~1–150). Free-text locations made the           */
/*  "Re dei Bagni" list messy, so we canonicalise anything that references a   */
/*  bagno number to a single "Bagno N" label and surface the popular ones.     */
/*  Pure logic — usable client + server, unit-testable.                        */
/* ────────────────────────────────────────────────────────────────────────── */

export const MAX_BAGNO = 150

/** The busiest / best-known bagni, shown first. */
export const POPULAR_BAGNI = [26, 29, 36, 42, 43, 44, 60, 67]

export function bagnoLabel(n: number): string {
  return `Bagno ${n}`
}

/**
 * Detect a bagno number inside a free-text location.
 * Matches "Bagno 26", "bagno26", "B26", "bag. 44", or a bare "26".
 * Returns null when there's no valid bagno number (1–150).
 */
export function parseBagno(location: string | null | undefined): number | null {
  if (!location) return null
  const s = location.trim()
  // bare number
  const bare = s.match(/^0*(\d{1,3})$/)
  const keyed = s.match(/\b(?:bagno|bagn|bag|b)\.?\s*0*(\d{1,3})\b/i)
  const num = bare ? parseInt(bare[1], 10) : keyed ? parseInt(keyed[1], 10) : NaN
  if (!Number.isFinite(num)) return null
  return num >= 1 && num <= MAX_BAGNO ? num : null
}

/** Canonical form of a location: "Bagno N" when it's a bagno, else cleaned text. */
export function canonicalLocation(location: string): string {
  const n = parseBagno(location)
  if (n) return bagnoLabel(n)
  return location.trim().replace(/\s+/g, " ")
}

export function isPopularBagno(n: number): boolean {
  return POPULAR_BAGNI.includes(n)
}
