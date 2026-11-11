import { describe, expect, it } from "vitest"
import { clubDashboard, isUpcoming, weeklyCounts, type DashTournament } from "./clubDashboard"
import { parseProfileMode, profileModeFromCookieString } from "./profileMode"

const NOW = new Date("2026-11-11T15:00:00")
const day = (n: number) => new Date(NOW.getTime() + n * 86_400_000)
const reg = (over: Partial<DashTournament["registrations"][number]> = {}) => ({
  createdAt: day(-1),
  paymentStatus: "PENDING",
  isSpectator: false,
  checkedInAt: null,
  ...over,
})
const tour = (over: Partial<DashTournament> = {}): DashTournament => ({
  id: "t",
  name: "Torneo",
  date: day(5),
  status: "DRAFT",
  type: "BRACKETS",
  priceCents: 1500,
  maxTeams: 8,
  registrations: [],
  waitlist: 0,
  ...over,
})

describe("isUpcoming", () => {
  it("counts today and later, not finished ones", () => {
    expect(isUpcoming({ date: new Date("2026-11-11T08:00:00"), status: "LIVE" }, NOW)).toBe(true)
    expect(isUpcoming({ date: day(-1), status: "DRAFT" }, NOW)).toBe(false)
    expect(isUpcoming({ date: day(3), status: "COMPLETED" }, NOW)).toBe(false)
  })
})

describe("weeklyCounts", () => {
  it("puts dates in 7-day buckets ending now, oldest first", () => {
    expect(weeklyCounts([day(-1), day(-2), day(-8), day(-60), day(1)], NOW, 4)).toEqual([0, 0, 1, 2])
  })
})

describe("clubDashboard", () => {
  it("sums seats and unpaid quotas of upcoming tournaments only", () => {
    const d = clubDashboard(
      [
        tour({ id: "a", registrations: [reg(), reg({ paymentStatus: "COMPLETED" }), reg({ paymentStatus: "CANCELLED" }), reg({ isSpectator: true })] }),
        tour({ id: "b", date: day(10), priceCents: null, registrations: [reg({ paymentStatus: "FREE" })] }),
        tour({ id: "old", date: day(-20), status: "COMPLETED", registrations: [reg(), reg()] }),
      ],
      NOW,
    )
    expect(d.upcomingPlayers).toBe(3)
    expect(d.unpaidCount).toBe(1)
    expect(d.unpaidCents).toBe(1500)
    expect(d.next).toMatchObject({ id: "a", players: 2, maxPlayers: 16 })
  })

  it("counts this month's check-ins and the weekly sign-ups", () => {
    const d = clubDashboard(
      [tour({ date: day(-3), status: "COMPLETED", registrations: [reg({ checkedInAt: day(-3) }), reg({ checkedInAt: new Date("2026-10-30T10:00:00") }), reg({ isSpectator: true, createdAt: day(-1) })] })],
      NOW,
    )
    expect(d.checkinsThisMonth).toBe(1)
    expect(d.weekly.at(-1)).toBe(2)
    expect(d.next).toBeNull()
  })
})

describe("profile mode cookie", () => {
  it("accepts club slugs only", () => {
    expect(parseProfileMode("cus-torino-beach")).toBe("cus-torino-beach")
    expect(parseProfileMode("../admin")).toBeNull()
    expect(parseProfileMode("")).toBeNull()
    expect(profileModeFromCookieString("a=1; sander_mode=bagno-26; b=2")).toBe("bagno-26")
    expect(profileModeFromCookieString("a=1")).toBeNull()
  })
})
