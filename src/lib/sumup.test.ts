import { afterEach, describe, expect, it, vi } from "vitest"
import { isPaidAsExpected } from "./sumup"

describe("isPaidAsExpected", () => {
  const expected = { reference: "sc_abc", amountCents: 1000 }
  it("accepts our checkout, paid in full", () => {
    expect(isPaidAsExpected({ status: "PAID", checkout_reference: "sc_abc", amount: 10, currency: "EUR" }, expected)).toBe(true)
    expect(isPaidAsExpected({ status: "PAID", checkout_reference: "sc_abc", amount: 9.999999, currency: "EUR" }, expected)).toBe(true)
  })
  it("refuses anything else", () => {
    expect(isPaidAsExpected({ status: "PENDING", checkout_reference: "sc_abc", amount: 10, currency: "EUR" }, expected)).toBe(false)
    expect(isPaidAsExpected({ status: "PAID", checkout_reference: "other", amount: 10, currency: "EUR" }, expected)).toBe(false)
    expect(isPaidAsExpected({ status: "PAID", checkout_reference: "sc_abc", amount: 1, currency: "EUR" }, expected)).toBe(false)
    expect(isPaidAsExpected({ status: "PAID", checkout_reference: "sc_abc", amount: 10, currency: "USD" }, expected)).toBe(false)
  })
})

describe("sumupHealth", () => {
  const env = { ...process.env }
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status })
  afterEach(() => { process.env = { ...env }; vi.unstubAllGlobals() })

  it("not configured", async () => {
    delete process.env.SUMUP_API_KEY
    const { sumupHealth } = await import("./sumup")
    expect(await sumupHealth()).toMatch(/^Non configurato/)
  })
  it("wrong key", async () => {
    process.env.SUMUP_API_KEY = "k"; process.env.SUMUP_MERCHANT_CODE = "MSZ4MSVB"
    vi.stubGlobal("fetch", vi.fn(async () => reply(401, { error: "unauthorized" })))
    const { sumupHealth } = await import("./sumup")
    expect(await sumupHealth()).toMatch(/^Chiave API non valida/)
  })
  it("key of another account", async () => {
    process.env.SUMUP_API_KEY = "k"; process.env.SUMUP_MERCHANT_CODE = "MSZ4MSVB"
    vi.stubGlobal("fetch", vi.fn(async () => reply(200, { merchant_profile: { merchant_code: "MOTHER" } })))
    const { sumupHealth } = await import("./sumup")
    expect(await sumupHealth()).toContain("MOTHER")
  })
  it("online payments off", async () => {
    process.env.SUMUP_API_KEY = "k"; process.env.SUMUP_MERCHANT_CODE = "MSZ4MSVB"
    const f = vi.fn()
      .mockResolvedValueOnce(reply(200, { merchant_profile: { merchant_code: "MSZ4MSVB" } }))
      .mockResolvedValueOnce(reply(403, { error_code: "FORBIDDEN", message: "insufficient scope" }))
    vi.stubGlobal("fetch", f)
    const { sumupHealth } = await import("./sumup")
    expect(await sumupHealth()).toMatch(/pagamenti online non sono attivi/)
  })
  it("all good: creates and deactivates a 1 € checkout", async () => {
    process.env.SUMUP_API_KEY = "k"; process.env.SUMUP_MERCHANT_CODE = "MSZ4MSVB"
    const f = vi.fn()
      .mockResolvedValueOnce(reply(200, { merchant_profile: { merchant_code: "MSZ4MSVB", company_name: "SANDER" } }))
      .mockResolvedValueOnce(reply(200, { id: "c1", checkout_reference: "x", amount: 1, currency: "EUR", status: "PENDING" }))
      .mockResolvedValueOnce(reply(200, { id: "c1", status: "INACTIVE" }))
    vi.stubGlobal("fetch", f)
    const { sumupHealth } = await import("./sumup")
    expect(await sumupHealth()).toMatch(/^Tutto a posto: conto MSZ4MSVB \(SANDER\)/)
    expect(f.mock.calls[2][1].method).toBe("DELETE")
  })
})
