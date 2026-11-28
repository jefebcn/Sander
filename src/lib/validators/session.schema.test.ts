import { describe, it, expect } from "vitest"
import { CreateSessionSchema } from "./session.schema"

const base = { location: "Bagno 26", date: "2026-12-01T18:00:00Z", format: "TWO_VS_TWO" }

describe("CreateSessionSchema quotaAmount", () => {
  it("accepts a quota above 10 € (cents)", () => {
    expect(CreateSessionSchema.safeParse({ ...base, paymentType: "QUOTA", quotaAmount: 1500 }).success).toBe(true)
  })
  it("rejects a quota above 100 €", () => {
    expect(CreateSessionSchema.safeParse({ ...base, paymentType: "QUOTA", quotaAmount: 10_050 }).success).toBe(false)
  })
  it("caps SanderCredits at 1000", () => {
    expect(CreateSessionSchema.safeParse({ ...base, paymentType: "SC", quotaAmount: 1000 }).success).toBe(true)
    expect(CreateSessionSchema.safeParse({ ...base, paymentType: "SC", quotaAmount: 1001 }).success).toBe(false)
  })
})
