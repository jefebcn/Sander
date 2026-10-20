import { describe, it, expect } from "vitest"
import { errorFingerprint } from "./errorFingerprint"

describe("errorFingerprint", () => {
  it("raggruppa lo stesso errore con id e numeri diversi", () => {
    const a = errorFingerprint({ source: "server", message: "Match abc123def456 non trovato", path: "GET /sessions/cm1x9 (render)" })
    const b = errorFingerprint({ source: "server", message: "Match 99ffee001122 non trovato", path: "GET /sessions/cm7z2 (render)" })
    expect(a).toBe(b)
  })

  it("tiene separati errori diversi, pagine diverse e browser/server", () => {
    const base = { source: "client", message: "x is undefined", path: "/scopri" }
    expect(errorFingerprint(base)).not.toBe(errorFingerprint({ ...base, message: "y is undefined" }))
    expect(errorFingerprint(base)).not.toBe(errorFingerprint({ ...base, path: "/players" }))
    expect(errorFingerprint(base)).not.toBe(errorFingerprint({ ...base, source: "server" }))
  })

  it("ignora la query string", () => {
    const base = { source: "client", message: "boom", path: "/players?tab=podio" }
    expect(errorFingerprint(base)).toBe(errorFingerprint({ ...base, path: "/players" }))
  })
})
