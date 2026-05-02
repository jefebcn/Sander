import { describe, it, expect } from "vitest"

// Replica della 1-factorization usata in generateChiceceGroupSchedule
function buildRound(playerIds: string[], round: number) {
  const n = playerIds.length
  const others = n - 1
  const k = round % others
  const pairs: [string, string][] = []
  pairs.push([playerIds[n - 1], playerIds[k]])
  for (let i = 1; i <= Math.floor((others - 1) / 2); i++) {
    const a = (k - i + others) % others
    const b = (k + i) % others
    pairs.push([playerIds[a], playerIds[b]])
  }
  return pairs
}

describe("Chicece 1-factorization — no repeat partners", () => {
  for (const n of [8, 12, 16, 20]) {
    it(`n=${n}: tutte le coppie sono uniche nelle prime n-1 round`, () => {
      const players = Array.from({ length: n }, (_, i) => `p${i}`)
      const seen = new Set<string>()

      for (let round = 0; round < n - 1; round++) {
        const pairs = buildRound(players, round)
        expect(pairs).toHaveLength(n / 2)

        for (const [a, b] of pairs) {
          const key = [a, b].sort().join("|")
          expect(seen.has(key), `Coppia ${a}+${b} ripetuta al round ${round}`).toBe(false)
          seen.add(key)
        }
      }

      // Dopo n-1 round devono essere state coperte esattamente C(n,2) coppie uniche
      expect(seen.size).toBe((n * (n - 1)) / 2)
    })

    it(`n=${n}: ogni giocatore appare esattamente una volta per round`, () => {
      const players = Array.from({ length: n }, (_, i) => `p${i}`)
      for (let round = 0; round < n - 1; round++) {
        const pairs = buildRound(players, round)
        const ids = pairs.flat()
        expect(new Set(ids).size).toBe(n)
        expect(ids).toHaveLength(n)
      }
    })
  }
})
