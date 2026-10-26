import { describe, it, expect } from "vitest"
import { classifyCheckoutSession, deriveRegistrationStatus } from "./registrationPayment"

describe("classifyCheckoutSession", () => {
  it("treats a paid session as paid even before the webhook", () => {
    expect(classifyCheckoutSession({ status: "complete", payment_status: "paid" })).toBe("paid")
    expect(classifyCheckoutSession({ status: "complete", payment_status: "no_payment_required" })).toBe("paid")
  })
  it("reuses an open session with a url", () => {
    expect(classifyCheckoutSession({ status: "open", payment_status: "unpaid", url: "https://x" })).toBe("open")
  })
  it("considers expired / url-less sessions closed", () => {
    expect(classifyCheckoutSession({ status: "expired", payment_status: "unpaid" })).toBe("closed")
    expect(classifyCheckoutSession({ status: "open", payment_status: "unpaid", url: null })).toBe("closed")
  })
  it("keeps a completed checkout whose money is still on its way (bank transfer)", () => {
    expect(classifyCheckoutSession({ status: "complete", payment_status: "unpaid" })).toBe("processing")
  })
})

describe("deriveRegistrationStatus", () => {
  it("handles missing registrations", () => {
    expect(deriveRegistrationStatus(null)).toBe("NOT_REGISTERED")
    expect(deriveRegistrationStatus(undefined)).toBe("NOT_REGISTERED")
  })
  it("maps paid/free to PAID", () => {
    expect(deriveRegistrationStatus({ paymentStatus: "PAID", paymentMethod: "STRIPE" })).toBe("PAID")
    expect(deriveRegistrationStatus({ paymentStatus: "FREE", paymentMethod: null })).toBe("PAID")
  })
  it("maps pending rows by method", () => {
    expect(deriveRegistrationStatus({ paymentStatus: "PENDING", paymentMethod: "STRIPE" })).toBe("PENDING_STRIPE")
    expect(deriveRegistrationStatus({ paymentStatus: "PENDING", paymentMethod: "CASH" })).toBe("PENDING_CASH")
    expect(deriveRegistrationStatus({ paymentStatus: "PENDING", paymentMethod: "PAYPAL" })).toBe("PENDING_PAYPAL")
    expect(deriveRegistrationStatus({ paymentStatus: "PENDING", paymentMethod: null })).toBe("REGISTERED_UNPAID")
  })
  it("treats cancelled/failed/refunded as not registered", () => {
    expect(deriveRegistrationStatus({ paymentStatus: "CANCELLED", paymentMethod: "CASH" })).toBe("NOT_REGISTERED")
    expect(deriveRegistrationStatus({ paymentStatus: "REFUNDED", paymentMethod: "STRIPE" })).toBe("NOT_REGISTERED")
  })
})
