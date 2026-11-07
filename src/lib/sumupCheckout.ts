import { randomUUID } from "crypto"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getCreditPack, PLUS_PASS_MONTH } from "@/lib/pricing"
import { extendPass, isPlus } from "@/lib/scopri/rules"
import { createHostedCheckout, deactivateCheckout, getCheckout, isPaidAsExpected, refundTransaction } from "@/lib/sumup"
import { notifyAdmins } from "@/lib/adminNotify"
import { notifyPlayer } from "@/lib/push"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Card purchases through SumUp: SanderCredits packs and the 30-day SANDER+   */
/*  pass. INTERNAL only (not a "use server" file): the actions call it, the    */
/*  webhook and the return pages settle with it. The amount always comes from  */
/*  the server-side price table, and only SumUp's own reading of the checkout  */
/*  can grant anything.                                                        */
/* ────────────────────────────────────────────────────────────────────────── */

export type SumUpKind = "sc_topup" | "plus_pass" | "tournament_reg"

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

  let orphanPayment = false
  const transactionId = remote.transactions?.find((t) => t.status === "SUCCESSFUL")?.id ?? remote.transactions?.[0]?.id ?? null
  const done = await db.$transaction(async (tx) => {
    const claimed = await tx.paymentCheckout.updateMany({
      where: { id: row.id, fulfilledAt: null },
      data: { fulfilledAt: new Date(), status: "PAID", transactionId },
    })
    if (claimed.count === 0) return false

    if (row.kind === "tournament_reg") {
      // The seat was held by the PENDING row; paying makes it a sign-up.
      const paid = await tx.tournamentRegistration.updateMany({
        where: { id: row.registrationId ?? "", paymentStatus: "PENDING" },
        data: { paymentStatus: "PAID", paymentMethod: "SUMUP", paidAt: new Date(), amountPaidCents: row.amountCents },
      })
      if (paid.count === 0) orphanPayment = true
    } else if (row.kind === "sc_topup") {
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
  if (row.kind === "tournament_reg") {
    const reg = row.registrationId
      ? await db.tournamentRegistration.findUnique({ where: { id: row.registrationId }, select: { tournamentId: true, paymentStatus: true, tournament: { select: { name: true } } } })
      : null
    if (orphanPayment && reg?.paymentStatus !== "PAID") {
      // Paid after the sign-up was gone (cancelled, expired): someone must refund it.
      await notifyAdmins({ title: "Pagamento SumUp senza iscrizione", body: `${(row.amountCents / 100).toFixed(2)} € (checkout ${row.id}): rimborsalo dalla dashboard SumUp.`, url: "/admin/payments" })
      return "fulfilled"
    }
    if (reg) {
      await notifyPlayer(row.playerId, { title: "🏐 Iscrizione confermata!", body: `Pagamento ricevuto: sei iscritto a ${reg.tournament.name}.`, url: `/tournaments/${reg.tournamentId}` }).catch(() => {})
      revalidatePath("/tournaments")
      revalidatePath(`/tournaments/${reg.tournamentId}`)
    }
    return "fulfilled"
  }
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


/* ── Tournament sign-ups paid by card ───────────────────────────────────── */

/** A hosted checkout for a PENDING registration; the row keeps the seat meanwhile. */
export async function startSumUpRegistrationCheckout(input: {
  registrationId: string
  playerId: string
  tournamentId: string
  tournamentName: string
  amountCents: number
}): Promise<string> {
  const reference = `tournament_reg_${randomUUID()}`
  const site = appUrl()
  const checkout = await createHostedCheckout({
    reference,
    amountCents: input.amountCents,
    description: `Iscrizione torneo: ${input.tournamentName}`.slice(0, 100),
    redirectUrl: `${site}/tournaments/${input.tournamentId}/register/success?pagamento=${encodeURIComponent(reference)}`,
    returnUrl: `${site}/api/webhooks/sumup`,
  })
  await db.paymentCheckout.create({
    data: { id: checkout.id, reference, kind: "tournament_reg", playerId: input.playerId, registrationId: input.registrationId, amountCents: input.amountCents, url: checkout.url },
  })
  await db.tournamentRegistration.update({ where: { id: input.registrationId }, data: { sumupCheckoutId: checkout.id } })
  return checkout.url
}

/** SumUp's page is valid 30 minutes: reuse it while it can still be paid. */
const CHECKOUT_REUSE_MS = 25 * 60_000

export type CheckoutState = { state: "open"; url: string } | { state: "paid" } | { state: "closed" } | { state: "unknown" }

/** Where a registration's checkout stands; a paid one is settled on the way. */
export async function resolveSumUpCheckout(checkoutId: string): Promise<CheckoutState> {
  try {
    const [row, remote] = await Promise.all([db.paymentCheckout.findUnique({ where: { id: checkoutId } }), getCheckout(checkoutId)])
    if (remote.status === "PAID") {
      await settleSumUpCheckout(checkoutId)
      return { state: "paid" }
    }
    if (remote.status === "PENDING" && row?.url && Date.now() - row.createdAt.getTime() < CHECKOUT_REUSE_MS) return { state: "open", url: row.url }
    if (remote.status === "PENDING") return { state: "unknown" } // still open but too old to hand out: close it first
    return { state: "closed" }
  } catch (e) {
    console.error("[sumup] cannot read checkout", checkoutId, e)
    return { state: "unknown" }
  }
}

/**
 * Make sure a checkout can no longer take money: deactivate it if open.
 * "paid": it was paid (and is now settled); "closed": safe to drop the row;
 * "unknown": SumUp unreachable, touch nothing.
 */
export async function closeSumUpCheckout(checkoutId: string): Promise<"paid" | "closed" | "unknown"> {
  try {
    let remote = await getCheckout(checkoutId)
    if (remote.status === "PENDING") {
      await deactivateCheckout(checkoutId).catch(() => {})
      remote = await getCheckout(checkoutId)
    }
    if (remote.status === "PAID") {
      await settleSumUpCheckout(checkoutId)
      return "paid"
    }
    if (remote.status === "PENDING") return "unknown"
    await db.paymentCheckout.updateMany({ where: { id: checkoutId, fulfilledAt: null }, data: { status: remote.status } })
    return "closed"
  } catch (e) {
    console.error("[sumup] cannot close checkout", checkoutId, e)
    return "unknown"
  }
}

/** Give back a registration's card payment, once. Returns true when a refund went out. */
export async function refundSumUpRegistration(registrationId: string): Promise<boolean> {
  const row = await db.paymentCheckout.findFirst({
    where: { registrationId, kind: "tournament_reg", fulfilledAt: { not: null }, status: "PAID" },
    orderBy: { createdAt: "desc" },
  })
  if (!row?.transactionId) return false
  // Claim first: a retried action refunds once, never twice.
  const claimed = await db.paymentCheckout.updateMany({ where: { id: row.id, status: "PAID" }, data: { status: "REFUNDING" } })
  if (claimed.count === 0) return false
  try {
    await refundTransaction(row.transactionId)
  } catch (e) {
    await db.paymentCheckout.update({ where: { id: row.id }, data: { status: "PAID" } })
    throw e
  }
  await db.paymentCheckout.update({ where: { id: row.id }, data: { status: "REFUNDED" } })
  return true
}
