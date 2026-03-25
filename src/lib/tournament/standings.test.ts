import { describe, it, expect } from "vitest"
import { calculateStandings, rankStandings } from "./standings"

function ids(n: number) {
  return Array.from({ length: n }, (_, i) => `p${i + 1}`)
}

describe("calculateStandings", () => {
  it("returns one entry per player with zeroed stats when no matches", () => {
    const result = calculateStandings(ids(4), [])
    expect(result).toHaveLength(4)
    result.forEach((s) => {
      expect(s.points).toBe(0)
      expect(s.matchesWon).toBe(0)
    })
  })

  it("assigns 3 pts to winner and 1 pt to loser", () => {
    const result = calculateStandings(ids(4), [
      {
        teamAScore: 21,
        teamBScore: 15,
        teamAPlayerIds: ["p1", "p2"],
        teamBPlayerIds: ["p3", "p4"],
      },
    ])
    expect(result.find((s) => s.playerId === "p1")!.points).toBe(3)
    expect(result.find((s) => s.playerId === "p3")!.points).toBe(1)
  })

  it("accumulates points across multiple matches", () => {
    const result = calculateStandings(ids(4), [
      {
        teamAScore: 21,
        teamBScore: 15,
        teamAPlayerIds: ["p1", "p2"],
        teamBPlayerIds: ["p3", "p4"],
      },
      {
        teamAScore: 21,
        teamBScore: 19,
        teamAPlayerIds: ["p1", "p3"],
        teamBPlayerIds: ["p2", "p4"],
      },
    ])
    // p1 played both — won both → 3+3=6
    expect(result.find((s) => s.playerId === "p1")!.points).toBe(6)
  })

  it("assigns rank 1 to the player with most points", () => {
    const result = calculateStandings(ids(4), [
      {
        teamAScore: 21,
        teamBScore: 12,
        teamAPlayerIds: ["p1", "p2"],
        teamBPlayerIds: ["p3", "p4"],
      },
    ])
    const ranked = result.sort((a, b) => a.rank - b.rank)
    expect(ranked[0].rank).toBe(1)
    expect(["p1", "p2"]).toContain(ranked[0].playerId)
  })
})

describe("rankStandings", () => {
  it("sorts by points descending", () => {
    const entries = [
      { playerId: "p1", points: 6, matchesWon: 2, matchesLost: 0, pointsFor: 42, pointsAgainst: 30, rank: 0 },
      { playerId: "p2", points: 9, matchesWon: 3, matchesLost: 0, pointsFor: 63, pointsAgainst: 40, rank: 0 },
      { playerId: "p3", points: 3, matchesWon: 1, matchesLost: 1, pointsFor: 21, pointsAgainst: 19, rank: 0 },
    ]
    const ranked = rankStandings(entries)
    expect(ranked[0].playerId).toBe("p2")
    expect(ranked[1].playerId).toBe("p1")
    expect(ranked[2].playerId).toBe("p3")
  })

  it("breaks point ties with point differential", () => {
    const entries = [
      { playerId: "p1", points: 9, matchesWon: 3, matchesLost: 0, pointsFor: 60, pointsAgainst: 50, rank: 0 }, // diff +10
      { playerId: "p2", points: 9, matchesWon: 3, matchesLost: 0, pointsFor: 55, pointsAgainst: 40, rank: 0 }, // diff +15
    ]
    const ranked = rankStandings(entries)
    expect(ranked[0].playerId).toBe("p2")
  })

  it("breaks differential ties by points scored", () => {
    const entries = [
      { playerId: "p1", points: 9, matchesWon: 3, matchesLost: 0, pointsFor: 60, pointsAgainst: 50, rank: 0 }, // +10, 60
      { playerId: "p2", points: 9, matchesWon: 3, matchesLost: 0, pointsFor: 65, pointsAgainst: 55, rank: 0 }, // +10, 65
    ]
    const ranked = rankStandings(entries)
    expect(ranked[0].playerId).toBe("p2")
  })

  it("assigns sequential 1-based ranks", () => {
    const entries = Array.from({ length: 5 }, (_, i) => ({
      playerId: `p${i + 1}`,
      points: (5 - i) * 3,
      matchesWon: 5 - i,
      matchesLost: i,
      pointsFor: 0,
      pointsAgainst: 0,
      rank: 0,
    }))
    const ranked = rankStandings(entries)
    expect(ranked.map((s) => s.rank)).toEqual([1, 2, 3, 4, 5])
  })
})
