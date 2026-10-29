/**
 * SumUp sandbox smoke test: the same calls the app makes (lib/sumup.ts),
 * without touching SANDER's database.
 *
 *   SUMUP_MERCHANT_CODE=<sandbox code> node scripts/sumup/sandbox-smoke.mjs [amount]
 *
 * Auth: SUMUP_API_KEY (a SANDBOX key), or a Bearer secret for api.sumup.com
 * injected by the environment. amount defaults to 4.99 (the 30-day pass);
 * 11 makes SumUp fail the payment on purpose.
 *
 * 1. creates a hosted checkout and prints its URL
 * 2. you pay there with a test card (VISA 4200 0000 0000 0091, any CVV, any future date)
 * 3. it polls the checkout until PAID / FAILED / EXPIRED and checks it the way the app does
 */
import { randomUUID } from "crypto"

const API = "https://api.sumup.com/v0.1"
const merchant = process.env.SUMUP_MERCHANT_CODE
if (!merchant) throw new Error("Set SUMUP_MERCHANT_CODE (sandbox merchant code)")
const amount = Number(process.argv[2] ?? "4.99")
const headers = { "Content-Type": "application/json", ...(process.env.SUMUP_API_KEY ? { Authorization: `Bearer ${process.env.SUMUP_API_KEY}` } : {}) }

async function call(path, init = {}) {
  const res = await fetch(`${API}${path}`, { ...init, headers })
  const body = await res.text()
  if (!res.ok) throw new Error(`${init.method ?? "GET"} ${path} → ${res.status} ${body.slice(0, 300)}`)
  return JSON.parse(body)
}

const reference = `smoke_${randomUUID()}`
const created = await call("/checkouts", {
  method: "POST",
  body: JSON.stringify({
    checkout_reference: reference,
    amount,
    currency: "EUR",
    merchant_code: merchant,
    description: "SANDER sandbox smoke test",
    redirect_url: "https://www.sanderbv.it/scopri/plus",
    hosted_checkout: { enabled: true },
  }),
})
console.log(`checkout ${created.id} · ${amount} EUR · ${created.status}`)
console.log(`pay here: ${created.hosted_checkout_url}`)

for (let i = 0; i < 120; i++) {
  await new Promise((r) => setTimeout(r, 5000))
  const c = await call(`/checkouts/${created.id}`)
  if (c.status === "PENDING") continue
  const ok = c.status === "PAID" && c.checkout_reference === reference && c.currency === "EUR" && Math.round(c.amount * 100) === Math.round(amount * 100)
  console.log(`final status ${c.status} · transactions ${JSON.stringify(c.transactions?.map((t) => ({ id: t.id, status: t.status })))}`)
  console.log(ok ? "OK: the app would grant this purchase" : "NOT granted (as expected for a failed/expired payment)")
  process.exit(0)
}
console.log("still PENDING after 10 minutes (hosted sessions expire after 30)")
