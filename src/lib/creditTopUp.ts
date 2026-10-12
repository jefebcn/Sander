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
