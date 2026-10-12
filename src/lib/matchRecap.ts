/* ────────────────────────────────────────────────────────────────────────── */
/*  Post-match recap: how much one match moved your rating.                    */
/*  Pure, so the arithmetic is tested rather than eyeballed on a live match.   */
/* ────────────────────────────────────────────────────────────────────────── */

export interface RatingPoint {
  rating: number
  sourceId: string
  createdAt: Date
}

/**
 * Rating change caused by one match (`sourceId`): its history point minus the
 * one before it. For the very first rated game there is no point before, so the
 * starting rating is the baseline. Null when the match isn't in the history
 * (e.g. it was closed without a score).
 */
export function ratingDeltaFor(history: RatingPoint[], sourceId: string, baseline: number): number | null {
  const sorted = [...history].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  const i = sorted.findIndex((p) => p.sourceId === sourceId)
  if (i === -1) return null
  const before = i > 0 ? sorted[i - 1].rating : baseline
  return Math.round(sorted[i].rating - before)
}
