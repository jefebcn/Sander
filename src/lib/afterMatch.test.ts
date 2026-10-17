import { describe, it, expect } from "vitest"
import { matchOutcome, resultEntryFor, wasPlayed } from "./afterMatch"

describe("matchOutcome", () => {
  const sets = [
    { teamAScore: 21, teamBScore: 18 },
    { teamAScore: 15, teamBScore: 21 },
    { teamAScore: 15, teamBScore: 12 },
  ]

  it("counts sets won, from either side", () => {
    expect(matchOutcome(sets, 0)).toBe("win")
    expect(matchOutcome(sets, 1)).toBe("loss")
  })

  it("calls an even split a draw, not a defeat", () => {
    expect(matchOutcome(sets.slice(0, 2), 0)).toBe("draw")
    expect(matchOutcome(sets.slice(0, 2), 1)).toBe("draw")
  })

  it("is null without sets or without a team", () => {
    expect(matchOutcome([], 0)).toBeNull()
    expect(matchOutcome(sets, null)).toBeNull()
    expect(matchOutcome(sets, undefined)).toBeNull()
  })
})

describe("resultEntryFor", () => {
  const base = { id: "s1", organizerId: "org", matchMode: false, hasLiveScore: false }
  const teams = [
    { team: 0, playerId: "me" },
    { team: 0, playerId: "a" },
    { team: 1, playerId: "b" },
    { team: 1, playerId: "c" },
  ]
  const noTeams = teams.map((p) => ({ ...p, team: null }))

  it("sends the organizer to type the sets on the match page", () => {
    const toForm = { kind: "organizer", href: "/sessions/s1#risultato" }
    expect(resultEntryFor({ ...base, participants: teams }, "org")).toEqual(toForm)
    expect(resultEntryFor({ ...base, hasLiveScore: true, participants: teams }, "org")).toEqual(toForm)
    // Multi-match sessions set teams per match, so they go straight to scoring.
    expect(resultEntryFor({ ...base, matchMode: true, participants: noTeams }, "org")).toEqual(toForm)
  })

  it("asks the organizer to split the teams first, or the sets would move no rating", () => {
    const toTeams = { kind: "teams", href: "/sessions/s1" }
    expect(resultEntryFor({ ...base, participants: noTeams }, "org")).toEqual(toTeams)
    expect(resultEntryFor({ ...base, participants: teams.map((p) => ({ ...p, team: 1 })) }, "org")).toEqual(toTeams)
  })

  it("lets a player finish a live board that was already started", () => {
    expect(resultEntryFor({ ...base, hasLiveScore: true, participants: teams }, "me")).toEqual({
      kind: "board",
      href: "/segna?session=s1",
    })
  })

  it("never sends a player to replay a whole match point by point", () => {
    expect(resultEntryFor({ ...base, participants: teams }, "me")).toEqual({ kind: "wait", href: "/sessions/s1" })
  })

  it("only offers the board where it can save: both teams set, one match per session", () => {
    const oneSide = teams.map((p) => ({ ...p, team: 0 }))
    expect(resultEntryFor({ ...base, hasLiveScore: true, participants: oneSide }, "me").kind).toBe("wait")
    expect(resultEntryFor({ ...base, hasLiveScore: true, participants: noTeams }, "me").kind).toBe("wait")
    expect(resultEntryFor({ ...base, hasLiveScore: true, matchMode: true, participants: teams }, "me").kind).toBe("wait")
  })
})

describe("wasPlayed", () => {
  it("needs at least two registered players; guests don't count", () => {
    expect(wasPlayed([{ playerId: "a" }, { playerId: "b" }])).toBe(true)
    expect(wasPlayed([{ playerId: "a" }])).toBe(false)
    expect(wasPlayed([{ playerId: "a" }, { playerId: null }, { playerId: null }])).toBe(false)
    expect(wasPlayed([])).toBe(false)
  })
})
