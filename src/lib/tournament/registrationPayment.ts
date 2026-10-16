/**
 * Pure helpers for tournament registration payments (no DB / Stripe imports).
 */

export type CheckoutSessionState = "open" | "paid" | "closed"

/**
 * Classify a Stripe Checkout Session.
 *  - "paid":   the customer completed payment (the webhook may not have arrived
 *              yet) — the registration must be treated as PAID, never recreated.
 *  - "open":   still payable at `url`.
 *  - "closed": expired, or complete without payment — safe to replace.
 */
export function classifyCheckoutSession(session: {
  status: string | null
  payment_status: string | null
  url?: string | null
}): CheckoutSessionState {
  if (session.payment_status === "paid" || session.payment_status === "no_payment_required") {
    return "paid"
  }
  if (session.status === "open" && session.url) return "open"
  return "closed"
}

export type RegistrationUiStatus =
  | "NOT_REGISTERED"
  | "PAID"
  | "PENDING_STRIPE"
  | "PENDING_CASH"
  | "PENDING_PAYPAL"
  | "REGISTERED_UNPAID"

/** Map a (non-spectator) registration row to the CTA state shown to its owner. */
export function deriveRegistrationStatus(
  reg: { paymentStatus: string; paymentMethod: string | null } | null | undefined,
): RegistrationUiStatus {
  if (!reg) return "NOT_REGISTERED"
  const { paymentStatus, paymentMethod } = reg
  if (paymentStatus === "PAID" || paymentStatus === "FREE") return "PAID"
  if (paymentStatus !== "PENDING") return "NOT_REGISTERED"
  if (paymentMethod === "STRIPE") return "PENDING_STRIPE"
  if (paymentMethod === "CASH") return "PENDING_CASH"
  if (paymentMethod === "PAYPAL") return "PENDING_PAYPAL"
  return "REGISTERED_UNPAID"
}

/** Shown to users instead of raw Stripe errors (which can leak config details). */
export const CARD_PAYMENT_UNAVAILABLE_MESSAGE =
  "Pagamento con carta non disponibile al momento. Riprova più tardi o scegli un altro metodo."
