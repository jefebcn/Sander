/* Pure: where a pair sits when it joins a game together. Unit-tested. */

/** Which side two new players join: the team with room for both, else none. */
export function teamForPair(teams: (number | null)[], maxPlayers: number): 0 | 1 | null {
  const half = Math.floor(maxPlayers / 2)
  const count = (t: number) => teams.filter((x) => x === t).length
  if (!teams.some((t) => t !== null)) return null
  if (count(0) + 2 <= half && count(0) <= count(1)) return 0
  if (count(1) + 2 <= half) return 1
  if (count(0) + 2 <= half) return 0
  return null
}
