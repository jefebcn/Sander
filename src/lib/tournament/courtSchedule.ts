/**
 * Court and Wave Scheduling
 *
 * Assigns a human-readable court label to each match based on:
 *   - Court letter  : determined by matchNumber within the round (cycles A→B→C→D)
 *   - Wave          : "AM" for the first half of rounds, "PM" for the second half
 *
 * Label examples:
 *   "Campo A · AM"   (first court, morning wave)
 *   "Campo B · PM"   (second court, afternoon wave)
 *   "Campo A"        (only one round — no wave distinction needed)
 */

const COURT_LETTERS = ["A", "B", "C", "D"] as const

/**
 * Returns the court label for a single match.
 *
 * @param round       - 1-based round number
 * @param matchNumber - 1-based match number within the round
 * @param totalRounds - total rounds in the tournament
 * @param numCourts   - number of available courts (1–4)
 */
export function assignCourtLabel(
  round: number,
  matchNumber: number,
  totalRounds: number,
  numCourts: number,
): string {
  const clampedCourts = Math.max(1, Math.min(numCourts, COURT_LETTERS.length))
  const letterIdx = (matchNumber - 1) % clampedCourts
  const letter = COURT_LETTERS[letterIdx]

  if (totalRounds <= 1) return `Campo ${letter}`

  const midpoint = Math.ceil(totalRounds / 2)
  const wave = round <= midpoint ? "AM" : "PM"

  return `Campo ${letter} · ${wave}`
}
