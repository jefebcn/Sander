import { describe, it, expect } from "vitest"
import {
  PROVISIONAL_GAMES,
  ratedGames,
  rankStatus,
  isProvisional,
  splitLeaderboard,
  orderLeaderboard,
} from "./rankingEligibility"

const byRating = (a: { rating: number }, b: { rating: number }) => b.rating - a.rating
const games = (p: { games: number }) => p.games

describe("ratedGames", () => {
  it("adds wins and losses", () => {
    expect(ratedGames({ matchesWon: 3, matchesLost: 2 })).toBe(5)
  })
  it("never goes negative on corrupted counters", () => {
    expect(ratedGames({ matchesWon: -1, matchesLost: 0 })).toBe(0)
  })
})

describe("rankStatus", () => {
  it("leaves out players with no decided game", () => {
    expect(rankStatus(0)).toBe("unranked")
  })
  it("marks the first games as provisional", () => {
    expect(rankStatus(1)).toBe("provisional")
    expect(rankStatus(PROVISIONAL_GAMES - 1)).toBe("provisional")
    expect(isProvisional(2)).toBe(true)
  })
  it("establishes a player from the threshold on", () => {
    expect(rankStatus(PROVISIONAL_GAMES)).toBe("established")
    expect(isProvisional(40)).toBe(false)
  })
})

describe("splitLeaderboard", () => {
  const players = [
    { name: "Giulio", rating: 1500, games: 0 },  // seed rating, never played
    { name: "Nuovo", rating: 1720, games: 2 },   // lucky first wins, wide RD
    { name: "Marco", rating: 1610, games: 18 },
    { name: "Luca", rating: 1378, games: 9 },
    { name: "Anna", rating: 1450, games: 4 },
  ]

  it("drops 0-game players and puts provisional ones after the established", () => {
    const { established, provisional } = splitLeaderboard(players, games, byRating)
    expect(established.map((p) => p.name)).toEqual(["Marco", "Luca"])
    expect(provisional.map((p) => p.name)).toEqual(["Nuovo", "Anna"])
  })

  it("does not mutate the input", () => {
    const copy = [...players]
    splitLeaderboard(players, games, byRating)
    expect(players).toEqual(copy)
  })

  it("orderLeaderboard flattens the two sections", () => {
    expect(orderLeaderboard(players, games, byRating).map((p) => p.name)).toEqual([
      "Marco",
      "Luca",
      "Nuovo",
      "Anna",
    ])
  })

  it("handles an empty board", () => {
    const empty: { rating: number; games: number }[] = []
    expect(splitLeaderboard(empty, games, byRating)).toEqual({ established: [], provisional: [] })
  })
})
