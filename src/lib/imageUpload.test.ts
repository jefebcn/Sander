import { describe, it, expect } from "vitest"
import { isSafeImageType, imageExtension, sniffImageType } from "./imageUpload"

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

describe("sniffImageType", () => {
  const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)])
  it("recognises raster signatures", () => {
    expect(sniffImageType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe("image/png")
    expect(sniffImageType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("image/jpeg")
    expect(sniffImageType(bytes(0x47, 0x49, 0x46, 0x38, 0x39, 0x61))).toBe("image/gif")
    expect(sniffImageType(bytes(0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50))).toBe("image/webp")
  })
  it("rejects svg/html disguised as images", () => {
    expect(sniffImageType(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'>"))).toBeNull()
    expect(sniffImageType(new TextEncoder().encode("<html><script>"))).toBeNull()
  })
})
