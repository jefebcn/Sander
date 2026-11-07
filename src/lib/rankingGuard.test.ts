import { describe, expect, it } from "vitest"
import { countedOpponents, isTrustedAccount, opposingPairs, pairKey, sessionRanking, suspicion } from "./rankingGuard"

describe("sessionRanking", () => {
  it("guests only on one side: not ranked", () => {
    expect(sessionRanking([{ teamA: ["a", "b"], teamB: [] }], new Map())).toEqual({ ranked: false, reason: "GUESTS" })
  })
  it("ranked until the same pair has played 3 times this week", () => {
    const m = [{ teamA: ["a", "b"], teamB: ["c", "d"] }]
    expect(sessionRanking(m, new Map([[pairKey("a", "c"), 2]])).ranked).toBe(true)
    const r = sessionRanking(m, new Map([[pairKey("c", "a"), 3]]))
    expect(r).toEqual({ ranked: false, reason: "SAME_OPPONENTS", pairs: [pairKey("a", "c")] })
  })
  it("teammates don't count as opponents", () => {
    expect(opposingPairs(["a", "b"], ["c"]).sort()).toEqual([pairKey("a", "c"), pairKey("b", "c")].sort())
    expect(sessionRanking([{ teamA: ["a", "b"], teamB: ["c", "d"] }], new Map([[pairKey("a", "b"), 9]])).ranked).toBe(true)
  })
  it("multi-match sessions: matches with a guest side are ignored, the rest decide", () => {
    expect(sessionRanking([{ teamA: ["a"], teamB: [] }, { teamA: ["a"], teamB: ["b"] }], new Map()).ranked).toBe(true)
  })
})

describe("trust", () => {
  const now = new Date("2026-11-10T12:00:00Z")
  const days = (n: number) => new Date(now.getTime() - n * 86_400_000)
  it("a week old and 3 different people", () => {
    expect(isTrustedAccount({ createdAt: days(8), coPlayers: 3, playedTournament: false }, now)).toBe(true)
    expect(isTrustedAccount({ createdAt: days(3), coPlayers: 10, playedTournament: false }, now)).toBe(false)
    expect(isTrustedAccount({ createdAt: days(30), coPlayers: 2, playedTournament: false }, now)).toBe(false)
  })
  it("a real tournament is enough", () => {
    expect(isTrustedAccount({ createdAt: days(1), coPlayers: 0, playedTournament: true }, now)).toBe(true)
  })
  it("established players only count trusted opponents; new players count everyone", () => {
    const t = (id: string) => id === "old"
    expect(countedOpponents(true, ["old", "fake"], t)).toEqual(["old"])
    expect(countedOpponents(true, ["fake"], t)).toEqual([])
    expect(countedOpponents(false, ["fake"], t)).toEqual(["fake"])
  })
})

describe("suspicion", () => {
  it("clean player", () => {
    expect(suspicion({ sameOpponents: 1, newOpponentWins: 1, guestOnly: 2, disputed: 1, ratingGain7d: 80 })).toEqual({ score: 0, reasons: [] })
  })
  it("farming patterns add up", () => {
    const s = suspicion({ sameOpponents: 3, newOpponentWins: 4, guestOnly: 0, disputed: 2, ratingGain7d: 200 })
    expect(s.score).toBe(6 + 12 + 6 + 4)
    expect(s.reasons).toHaveLength(4)
  })
})
