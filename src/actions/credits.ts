"use server"

import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { stripe, getAppUrl } from "@/lib/stripe"
import { getCreditPack } from "@/lib/pricing"
import { StartCreditCheckoutSchema } from "@/lib/validators/credits.schema"

/**
 * Start a Stripe Checkout for a SanderCredits pack.
 * Nothing is credited here: the webhook does it once Stripe confirms the
 * payment (lib/creditTopUp.ts), so closing the tab mid-payment can't leave
 * credits without money or money without credits.
 */
export async function startCreditCheckout(
  input: unknown,
): Promise<{ ok: true; redirectUrl: string } | { ok: false; error: string }> {
  const { packId } = StartCreditCheckoutSchema.parse(input)
  const pack = getCreditPack(packId)
  if (!pack) return { ok: false, error: "Pacchetto non valido" }

  const player = await getCurrentPlayer()
  if (!player) return { ok: false, error: "Accedi per ricaricare" }

  try {
    const appUrl = getAppUrl()
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "eur",
            unit_amount: pack.priceCents,
            product_data: { name: `${pack.credits} SanderCredits` },
          },
          quantity: 1,
        },
      ],
      metadata: { kind: "sc_topup", playerId: player.id, packId: pack.id },
      client_reference_id: player.id,
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      success_url: `${appUrl}/profile?topup=ok`,
      cancel_url: `${appUrl}/profile?topup=annullata`,
    })
    if (!session.url) return { ok: false, error: "Pagamento non disponibile, riprova" }
    return { ok: true, redirectUrl: session.url }
  } catch (err) {
    console.error("[credits] checkout failed", err)
    return { ok: false, error: "Pagamento non disponibile in questo momento" }
  }
}
