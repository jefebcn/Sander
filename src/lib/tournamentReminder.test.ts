import { describe, expect, it } from "vitest"
import { tournamentReminder } from "./tournamentReminder"

const base = { name: "Tappa 1", date: new Date("2026-11-07T09:00:00Z"), location: "CUS Torino", priceCents: 2500, paysOnSite: true }

describe("tournamentReminder", () => {
  it("adds the time, the place and the fee still to pay", () => {
    const r = tournamentReminder(base, { paymentStatus: "PENDING", isSpectator: false })
    expect(r.title).toBe("Domani: Tappa 1")
    expect(r.body).toContain("alle 10:00, CUS Torino.")
    expect(r.body).toMatch(/Ricordati la quota: 25,00\s€, al campo\./)
  })
  it("no fee line once paid, for spectators or online payments", () => {
    expect(tournamentReminder(base, { paymentStatus: "PAID", isSpectator: false }).body).not.toContain("quota")
    expect(tournamentReminder(base, { paymentStatus: "PENDING", isSpectator: true }).body).not.toContain("quota")
    expect(tournamentReminder({ ...base, paysOnSite: false }, { paymentStatus: "PENDING", isSpectator: false }).body).not.toContain("quota")
  })
  it("date without a time: no 'alle'", () => {
    const r = tournamentReminder({ ...base, date: new Date("2026-11-07T00:00:00Z"), location: null }, { paymentStatus: "PAID", isSpectator: false })
    expect(r.body).toBe("Si gioca domani. Arriva 15 minuti prima per il check-in.")
  })
})
