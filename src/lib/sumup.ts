/* ────────────────────────────────────────────────────────────────────────── */
/*  SumUp Online Payments: the few calls SANDER needs (hosted checkout).       */
/*  Server only. Configured by SUMUP_API_KEY + SUMUP_MERCHANT_CODE; without    */
/*  them the app keeps using Stripe.                                          */
/*  Docs: https://developer.sumup.com/online-payments/checkouts/hosted-checkout */
/* ────────────────────────────────────────────────────────────────────────── */

// SUMUP_API_BASE only points local end-to-end tests at a fake SumUp; production uses the real one.
const API = process.env.SUMUP_API_BASE || "https://api.sumup.com/v0.1"

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
  if (res.status === 204) return undefined as T
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

/** Close an open checkout so it can no longer take money. */
export async function deactivateCheckout(id: string): Promise<void> {
  await call(`/checkouts/${encodeURIComponent(id)}`, { method: "DELETE" })
}

/** Refund a paid transaction, in full unless an amount is given. */
export async function refundTransaction(transactionId: string, amountCents?: number): Promise<void> {
  await call(`/me/refund/${encodeURIComponent(transactionId)}`, {
    method: "POST",
    body: JSON.stringify(amountCents ? { amount: amountCents / 100 } : {}),
  })
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

/**
 * Admin check (/admin/sistema): the key works, belongs to SUMUP_MERCHANT_CODE,
 * and online payments are on. Creates a 1 € checkout and deactivates it at
 * once: nothing is charged.
 */
export async function sumupHealth(): Promise<string> {
  if (!sumupConfigured()) return "Non configurato: su Vercel mancano SUMUP_API_KEY e/o SUMUP_MERCHANT_CODE (Production), poi serve un nuovo deploy."
  let profile: { merchant_profile?: { merchant_code?: string; company_name?: string } }
  try {
    profile = await call("/me")
  } catch (e) {
    const m = e instanceof Error ? e.message : ""
    return m.includes("401") ? "Chiave API non valida: ricopiala dalla dashboard SumUp (Impostazioni → Sviluppatori)." : `SumUp non risponde: ${m.slice(0, 160)}`
  }
  const code = profile.merchant_profile?.merchant_code
  if (code && code !== process.env.SUMUP_MERCHANT_CODE) {
    return `La chiave è del conto ${code}, ma SUMUP_MERCHANT_CODE è ${process.env.SUMUP_MERCHANT_CODE}: correggi uno dei due.`
  }
  try {
    const c = await call<SumUpCheckout>("/checkouts", {
      method: "POST",
      body: JSON.stringify({
        checkout_reference: `healthcheck_${Date.now()}`,
        amount: 1,
        currency: "EUR",
        merchant_code: process.env.SUMUP_MERCHANT_CODE,
        description: "Prova SANDER (non viene addebitata)",
      }),
    })
    await call(`/checkouts/${encodeURIComponent(c.id)}`, { method: "DELETE" }).catch(() => {})
  } catch (e) {
    const m = e instanceof Error ? e.message : ""
    return m.includes("403") || m.toLowerCase().includes("scope")
      ? "Chiave valida, ma i pagamenti online non sono attivi sul conto: chiedi a SumUp di attivarli (Online Payments / Checkouts)."
      : `Chiave valida, ma la prova di pagamento non è riuscita: ${m.slice(0, 160)}`
  }
  const name = profile.merchant_profile?.company_name
  return `Tutto a posto: conto ${code ?? process.env.SUMUP_MERCHANT_CODE}${name ? ` (${name})` : ""}, pagamenti online attivi. Gli acquisti di SC e SANDER+ dal sito passano da SumUp.`
}
