import { describe, it, expect } from "vitest"
import { isSafeImageType, imageExtension } from "./imageUpload"

describe("isSafeImageType", () => {
  it("accepts common raster formats", () => {
    expect(isSafeImageType("image/png")).toBe(true)
    expect(isSafeImageType("image/jpeg")).toBe(true)
    expect(isSafeImageType("IMAGE/WEBP")).toBe(true)
    expect(isSafeImageType("image/png; charset=binary")).toBe(true)
  })
  it("rejects svg, html and empty types", () => {
    expect(isSafeImageType("image/svg+xml")).toBe(false)
    expect(isSafeImageType("text/html")).toBe(false)
    expect(isSafeImageType("")).toBe(false)
    expect(isSafeImageType(null)).toBe(false)
  })
})

describe("imageExtension", () => {
  it("maps types to extensions", () => {
    expect(imageExtension("image/jpeg")).toBe("jpg")
    expect(imageExtension("image/svg+xml")).toBe("img")
  })
})
