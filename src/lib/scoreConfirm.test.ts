import { describe, expect, it } from "vitest"
import { autoConfirmAt, scoreConfirmers, scoreState } from "./scoreConfirm"

const parts = [
  { playerId: "a1", team: 0 },
  { playerId: "a2", team: 0 },
  { playerId: "b1", team: 1 },
  { playerId: null, team: 1 }, // guest
  { playerId: "b2", team: 1 },
]

describe("scoreConfirmers", () => {
  it("is the real players on the other team", () => {
    expect(scoreConfirmers(parts, "a1")).toEqual(["b1", "b2"])
    expect(scoreConfirmers(parts, "b2")).toEqual(["a1", "a2"])
  })
  it("is every other real player when the submitter has no team or it's multi-match", () => {
    expect(scoreConfirmers(parts, "org")).toEqual(["a1", "a2", "b1", "b2"])
    expect(scoreConfirmers(parts, "a1", true)).toEqual(["a2", "b1", "b2"])
  })
  it("is empty when only guests are on the other side", () => {
    expect(scoreConfirmers([{ playerId: "a1", team: 0 }, { playerId: null, team: 1 }], "a1")).toEqual([])
  })
})

describe("scoreState", () => {
  const sub = new Date("2026-10-29T10:00:00Z")
  const none = { scoreSubmittedAt: null, scoreConfirmedAt: null, scoreDisputedAt: null }
  it("reads each stage", () => {
    expect(scoreState(none)).toBe("none")
    expect(scoreState({ ...none, scoreSubmittedAt: sub }, new Date("2026-10-30T09:59:00Z"))).toBe("pending")
    expect(scoreState({ ...none, scoreSubmittedAt: sub }, new Date("2026-10-30T10:00:00Z"))).toBe("due")
    expect(scoreState({ ...none, scoreSubmittedAt: sub, scoreConfirmedAt: sub })).toBe("confirmed")
    expect(scoreState({ ...none, scoreSubmittedAt: sub, scoreDisputedAt: sub })).toBe("disputed")
  })
  it("confirms itself 24 hours after submission", () => {
    expect(autoConfirmAt(sub).toISOString()).toBe("2026-10-30T10:00:00.000Z")
  })
})
