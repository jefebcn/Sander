import { describe, expect, it } from "vitest"
import { csvCell, registrationsCsv } from "./registrationsCsv"

describe("csvCell", () => {
  it("quotes separators and quotes", () => {
    expect(csvCell('Gigi; "il muro"')).toBe('"Gigi; ""il muro"""')
  })
  it("defuses formulas", () => {
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)")
  })
})

describe("registrationsCsv", () => {
  it("writes an Excel-friendly list", () => {
    const csv = registrationsCsv([
      { seed: 1, team: "Anna & Luca", name: "Anna", email: "a@x.it", city: "Torino", paymentStatus: "PENDING", paymentMethod: "ON_SITE", createdAt: new Date("2026-11-05T10:00:00Z") },
    ])
    expect(csv.startsWith("﻿N.;Coppia;")).toBe(true)
    expect(csv).toContain("1;Anna & Luca;Anna;a@x.it;Torino;Da pagare;Al campo;05/11/2026")
  })
})
