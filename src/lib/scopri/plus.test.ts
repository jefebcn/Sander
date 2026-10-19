import { describe, it, expect } from "vitest"
import type Stripe from "stripe"
import { subscriptionPeriodEnd, plusUntilFor, invoiceSubscriptionId } from "./plus"

const sub = (o: Partial<Stripe.Subscription>) => ({ status: "active", ended_at: null, items: { data: [] }, ...o }) as unknown as Stripe.Subscription

describe("SANDER+", () => {
  it("reads the period end from the items, or the legacy field", () => {
    expect(subscriptionPeriodEnd(sub({ items: { data: [{ current_period_end: 1_800_000_000 }] } as never }))?.getTime()).toBe(1_800_000_000_000)
    expect(subscriptionPeriodEnd({ ...sub({}), current_period_end: 1_700_000_000 } as never)?.getTime()).toBe(1_700_000_000_000)
    expect(subscriptionPeriodEnd(sub({}))).toBeNull()
  })
  it("keeps access while active or past due, until the end when canceled", () => {
    const end = new Date("2026-11-19T00:00:00Z")
    expect(plusUntilFor(sub({ status: "active" }), end)).toBe(end)
    expect(plusUntilFor(sub({ status: "past_due" }), end)).toBe(end)
    expect(plusUntilFor(sub({ status: "canceled", ended_at: 1_790_000_000 }), end)?.getTime()).toBe(1_790_000_000_000)
    expect(plusUntilFor(sub({ status: "incomplete_expired" }), end)).toBeNull()
  })
  it("finds the subscription of an invoice in both API shapes", () => {
    expect(invoiceSubscriptionId({ parent: { subscription_details: { subscription: "sub_1" } } } as never)).toBe("sub_1")
    expect(invoiceSubscriptionId({ parent: null, subscription: "sub_2" } as never)).toBe("sub_2")
    expect(invoiceSubscriptionId({ parent: null } as never)).toBeNull()
  })
})
