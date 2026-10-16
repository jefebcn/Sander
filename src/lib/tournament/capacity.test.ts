import { describe, it, expect } from "vitest"
import { playersPerTeam, seatLimit, holdsSeat, hasFreeSeat } from "./capacity"

describe("playersPerTeam", () => {
  it("counts two seats per team for fixed-pair formats", () => {
    expect(playersPerTeam("BRACKETS")).toBe(2)
    expect(playersPerTeam("DOUBLE_ELIMINATION")).toBe(2)
    expect(playersPerTeam("ROUND_ROBIN")).toBe(2)
  })
  it("counts one seat per player for rotating formats", () => {
    expect(playersPerTeam("KING_OF_THE_BEACH")).toBe(1)
    expect(playersPerTeam("CHICECE")).toBe(1)
  })
})

describe("seatLimit", () => {
  it("is unlimited when maxTeams is missing or not positive", () => {
    expect(seatLimit("BRACKETS", null)).toBeNull()
    expect(seatLimit("BRACKETS", undefined)).toBeNull()
    expect(seatLimit("BRACKETS", 0)).toBeNull()
  })
  it("multiplies teams by players per team", () => {
    expect(seatLimit("BRACKETS", 8)).toBe(16)
    expect(seatLimit("KING_OF_THE_BEACH", 8)).toBe(8)
  })
})

describe("holdsSeat", () => {
  it("counts paid, free and pending players", () => {
    expect(holdsSeat({ paymentStatus: "PAID", isSpectator: false })).toBe(true)
    expect(holdsSeat({ paymentStatus: "FREE", isSpectator: false })).toBe(true)
    expect(holdsSeat({ paymentStatus: "PENDING", isSpectator: false })).toBe(true)
  })
  it("ignores cancelled, failed, refunded rows and spectators", () => {
    expect(holdsSeat({ paymentStatus: "CANCELLED", isSpectator: false })).toBe(false)
    expect(holdsSeat({ paymentStatus: "FAILED", isSpectator: false })).toBe(false)
    expect(holdsSeat({ paymentStatus: "REFUNDED", isSpectator: false })).toBe(false)
    expect(holdsSeat({ paymentStatus: "PAID", isSpectator: true })).toBe(false)
  })
})

describe("hasFreeSeat", () => {
  it("always allows when unlimited", () => {
    expect(hasFreeSeat("CHICECE", null, 1000)).toBe(true)
  })
  it("allows until the limit and rejects when full", () => {
    expect(hasFreeSeat("KING_OF_THE_BEACH", 4, 3)).toBe(true)
    expect(hasFreeSeat("KING_OF_THE_BEACH", 4, 4)).toBe(false)
    expect(hasFreeSeat("BRACKETS", 2, 3)).toBe(true)
    expect(hasFreeSeat("BRACKETS", 2, 4)).toBe(false)
  })
})
