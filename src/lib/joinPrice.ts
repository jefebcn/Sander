/* ────────────────────────────────────────────────────────────────────────── */
/*  What taking a seat costs, said the way the match list says it.            */
/*                                                                             */
/*  Pure. The home shows the price on every open match, and offers the         */
/*  one-tap "Entra" unless the seat is paid in credits inside the app (the     */
/*  balance has to be checked on the match page): the server refuses a        */
/*  one-tap join on those too, so both read one rule.                          */
/* ────────────────────────────────────────────────────────────────────────── */

export interface JoinCostInput {
  paymentType: string
  /** Credits for "SC", euro cents per person for "QUOTA". */
  quotaAmount: number | null
  /** Total court cost in euro cents, split between the seats. */
  courtCost: number | null
  maxPlayers: number
}

/** Credits a seat takes from the balance on join; 0 when nothing is charged in the app. */
export function creditCost(s: JoinCostInput): number {
  return s.paymentType === "SC" ? Math.max(0, s.quotaAmount ?? 0) : 0
}

/**
 * "4 crediti", "5,00 € a testa", "6 € a testa per il campo" — or null when a
 * seat costs nothing up front (free, or "chi perde paga", settled on the sand).
 */
export function joinPrice(s: JoinCostInput): string | null {
  const credits = creditCost(s)
  if (credits > 0) return `${credits} ${credits === 1 ? "credito" : "crediti"}`
  if (s.paymentType === "QUOTA" && (s.quotaAmount ?? 0) > 0) {
    return `${((s.quotaAmount ?? 0) / 100).toFixed(2).replace(".", ",")} € a testa`
  }
  if (s.courtCost && s.courtCost > 0 && s.maxPlayers > 0) {
    return `${Math.ceil(s.courtCost / s.maxPlayers / 100)} € a testa per il campo`
  }
  return null
}
