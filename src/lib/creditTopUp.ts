import { db } from "@/lib/db"
import { getCreditPack } from "@/lib/pricing"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Credit a Stripe top-up — INTERNAL only (called from the Stripe webhook).   */
/*                                                                             */
/*  Not a "use server" file: every export there is a public endpoint, and this */
/*  one hands out SanderCredits.                                               */
/*                                                                             */
/*  Idempotent: the ledger row's unique stripeSessionId means a replayed or    */
/*  duplicated webhook credits once. The amount credited comes from the pack   */
/*  table on the server, never from metadata a client could have shaped.       */
/* ────────────────────────────────────────────────────────────────────────── */

const P2002 = "P2002"

export type GrantResult = "credited" | "already_credited" | "invalid"

export async function grantStripeTopUp(input: {
  stripeSessionId: string
  playerId: string
  packId: string
  amountCents: number | null
}): Promise<GrantResult> {
  const pack = getCreditPack(input.packId)
  if (!pack || !input.playerId) return "invalid"

  try {
    await db.$transaction(async (tx) => {
      await tx.creditTopUp.create({
        data: {
          playerId: input.playerId,
          credits: pack.credits,
          amountCents: input.amountCents ?? pack.priceCents,
          method: "STRIPE",
          stripeSessionId: input.stripeSessionId,
          note: `Pacchetto ${pack.id}`,
        },
      })
      await tx.player.update({
        where: { id: input.playerId },
        data: { sanderCredits: { increment: pack.credits } },
      })
    })
    return "credited"
  } catch (err) {
    if (typeof err === "object" && err !== null && "code" in err && (err as { code: unknown }).code === P2002) {
      return "already_credited"
    }
    throw err
  }
}

/**
 * Take back the credits of a refunded or disputed Stripe top-up. Idempotent
 * through the conditional claim on refundedAt. The whole pack is taken back:
 * if some credits were already spent the balance goes negative, which blocks
 * any further spending until it is topped up again (otherwise a refund or a
 * chargeback would let someone keep what they bought for free).
 */
export async function revokeStripeTopUp(stripeSessionId: string): Promise<"revoked" | "not_found" | "already_revoked"> {
  return db.$transaction(async (tx) => {
    const topUp = await tx.creditTopUp.findUnique({
      where: { stripeSessionId },
      select: { id: true, playerId: true, credits: true, refundedAt: true },
    })
    if (!topUp) return "not_found"
    const claimed = await tx.creditTopUp.updateMany({
      where: { id: topUp.id, refundedAt: null },
      data: { refundedAt: new Date() },
    })
    if (claimed.count === 0) return "already_revoked"
    await tx.player.update({ where: { id: topUp.playerId }, data: { sanderCredits: { decrement: topUp.credits } } })
    return "revoked"
  })
}
