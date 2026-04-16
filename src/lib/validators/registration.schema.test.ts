import { describe, it, expect } from "vitest"
import {
  StartCheckoutSchema,
  CreateManualPaymentSchema,
  AdminConfirmManualPaymentSchema,
  CancelRegistrationSchema,
} from "./registration.schema"

describe("StartCheckoutSchema", () => {
  it("accepts a valid tournamentId", () => {
    const result = StartCheckoutSchema.safeParse({ tournamentId: "abc123" })
    expect(result.success).toBe(true)
  })

  it("rejects empty tournamentId", () => {
    const result = StartCheckoutSchema.safeParse({ tournamentId: "" })
    expect(result.success).toBe(false)
  })

  it("rejects missing tournamentId", () => {
    const result = StartCheckoutSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

describe("CreateManualPaymentSchema", () => {
  it("accepts a valid tournamentId", () => {
    expect(CreateManualPaymentSchema.safeParse({ tournamentId: "t1" }).success).toBe(true)
  })
})

describe("AdminConfirmManualPaymentSchema", () => {
  it("accepts registrationId without notes", () => {
    const result = AdminConfirmManualPaymentSchema.safeParse({ registrationId: "r1" })
    expect(result.success).toBe(true)
  })

  it("accepts registrationId with notes", () => {
    const result = AdminConfirmManualPaymentSchema.safeParse({
      registrationId: "r1",
      notes: "Pagamento ricevuto 15 aprile",
    })
    expect(result.success).toBe(true)
  })

  it("rejects notes longer than 500 chars", () => {
    const result = AdminConfirmManualPaymentSchema.safeParse({
      registrationId: "r1",
      notes: "x".repeat(501),
    })
    expect(result.success).toBe(false)
  })
})

describe("CancelRegistrationSchema", () => {
  it("accepts valid registrationId", () => {
    expect(CancelRegistrationSchema.safeParse({ registrationId: "r1" }).success).toBe(true)
  })

  it("rejects empty registrationId", () => {
    expect(CancelRegistrationSchema.safeParse({ registrationId: "" }).success).toBe(false)
  })
})
