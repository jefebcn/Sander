import { randomUUID } from "crypto"
import { db } from "@/lib/db"
import { createHostedCheckout, refundTransaction } from "@/lib/sumup"
import { closeSumUpCheckout } from "@/lib/sumupCheckout"
import { isExpiredHold, orderTotals, SHOP_HOLD_MINUTES, type ShopDelivery } from "@/lib/shop"
import type { ShopCheckoutInput } from "@/lib/validators/shop.schema"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Shop orders. INTERNAL (not "use server"): actions, the SumUp settle step   */
/*  and the cron call it. Pieces are taken off stock when the order is placed  */
/*  and given back when an unpaid order expires or a paid one is cancelled.    */
/* ────────────────────────────────────────────────────────────────────────── */

function appUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL
  if (!url) throw new Error("NEXT_PUBLIC_APP_URL non configurato")
  return url.replace(/\/$/, "")
}

type Tx = Parameters<Parameters<typeof db.$transaction>[0]>[0]

/** Put an order's pieces back on sale. */
async function restock(tx: Tx, orderId: string) {
  const items = await tx.shopOrderItem.findMany({ where: { orderId }, select: { variantId: true, qty: true } })
  for (const it of items) {
    await tx.shopVariant.updateMany({ where: { id: it.variantId }, data: { stock: { increment: it.qty } } })
  }
}

/** Cancel an order and give its pieces back, once (only from the given statuses). */
export async function cancelAndRestock(orderId: string, from: string[]): Promise<boolean> {
  return db.$transaction(async (tx) => {
    const done = await tx.shopOrder.updateMany({
      where: { id: orderId, status: { in: from } },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    })
    if (done.count === 0) return false
    await restock(tx, orderId)
    return true
  })
}

/**
 * Unpaid orders past their hold go back on sale. The SumUp page is closed
 * first, so a late payment cannot land on a cancelled order; if it was paid
 * after all, closing it settles it instead.
 */
export async function releaseExpiredShopHolds(limit = 20): Promise<number> {
  const cutoff = new Date(Date.now() - SHOP_HOLD_MINUTES * 60_000)
  const stale = await db.shopOrder.findMany({
    where: { status: "PENDING", createdAt: { lt: cutoff } },
    select: { id: true, sumupCheckoutId: true },
    take: limit,
  })
  let freed = 0
  for (const o of stale) {
    if (o.sumupCheckoutId) {
      const state = await closeSumUpCheckout(o.sumupCheckoutId)
      if (state !== "closed") continue // paid (now settled) or SumUp unreachable: leave it
    }
    if (await cancelAndRestock(o.id, ["PENDING"])) freed++
  }
  return freed
}

export type PlaceResult = { ok: true; url: string; orderId: string } | { ok: false; error: string }

/** Take the pieces, write the order, open SumUp's page. */
export async function placeShopOrder(playerId: string, input: ShopCheckoutInput): Promise<PlaceResult> {
  await releaseExpiredShopHolds(5).catch(() => 0)

  const variant = await db.shopVariant.findUnique({
    where: { id: input.variantId },
    select: { id: true, label: true, product: { select: { id: true, name: true, priceCents: true, active: true } } },
  })
  if (!variant || !variant.product.active) return { ok: false, error: "Prodotto non disponibile" }

  const delivery = input.delivery as ShopDelivery
  const totals = orderTotals(variant.product.priceCents, input.qty, delivery)

  const order = await db.$transaction(async (tx) => {
    const taken = await tx.shopVariant.updateMany({
      where: { id: variant.id, stock: { gte: input.qty } },
      data: { stock: { decrement: input.qty } },
    })
    if (taken.count === 0) return null
    return tx.shopOrder.create({
      data: {
        playerId,
        delivery,
        ...(delivery === "SHIP"
          ? { shipName: input.shipName, shipAddress: input.shipAddress, shipCity: input.shipCity, shipZip: input.shipZip, shipPhone: input.shipPhone }
          : {}),
        ...totals,
        items: {
          create: {
            productId: variant.product.id,
            variantId: variant.id,
            name: variant.product.name,
            size: variant.label,
            qty: input.qty,
            unitCents: variant.product.priceCents,
          },
        },
      },
      select: { id: true, number: true },
    })
  })
  if (!order) return { ok: false, error: input.qty > 1 ? "Non ci sono abbastanza pezzi di questa taglia" : "Taglia esaurita" }

  try {
    const reference = `shop_order_${randomUUID()}`
    const site = appUrl()
    const checkout = await createHostedCheckout({
      reference,
      amountCents: totals.totalCents,
      description: `SANDER shop · ordine #${order.number}`,
      redirectUrl: `${site}/shop/ordini/${order.id}?pagamento=${encodeURIComponent(reference)}`,
      returnUrl: `${site}/api/webhooks/sumup`,
    })
    await db.paymentCheckout.create({
      data: { id: checkout.id, reference, kind: "shop_order", playerId, orderId: order.id, amountCents: totals.totalCents, url: checkout.url },
    })
    await db.shopOrder.update({ where: { id: order.id }, data: { sumupCheckoutId: checkout.id } })
    return { ok: true, url: checkout.url, orderId: order.id }
  } catch (e) {
    console.error("[shop] cannot open SumUp checkout", e)
    await cancelAndRestock(order.id, ["PENDING"])
    return { ok: false, error: "Pagamento non disponibile in questo momento, riprova tra poco" }
  }
}

/** Give back a paid order's card payment, once. True when a refund went out. */
export async function refundShopOrder(orderId: string): Promise<boolean> {
  const row = await db.paymentCheckout.findFirst({
    where: { orderId, kind: "shop_order", fulfilledAt: { not: null }, status: "PAID" },
    orderBy: { createdAt: "desc" },
  })
  if (!row?.transactionId) return false
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

/** Whether the shop has anything on sale (drives every entry point). */
export async function shopIsOpen(): Promise<boolean> {
  return (await db.shopProduct.count({ where: { active: true } })) > 0
}

export { isExpiredHold }
