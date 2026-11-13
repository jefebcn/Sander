import { describe, it, expect } from "vitest"
import {
  tournamentProgress,
  tournamentDeadlines,
  relativeDay,
  simulateTournament,
  simulationTeams,
  roundLabel,
  seedPositions,
  type SimRegistration,
} from "./preview"

const now = new Date("2026-11-13T10:00:00Z") // venerdì

const base = {
  status: "DRAFT",
  isOpenForRegistration: true,
  registrationDeadline: new Date("2026-11-15T18:00:00Z") as Date | null,
  date: new Date("2026-11-21T09:00:00Z"),
}

const states = (steps: ReturnType<typeof tournamentProgress>) => steps.map((s) => `${s.key}:${s.state}`)

describe("tournamentProgress", () => {
  it("open registrations are the current step", () => {
    const p = tournamentProgress(base, now)
    expect(states(p)).toEqual(["iscrizioni:current", "tabellone:todo", "gioco:todo", "risultati:todo"])
    expect(p[0].detail).toBe("aperte")
  })

  it("deadline passed: waiting for teams and bracket", () => {
    const p = tournamentProgress({ ...base, registrationDeadline: new Date("2026-11-12T10:00:00Z") }, now)
    expect(states(p)).toEqual(["iscrizioni:done", "tabellone:current", "gioco:todo", "risultati:todo"])
    expect(p[0].detail).toBe("chiuse")
  })

  it("sign-ups not opened yet", () => {
    const p = tournamentProgress({ ...base, isOpenForRegistration: false }, now)
    expect(p[0]).toMatchObject({ state: "current", detail: "non ancora aperte" })
    expect(p[1].state).toBe("todo")
  })

  it("live and completed", () => {
    expect(states(tournamentProgress({ ...base, status: "LIVE" }, now))).toEqual([
      "iscrizioni:done", "tabellone:done", "gioco:current", "risultati:todo",
    ])
    expect(states(tournamentProgress({ ...base, status: "COMPLETED" }, now))).toEqual([
      "iscrizioni:done", "tabellone:done", "gioco:done", "risultati:done",
    ])
  })
})

describe("deadlines", () => {
  it("relative days in Rome time", () => {
    expect(relativeDay(new Date("2026-11-13T20:00:00Z"), now)).toBe("oggi")
    expect(relativeDay(new Date("2026-11-14T08:00:00Z"), now)).toBe("domani")
    expect(relativeDay(new Date("2026-11-16T08:00:00Z"), now)).toBe("tra 3 giorni")
    expect(relativeDay(new Date("2026-11-21T08:00:00Z"), now)).toBe("tra una settimana")
    expect(relativeDay(new Date("2026-12-04T08:00:00Z"), now)).toBe("tra 3 settimane")
    expect(relativeDay(new Date("2026-11-12T08:00:00Z"), now)).toBe("passata")
  })

  it("lists closing and start in order", () => {
    const d = tournamentDeadlines(base, now)
    expect(d.map((x) => x.key)).toEqual(["iscrizioni", "inizio"])
    expect(d[0].relative).toBe("tra 2 giorni")
    expect(d[1].relative).toBe("tra una settimana")
  })

  it("no closing date once live, nothing once completed", () => {
    expect(tournamentDeadlines({ ...base, status: "LIVE" }, now).map((x) => x.relative)).toEqual(["in corso"])
    expect(tournamentDeadlines({ ...base, status: "COMPLETED" }, now)).toEqual([])
  })

  it("a start earlier today is still today, not passed", () => {
    const d = tournamentDeadlines({ ...base, registrationDeadline: null, date: new Date("2026-11-13T08:00:00Z") }, now)
    expect(d[0]).toMatchObject({ relative: "oggi", past: false })
  })
})

const reg = (id: string, rating: number, seed: number | null = null, minute = 0): SimRegistration => ({
  seedPosition: seed,
  createdAt: new Date(Date.UTC(2026, 10, 1, 10, minute)),
  player: { id, name: id.toUpperCase(), rating },
})

describe("simulation", () => {
  it("pairs follow seed order and are ranked by average rating", () => {
    const { teams, leftOut } = simulationTeams("BRACKETS", [
      reg("a", 1500, 1), reg("b", 1500, 2), reg("c", 1800, 3), reg("d", 1700, 4), reg("e", 1600, 5),
    ])
    expect(teams.map((t) => t.label)).toEqual(["C – D", "A – B"])
    expect(teams.map((t) => t.seed)).toEqual([1, 2])
    expect(leftOut).toEqual(["E"])
  })

  it("individual formats rank players", () => {
    const sim = simulateTournament("KING_OF_THE_BEACH", [reg("a", 1400), reg("b", 1600, null, 1), reg("c", 1500, null, 2)])
    expect(sim?.kind).toBe("ranking")
    expect(sim?.ranking.map((t) => t.label)).toEqual(["B", "C", "A"])
    expect(sim?.rounds).toEqual([])
  })

  it("bracket: stronger side always wins, top seed takes the final", () => {
    // 8 players → 4 pairs; ratings make pair order clear.
    const regs = [
      reg("a", 1400, 1), reg("b", 1400, 2), // 1400
      reg("c", 1700, 3), reg("d", 1700, 4), // 1700
      reg("e", 1500, 5), reg("f", 1500, 6), // 1500
      reg("g", 1600, 7), reg("h", 1600, 8), // 1600
    ]
    const sim = simulateTournament("BRACKETS", regs)!
    expect(sim.kind).toBe("bracket")
    expect(sim.rounds.map((r) => r.label)).toEqual(["Semifinali", "Finale"])
    // Seeding 1v4, 2v3.
    const semis = sim.rounds[0].matches.map((m) => [m.a?.seed, m.b?.seed])
    expect(semis).toEqual([[1, 4], [2, 3]])
    const final = sim.rounds[1].matches[0]
    expect(final.winner?.label).toBe("C – D")
    expect([final.a?.seed, final.b?.seed]).toEqual([1, 2])
  })

  it("bracket with byes hides the bye matches", () => {
    // 3 pairs → bracket of 4, seed 1 has a bye.
    const regs = ["a", "b", "c", "d", "e", "f"].map((id, i) => reg(id, 1800 - Math.floor(i / 2) * 100, i + 1))
    const sim = simulateTournament("DOUBLE_ELIMINATION", regs)!
    expect(sim.rounds[0].label).toBe("Semifinali")
    expect(sim.rounds[0].matches).toHaveLength(1)
    expect(sim.rounds[1].matches[0].winner?.seed).toBe(1)
  })

  it("needs at least two teams", () => {
    expect(simulateTournament("BRACKETS", [reg("a", 1500, 1), reg("b", 1500, 2)])).toBeNull()
  })

  it("standard seed positions", () => {
    expect(seedPositions(2)).toEqual([1, 2])
    expect(seedPositions(4)).toEqual([1, 4, 2, 3])
    expect(seedPositions(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6])
  })

  it("round labels", () => {
    expect([2, 4, 8, 16, 32].map(roundLabel)).toEqual(["Finale", "Semifinali", "Quarti", "Ottavi", "Primo turno"])
  })
})
