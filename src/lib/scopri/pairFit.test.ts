import { describe, it, expect } from "vitest"
import { pairFit } from "./pairFit"

describe("pairFit", () => {
  it("a blocker and a defender complete each other", () => {
    const f = pairFit({ role: "BLOCKER", side: null }, { role: "DEFENDER", side: null })
    expect(f.kind).toBe("partner")
    expect(f.title).toContain("coppia completa")
    expect(f.detail).toBeNull()
  })

  it("notes the court sides when both are known", () => {
    expect(pairFit({ role: "BLOCKER", side: "SINISTRA" }, { role: "DEFENDER", side: "DESTRA" }).detail).toContain("lati diversi")
    expect(pairFit({ role: "BLOCKER", side: "SINISTRA" }, { role: "DEFENDER", side: "SINISTRA" }).detail).toContain("stesso lato")
  })

  it("same role on different sides can still pair up", () => {
    const f = pairFit({ role: "DEFENDER", side: "SINISTRA" }, { role: "DEFENDER", side: "ENTRAMBI" })
    expect(f.kind).toBe("partner")
  })

  it("same role, same or unknown side: better as opponents in a 2v2", () => {
    expect(pairFit({ role: "BLOCKER", side: null }, { role: "BLOCKER", side: null }).kind).toBe("rival")
    expect(pairFit({ role: "DEFENDER", side: "DESTRA" }, { role: "DEFENDER", side: "DESTRA" }).kind).toBe("rival")
  })
})
