import { describe, expect, it } from "vitest"
import { paymentLinkFor, paymentProvider } from "./paymentLink"

describe("paymentProvider", () => {
  it("accepts known services over https", () => {
    expect(paymentProvider("https://paypal.me/custorino")?.name).toBe("PayPal")
    expect(paymentProvider("https://www.paypal.com/paypalme/cus")?.name).toBe("PayPal")
    expect(paymentProvider("https://pay.sumup.com/b2c/Q123")?.name).toBe("SumUp")
    expect(paymentProvider("https://web.satispay.com/app/match/link/x")?.name).toBe("Satispay")
    expect(paymentProvider("https://revolut.me/cus")?.name).toBe("Revolut")
    expect(paymentProvider("https://buy.stripe.com/abc")?.name).toBe("Stripe")
    expect(paymentProvider("https://bunq.me/cus")?.name).toBe("bunq")
  })
  it("refuses look-alikes, http and other sites", () => {
    expect(paymentProvider("https://paypal.me.evil.com/x")).toBeNull()
    expect(paymentProvider("https://evilpaypal.com/x")).toBeNull()
    expect(paymentProvider("http://paypal.me/cus")).toBeNull()
    expect(paymentProvider("https://example.com/pay")).toBeNull()
    expect(paymentProvider("javascript:alert(1)")).toBeNull()
    expect(paymentProvider(null)).toBeNull()
  })
})

describe("paymentLinkFor", () => {
  it("puts the amount in PayPal.me and bunq.me links", () => {
    expect(paymentLinkFor("https://paypal.me/custorino", 2500)).toBe("https://paypal.me/custorino/25EUR")
    expect(paymentLinkFor("https://www.paypal.me/cus", 1250)).toBe("https://www.paypal.me/cus/12.50EUR")
    expect(paymentLinkFor("https://bunq.me/cus", 2000)).toBe("https://bunq.me/cus/20")
  })
  it("leaves other links (and links with an amount already) as they are", () => {
    expect(paymentLinkFor("https://paypal.me/cus/30", 2500)).toBe("https://paypal.me/cus/30")
    expect(paymentLinkFor("https://pay.sumup.com/b2c/Q123", 2500)).toBe("https://pay.sumup.com/b2c/Q123")
    expect(paymentLinkFor("https://example.com/x", 2500)).toBeNull()
  })
})
