"use server"

import { z } from "zod"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { sumupConfigured } from "@/lib/sumup"
import { settleByReference, startSumUpCheckout, type SettleResult } from "@/lib/sumupCheckout"

/* Card payments through SumUp: start a 30-day SANDER+ pass, confirm on return. */

/** SANDER+ for 30 days, paid by card, no automatic renewal. */
export async function startPlusPassCheckout(): Promise<{ url: string }> {
  const me = await getCurrentPlayer()
  if (!me) throw new Error("Non autenticato")
  if (!sumupConfigured()) throw new Error("Pagamenti non disponibili al momento")
  try {
    return { url: await startSumUpCheckout({ kind: "plus_pass", playerId: me.id }) }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Hai già")) throw e
    console.error("[payments] SumUp pass checkout failed", e)
    throw new Error("Pagamento non disponibile in questo momento")
  }
}

/**
 * Back from SumUp's page: settle the player's own checkout now, in case the
 * webhook hasn't arrived yet. Safe to repeat: it grants at most once.
 */
export async function confirmSumUpPayment(input: unknown): Promise<{ result: SettleResult }> {
  const reference = z.string().trim().min(1).max(100).parse(input)
  const me = await getCurrentPlayer()
  if (!me) throw new Error("Non autenticato")
  try {
    return { result: await settleByReference(reference, me.id) }
  } catch (e) {
    console.error("[payments] SumUp confirm failed", reference, e)
    return { result: "pending" }
  }
}
