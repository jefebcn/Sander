import { describe, it, expect } from "vitest"
import { gestureFor, gestureByKey, SELFIE_GESTURES } from "./selfie"

describe("gestureFor", () => {
  it("is the same all day for the same person", () => {
    expect(gestureFor("p1", "2026-10-20").key).toBe(gestureFor("p1", "2026-10-20").key)
  })
  it("varies across people and days", () => {
    const keys = new Set<string>()
    for (let i = 0; i < 40; i++) keys.add(gestureFor(`p${i}`, "2026-10-20").key)
    for (let d = 1; d <= 20; d++) keys.add(gestureFor("p1", `2026-10-${String(d).padStart(2, "0")}`).key)
    expect(keys.size).toBeGreaterThan(3)
  })
  it("always returns a known gesture", () => {
    expect(gestureByKey(gestureFor("x", "2026-01-01").key)).toBeDefined()
    expect(SELFIE_GESTURES.length).toBeGreaterThan(3)
  })
})
