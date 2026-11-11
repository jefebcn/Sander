import { describe, expect, it } from "vitest"
import { clubRoster, clubRosterCsv, clubYearStats, filterRoster, type RosterReg, type StatsTournament } from "./clubRoster"

const NOW = new Date("2026-11-11T15:00:00")
const d = (s: string) => new Date(s)
const reg = (over: Partial<RosterReg>): RosterReg => ({
  playerId: "p1",
  tournamentId: "t1",
  tournamentDate: d("2026-10-01T10:00:00"),
  priceCents: 1500,
  paymentStatus: "PAID",
  isSpectator: false,
  checkedInAt: null,
  createdAt: d("2026-09-20T10:00:00"),
  ...over,
})

describe("clubRoster", () => {
  const rows = clubRoster(
    [
      reg({ checkedInAt: d("2026-10-01T09:00:00") }),
      reg({ tournamentId: "t2", tournamentDate: d("2026-11-05T10:00:00"), paymentStatus: "PENDING" }),
      reg({ tournamentId: "t2", tournamentDate: d("2026-11-05T10:00:00"), paymentStatus: "PENDING" }), // same tournament twice (pair row)
      reg({ playerId: "p2", paymentStatus: "CANCELLED" }),
      reg({ playerId: "p3", isSpectator: true }),
      reg({ playerId: "p4", tournamentId: "t2", tournamentDate: d("2026-11-05T10:00:00"), priceCents: null, paymentStatus: "PENDING", createdAt: d("2026-11-01T10:00:00") }),
    ],
    [
      { playerId: "p1", createdAt: d("2026-01-01T10:00:00") },
      { playerId: "p5", createdAt: d("2026-11-10T10:00:00") },
    ],
    NOW,
  )
  const by = Object.fromEntries(rows.map((r) => [r.playerId, r]))

  it("counts distinct tournaments, check-ins, last date and what is owed", () => {
    expect(by.p1).toMatchObject({ tournaments: 2, checkins: 1, unpaidCount: 2, unpaidCents: 3000, follower: true, isNew: false })
    expect(by.p1.lastDate).toEqual(d("2026-11-05T10:00:00"))
    expect(by.p1.firstSeen).toEqual(d("2026-01-01T10:00:00"))
  })

  it("leaves out cancelled seats and spectators, keeps followers, flags newcomers", () => {
    expect(by.p2).toBeUndefined()
    expect(by.p3).toBeUndefined()
    expect(by.p4).toMatchObject({ tournaments: 1, unpaidCount: 0, isNew: true })
    expect(by.p5).toMatchObject({ tournaments: 0, lastDate: null, follower: true, isNew: true })
    expect(rows.at(-1)?.playerId).toBe("p5")
  })

  it("filters by chip and name", () => {
    const named = rows.map((r) => ({ ...r, name: { p1: "Marco Rossi", p4: "Sara", p5: "Luca" }[r.playerId] ?? "" }))
    expect(filterRoster(named, "da-pagare", "").map((r) => r.playerId)).toEqual(["p1"])
    expect(filterRoster(named, "nuovi", "").map((r) => r.playerId).sort()).toEqual(["p4", "p5"])
    expect(filterRoster(named, "tutti", "ross").map((r) => r.playerId)).toEqual(["p1"])
  })

  it("exports a CSV Excel opens, formulas defused", () => {
    const csv = clubRosterCsv([{ ...by.p1, name: "=HYPERLINK()", email: "m@x.it", city: "Rimini" }])
    expect(csv.startsWith("﻿Giocatore;Email")).toBe(true)
    expect(csv).toContain("'=HYPERLINK();m@x.it;Rimini;2;1;05/11/2026;30,00;Sì;01/01/2026")
  })
})

describe("clubYearStats", () => {
  const t = (over: Partial<StatsTournament>): StatsTournament => ({
    id: "t", date: d("2026-06-10T10:00:00"), status: "COMPLETED", priceCents: 1000, registrations: [], standings: [], ...over,
  })
  const r = (playerId: string, over: Partial<StatsTournament["registrations"][number]> = {}) => ({ playerId, paymentStatus: "PAID", isSpectator: false, checkedInAt: null, ...over })

  it("sums the year's sign-ups, quotas, months, attendance and table", () => {
    const s = clubYearStats(
      [
        t({ id: "a", registrations: [r("p1", { checkedInAt: d("2026-06-10T09:00:00") }), r("p2", { paymentStatus: "PENDING" })], standings: [{ playerId: "p1", rank: 1 }, { playerId: "p2", rank: 2 }] }),
        t({ id: "b", date: d("2026-07-01T10:00:00"), status: "DRAFT", registrations: [r("p1"), r("p3", { isSpectator: true })] }),
        t({ id: "old", date: d("2025-06-01T10:00:00"), registrations: [r("p1"), r("p2")] }),
      ],
      2026,
    )
    expect(s).toMatchObject({ tournaments: 2, signups: 3, signupsDelta: 50, collectedCents: 2000 })
    expect(s.monthly[5]).toBe(2)
    expect(s.monthly[6]).toBe(1)
    expect(s.topAttendees[0]).toEqual({ playerId: "p1", checkins: 1, tournaments: 2 })
    expect(s.table.map((x) => [x.playerId, x.points])).toEqual([["p1", 100], ["p2", 80]])
  })

  it("has no delta without a year before", () => {
    expect(clubYearStats([t({ registrations: [r("p1")] })], 2026).signupsDelta).toBeNull()
  })
})
