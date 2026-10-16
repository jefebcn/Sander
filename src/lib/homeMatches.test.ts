import { describe, it, expect } from "vitest"
import { matchPriceLabel, pickHomeMatches, weekResults, type HomeMatchRow } from "./homeMatches"

const now = new Date("2026-10-16T10:00:00Z") // 12:00 in Rome
const row = (over: Partial<HomeMatchRow>): HomeMatchRow => ({
  id: "x",
  title: "2v2",
  location: "Bagno 26",
  city: "Riccione",
  date: new Date("2026-10-16T16:30:00Z"),
  format: "TWO_VS_TWO",
  maxPlayers: 4,
  players: 2,
  paymentType: "FREE",
  quotaAmount: null,
  ...over,
})

describe("matchPriceLabel", () => {
  it("speaks plain Italian", () => {
    expect(matchPriceLabel("FREE", null)).toBe("Gratis")
    expect(matchPriceLabel("SC", 3)).toBe("3 crediti")
    expect(matchPriceLabel("SC", 1)).toBe("1 credito")
    expect(matchPriceLabel("QUOTA", 500)).toBe("5 € a testa")
    expect(matchPriceLabel("QUOTA", 250)).toBe("2,50 € a testa")
    expect(matchPriceLabel("LOSER_PAYS", null)).toBe("Paga chi perde")
  })
})

describe("pickHomeMatches", () => {
  it("prefers the home comune and pulls out a match missing one player", () => {
    const rows = [
      row({ id: "a", players: 2 }),
      row({ id: "b", players: 3, date: new Date("2026-10-16T17:00:00Z") }),
      row({ id: "c", city: "Rimini", players: 1 }),
      row({ id: "full", players: 4 }),
    ]
    const r = pickHomeMatches(rows, "Riccione", now)
    expect(r.missing?.id).toBe("b")
    expect(r.list.map((m) => m.id)).toEqual(["a"])
    expect(r.listCity).toBe("Riccione")
    expect(r.todayCount).toBe(2)
  })

  it("falls back to every comune when the home one has nothing", () => {
    const r = pickHomeMatches([row({ id: "c", city: "Rimini" })], "Cervia", now)
    expect(r.listCity).toBeNull()
    expect(r.list.map((m) => m.id)).toEqual(["c"])
  })

  it("only flags 'manca 1' for matches starting within 36 hours", () => {
    const later = row({ id: "later", players: 3, date: new Date("2026-10-19T16:00:00Z") })
    expect(pickHomeMatches([later], "Riccione", now).missing).toBeNull()
  })

  it("reads the comune from the location when the field is empty", () => {
    const r = pickHomeMatches([row({ id: "p", city: null, location: "Bagno 26, Riccione" })], "Riccione", now)
    expect(r.listCity).toBe("Riccione")
  })
})

describe("weekResults", () => {
  it("counts wins by sets won, ignoring unassigned seats", () => {
    const r = weekResults([
      { team: 0, sets: [{ teamAScore: 21, teamBScore: 15 }] },
      { team: 1, sets: [{ teamAScore: 21, teamBScore: 15 }, { teamAScore: 18, teamBScore: 21 }, { teamAScore: 15, teamBScore: 10 }] },
      { team: null, sets: [] },
    ])
    expect(r).toEqual({ played: 3, won: 1 })
  })
})
