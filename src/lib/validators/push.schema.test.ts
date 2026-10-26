import { describe, expect, it } from "vitest"
import { isPushServiceUrl } from "./push.schema"

describe("isPushServiceUrl", () => {
  it("accepts the browser push services", () => {
    expect(isPushServiceUrl("https://fcm.googleapis.com/fcm/send/abc")).toBe(true)
    expect(isPushServiceUrl("https://updates.push.services.mozilla.com/wpush/v2/abc")).toBe(true)
    expect(isPushServiceUrl("https://web.push.apple.com/abc")).toBe(true)
    expect(isPushServiceUrl("https://wns2-par02p.notify.windows.com/w/?token=abc")).toBe(true)
  })

  it("rejects anything else", () => {
    expect(isPushServiceUrl("http://fcm.googleapis.com/fcm/send/abc")).toBe(false)
    expect(isPushServiceUrl("https://fcm.googleapis.com.evil.com/x")).toBe(false)
    expect(isPushServiceUrl("https://evilpush.apple.com.example/x")).toBe(false)
    expect(isPushServiceUrl("https://169.254.169.254/latest")).toBe(false)
    expect(isPushServiceUrl("not a url")).toBe(false)
  })
})
