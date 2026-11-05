import { describe, expect, it } from "vitest"
import { apnsBody, apnsConfigured } from "./apns"
import { NativePushTokenSchema } from "./validators/push.schema"

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
