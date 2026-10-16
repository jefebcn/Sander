import { describe, expect, it } from "vitest"
import { safeCallbackUrl } from "./safeRedirect"

describe("safeCallbackUrl", () => {
  it("keeps same-site paths", () => {
    expect(safeCallbackUrl("/sessions/new")).toBe("/sessions/new")
    expect(safeCallbackUrl("/profile?tab=invita")).toBe("/profile?tab=invita")
    expect(safeCallbackUrl("/")).toBe("/")
  })

  it("falls back for missing or non-string input", () => {
    expect(safeCallbackUrl(undefined)).toBe("/")
    expect(safeCallbackUrl(null)).toBe("/")
    expect(safeCallbackUrl(["/a"])).toBe("/")
    expect(safeCallbackUrl("")).toBe("/")
  })

  it("refuses absolute and protocol-relative URLs", () => {
    expect(safeCallbackUrl("https://evil.example")).toBe("/")
    expect(safeCallbackUrl("javascript:alert(1)")).toBe("/")
    expect(safeCallbackUrl("//evil.example")).toBe("/")
    expect(safeCallbackUrl("/\\evil.example")).toBe("/")
    expect(safeCallbackUrl("/\t/evil.example")).toBe("/")
    expect(safeCallbackUrl("sessions")).toBe("/")
  })
})
