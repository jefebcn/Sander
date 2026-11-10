import { describe, expect, it } from "vitest"
import { apnsBody, apnsConfigured, normalizeP8 } from "./apns"
import { NativePushTokenSchema } from "./validators/push.schema"
import { generateKeyPairSync } from "node:crypto"
import { importPKCS8 } from "jose"

describe("apnsBody", () => {
  it("puts the alert under aps and the url beside it", () => {
    expect(JSON.parse(apnsBody({ title: "Match!", body: "Marco ti ha scritto", url: "/messaggi/1" }))).toEqual({
      aps: { alert: { title: "Match!", body: "Marco ti ha scritto" }, sound: "default" },
      url: "/messaggi/1",
    })
  })

  it("leaves out a missing url", () => {
    expect(JSON.parse(apnsBody({ title: "a", body: "b" }))).not.toHaveProperty("url")
  })
})

describe("apnsConfigured", () => {
  it("is off without the key", () => {
    expect(apnsConfigured()).toBe(false)
  })
})

describe("NativePushTokenSchema", () => {
  it("accepts an APNs hex token", () => {
    expect(NativePushTokenSchema.parse({ token: "a".repeat(64), platform: "ios" }).token).toHaveLength(64)
  })

  it("refuses anything else", () => {
    expect(() => NativePushTokenSchema.parse({ token: "https://evil.example", platform: "ios" })).toThrow()
    expect(() => NativePushTokenSchema.parse({ token: "a".repeat(64), platform: "android" })).toThrow()
  })
})

describe("normalizeP8", () => {
  const pem = generateKeyPairSync("ec", { namedCurve: "P-256" })
    .privateKey.export({ type: "pkcs8", format: "pem" })
    .toString()
  const body = pem.replace(/-----[^-]+-----/g, "").replace(/\s/g, "")
  const pastes: Record<string, string> = {
    "as downloaded": pem,
    "line breaks turned into spaces": pem.replace(/\n/g, " "),
    "\\n escapes": pem.replace(/\n/g, "\\n"),
    "wrapped in quotes": `"${pem}"`,
    "base64 only, no BEGIN/END": body,
    "BEGIN/END on one line": `-----BEGIN PRIVATE KEY-----${body}-----END PRIVATE KEY-----`,
  }
  for (const [name, raw] of Object.entries(pastes)) {
    it(`imports the key: ${name}`, async () => {
      await expect(importPKCS8(normalizeP8(raw), "ES256")).resolves.toBeTruthy()
    })
  }
})
