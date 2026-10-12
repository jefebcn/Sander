import { describe, it, expect } from "vitest"
import { slotOf, weekdayOf, rankCandidates, nudgeLimit, nudgeMessage, type NudgeCandidate } from "./missingPlayer"

const d = (iso: string) => new Date(iso)
// Sat 17 Oct 2026, 18:30 in Rimini (CEST, UTC+2) → 16:30 UTC
const SAT_EVENING = d("2026-10-17T16:30:00Z")

describe("slotOf / weekdayOf", () => {
  it("reads the slot in Riviera time", () => {
    expect(slotOf(SAT_EVENING)).toBe("EVENING")
    expect(slotOf(d("2026-10-17T08:00:00Z"))).toBe("MORNING") // 10:00
    expect(slotOf(d("2026-10-17T13:00:00Z"))).toBe("AFTERNOON") // 15:00
  })
  it("reads the weekday in Riviera time", () => {
    expect(weekdayOf(SAT_EVENING)).toBe(6)
    // 23:30 UTC on Saturday is already Sunday in Rimini
    expect(weekdayOf(d("2026-10-17T23:30:00Z"))).toBe(0)
  })
})

describe("rankCandidates", () => {
  const session = { date: SAT_EVENING, city: "Rimini", avgRating: 1500, spotsLeft: 2 }
  const cand = (id: string, over: Partial<NudgeCandidate> = {}): NudgeCandidate => ({
    id, rating: 1500, homeCity: null, availability: [], ...over,
  })

  it("never pings someone with no reason to care", () => {
    expect(rankCandidates(session, [cand("stranger")], 8)).toEqual([])
  })

  it("puts people free at that time before people who just live there", () => {
    const ids = rankCandidates(session, [
      cand("local", { homeCity: "Rimini" }),
      cand("free", { availability: [{ weekday: 6, slot: "EVENING" }] }),
      cand("free-wrong-slot", { availability: [{ weekday: 6, slot: "MORNING" }] }),
    ], 8)
    expect(ids).toEqual(["free", "local"])
  })

  it("leaves out levels too far from the match", () => {
    const ids = rankCandidates(session, [
      cand("close", { homeCity: "Rimini", rating: 1580 }),
      cand("far", { homeCity: "Rimini", rating: 1850 }),
    ], 8)
    expect(ids).toEqual(["close"])
  })

  it("prefers the closer level among equals and respects the limit", () => {
    const ids = rankCandidates(session, [
      cand("a", { homeCity: "Rimini", rating: 1650 }),
      cand("b", { homeCity: "Rimini", rating: 1510 }),
      cand("c", { homeCity: "Rimini", rating: 1560 }),
    ], 2)
    expect(ids).toEqual(["b", "c"])
  })

  it("skips the level filter when nobody has joined yet", () => {
    const ids = rankCandidates({ ...session, avgRating: null }, [cand("x", { homeCity: "Rimini", rating: 1900 })], 8)
    expect(ids).toEqual(["x"])
  })
})

describe("nudgeLimit / nudgeMessage", () => {
  it("scales with free seats but never becomes a crowd", () => {
    expect(nudgeLimit(0)).toBe(0)
    expect(nudgeLimit(1)).toBe(3)
    expect(nudgeLimit(6)).toBe(8)
  })

  it("writes singular and plural correctly", () => {
    const now = d("2026-10-17T08:00:00Z")
    const one = nudgeMessage("missing", { date: SAT_EVENING, location: "Bagno 26", city: "Rimini", spotsLeft: 1 }, now)
    expect(one.title).toBe("Manca 1 giocatore 🏐")
    expect(one.body).toBe("Oggi · 18:30 · Bagno 26. Ti va di entrare?")
    const two = nudgeMessage("new", { date: SAT_EVENING, location: "Bagno 26", city: "Rimini", spotsLeft: 2 }, now)
    expect(two.title).toBe("Nuova partita a Rimini 🏐")
    expect(two.body).toBe("Oggi · 18:30 · cercano 2 giocatori. Ci sei?")
  })
})
