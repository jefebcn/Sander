/* SanderCredits pricing (1 € = 10 SC). Shared by server actions and UI. */

/** Cost in SC to create a tournament (admins create for free). */
export const TOURNAMENT_CREATION_SC = 50

/** Euros → SanderCredits at the base rate. */
export const SC_PER_EURO = 10

export interface CreditPack {
  id: "small" | "medium" | "large"
  credits: number
  priceCents: number
}

/**
 * Packs sold through Stripe. Bigger packs carry a small bonus: it raises the
 * average top-up and makes the Stripe fixed fee (≈0.25 €) a smaller share.
 * Prices are a business decision — change them here, nowhere else.
 */
export const CREDIT_PACKS: CreditPack[] = [
  { id: "small", credits: 50, priceCents: 500 },
  { id: "medium", credits: 110, priceCents: 1000 },
  { id: "large", credits: 240, priceCents: 2000 },
]

export function getCreditPack(id: string): CreditPack | null {
  return CREDIT_PACKS.find((p) => p.id === id) ?? null
}

/** Extra credits over the base rate, in percent (0 for the base pack). */
export function packBonusPct(pack: CreditPack): number {
  const base = (pack.priceCents / 100) * SC_PER_EURO
  return Math.round(((pack.credits - base) / base) * 100)
}

/** SANDER+ monthly price (Stripe subscription, euro cents). */
export const PLUS_MONTHLY_CENTS = 499

/** SANDER+ paid by card through SumUp: 30 days, no automatic renewal. */
export const PLUS_PASS_MONTH = { days: 30, priceCents: PLUS_MONTHLY_CENTS } as const
