/* ────────────────────────────────────────────────────────────────────────── */
/*  SumUp Online Payments: the few calls SANDER needs (hosted checkout).       */
/*  Server only. Configured by SUMUP_API_KEY + SUMUP_MERCHANT_CODE; without    */
/*  them the app keeps using Stripe.                                          */
/*  Docs: https://developer.sumup.com/online-payments/checkouts/hosted-checkout */
/* ────────────────────────────────────────────────────────────────────────── */

const API = "https://api.sumup.com/v0.1"

export function sumupConfigured(): boolean {
  return !!process.env.SUMUP_API_KEY && !!process.env.SUMUP_MERCHANT_CODE
}

export type SumUpCheckout = {
  id: string
  checkout_reference: string
  amount: number
  currency: string
  status: string // PENDING | PAID | FAILED | EXPIRED
  hosted_checkout_url?: string
  transactions?: { id: string; status: string; amount: number }[]
}

async function call<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.SUMUP_API_KEY}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`SumUp ${init.method ?? "GET"} ${path} → ${res.status} ${text.slice(0, 200)}`)
  }
  return (await res.json()) as T
}

/** A hosted checkout: SumUp's own payment page, valid 30 minutes. */
export async function createHostedCheckout(input: {
  reference: string
  amountCents: number
  description: string
  redirectUrl: string
  returnUrl: string
}): Promise<{ id: string; url: string }> {
  const c = await call<SumUpCheckout>("/checkouts", {
    method: "POST",
    body: JSON.stringify({
      checkout_reference: input.reference,
      amount: input.amountCents / 100,
      currency: "EUR",
      merchant_code: process.env.SUMUP_MERCHANT_CODE,
      description: input.description,
      redirect_url: input.redirectUrl,
      // SumUp posts status changes here; the handler re-reads the checkout.
      return_url: input.returnUrl,
      hosted_checkout: { enabled: true },
    }),
  })
  if (!c.hosted_checkout_url) throw new Error("SumUp checkout without hosted_checkout_url")
  return { id: c.id, url: c.hosted_checkout_url }
}

export function getCheckout(id: string): Promise<SumUpCheckout> {
  return call<SumUpCheckout>(`/checkouts/${encodeURIComponent(id)}`)
}

/**
 * Whether a checkout SumUp reports is the one we created, fully paid. Only
 * SumUp's own answer counts (never the webhook body), and it must match our
 * reference and amount to the cent.
 */
export function isPaidAsExpected(remote: Pick<SumUpCheckout, "status" | "checkout_reference" | "amount" | "currency">, expected: { reference: string; amountCents: number }): boolean {
  return (
    remote.status === "PAID" &&
    remote.checkout_reference === expected.reference &&
    remote.currency === "EUR" &&
    Math.round(remote.amount * 100) === expected.amountCents
  )
}
