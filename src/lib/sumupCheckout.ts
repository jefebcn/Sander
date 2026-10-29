import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCreditPack, PLUS_PASS_MONTH } from "@/lib/pricing"
import { extendPass, isPlus } from "@/lib/scopri/rules"
import { createHostedCheckout, getCheckout, isPaidAsExpected } from "@/lib/sumup"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Card purchases through SumUp: SanderCredits packs and the 30-day SANDER+   */
/*  pass. INTERNAL only (not a "use server" file): the actions call it, the    */
/*  webhook and the return pages settle with it. The amount always comes from  */
/*  the server-side price table, and only SumUp's own reading of the checkout  */
/*  can grant anything.                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

export type SumUpKind = "sc_topup" | "plus_pass"

function appUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL
  if (!url) throw new Error("NEXT_PUBLIC_APP_URL non configurato")
  return url.replace(/\/$/, "")
}

export async function startSumUpCheckout(input: { kind: SumUpKind; playerId: string; packId?: string }): Promise<string> {
  let amountCents: number
  let description: string
  let back: string
  if (input.kind === "sc_topup") {
    const pack = input.packId ? getCreditPack(input.packId) : null
    if (!pack) throw new Error("Pacchetto non valido")
    amountCents = pack.priceCents
    description = `${pack.credits} SanderCredits`
    back = "/profile"
  } else {
    const profile = await db.discoverProfile.findUnique({ where: { playerId: input.playerId }, select: { plusUntil: true } })
    if (isPlus(profile?.plusUntil)) throw new Error("Hai già l'abbonamento SANDER+ attivo")
    amountCents = PLUS_PASS_MONTH.priceCents
    description = `SANDER+ ${PLUS_PASS_MONTH.days} giorni`
    back = "/scopri/plus"
  }

  const reference = `${input.kind}_${randomUUID()}`
  const site = appUrl()
  const checkout = await createHostedCheckout({
    reference,
    amountCents,
    description,
    redirectUrl: `${site}${back}?pagamento=${encodeURIComponent(reference)}`,
    returnUrl: `${site}/api/webhooks/sumup`,
  })
  await db.paymentCheckout.create({
    data: { id: checkout.id, reference, kind: input.kind, playerId: input.playerId, packId: input.packId ?? null, amountCents },
  })
  return checkout.url
}

export type SettleResult = "fulfilled" | "already" | "pending" | "failed" | "unknown"

/**
 * Ask SumUp how the checkout went and, if it is paid as expected, grant the
 * purchase. The claim on fulfilledAt and the grant share one transaction:
 * the webhook, the return page and a retry can all call this, it counts once.
 */
export async function settleSumUpCheckout(checkoutId: string): Promise<SettleResult> {
  const row = await db.paymentCheckout.findUnique({ where: { id: checkoutId } })
  if (!row) return "unknown"
  if (row.fulfilledAt) return "already"

  const remote = await getCheckout(checkoutId)
  if (remote.status === "FAILED" || remote.status === "EXPIRED") {
    await db.paymentCheckout.updateMany({ where: { id: row.id, fulfilledAt: null }, data: { status: remote.status } })
    return "failed"
  }
  if (!isPaidAsExpected(remote, row)) return "pending"

  const transactionId = remote.transactions?.find((t) => t.status === "SUCCESSFUL")?.id ?? remote.transactions?.[0]?.id ?? null
  const done = await db.$transaction(async (tx) => {
    const claimed = await tx.paymentCheckout.updateMany({
      where: { id: row.id, fulfilledAt: null },
      data: { fulfilledAt: new Date(), status: "PAID", transactionId },
    })
    if (claimed.count === 0) return false

    if (row.kind === "sc_topup") {
      const pack = row.packId ? getCreditPack(row.packId) : null
      if (!pack) throw new Error(`SumUp checkout ${row.id}: unknown pack ${row.packId}`)
      await tx.creditTopUp.create({
        data: {
          playerId: row.playerId,
          credits: pack.credits,
          amountCents: row.amountCents,
          method: "SUMUP",
          // Unique ledger key, shared with Stripe top-ups: one row per payment.
          stripeSessionId: `sumup:${row.id}`,
          note: `Pacchetto ${pack.id}`,
        },
      })
      await tx.player.update({ where: { id: row.playerId }, data: { sanderCredits: { increment: pack.credits } } })
    } else {
      const now = new Date()
      const profile = await tx.discoverProfile.upsert({
        where: { playerId: row.playerId },
        create: { playerId: row.playerId },
        update: {},
        select: { plusPassUntil: true },
      })
      await tx.discoverProfile.update({
        where: { playerId: row.playerId },
        data: { plusPassUntil: extendPass(profile.plusPassUntil, now, PLUS_PASS_MONTH.days) },
      })
    }
    return true
  })
  if (!done) return "already"
  revalidatePath("/profile")
  revalidatePath("/scopri")
  revalidatePath("/scopri/plus")
  return "fulfilled"
}

/** The return page: settle the player's own checkout by our reference. */
export async function settleByReference(reference: string, playerId: string): Promise<SettleResult> {
  const row = await db.paymentCheckout.findUnique({ where: { reference }, select: { id: true, playerId: true } })
  if (!row || row.playerId !== playerId) return "unknown"
  return settleSumUpCheckout(row.id)
}
