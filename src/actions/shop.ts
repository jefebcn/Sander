"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { db } from "@/lib/db"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { notifyPlayer } from "@/lib/push"
import { nextAdminStatuses, slugify, type ShopOrderStatus } from "@/lib/shop"
import { cancelAndRestock, placeShopOrder, refundShopOrder } from "@/lib/shopOrders"
import { ShopCheckoutSchema, ShopOrderStatusSchema, ShopProductSchema } from "@/lib/validators/shop.schema"

type Result = { ok: true; message: string } | { ok: false; error: string }

function firstIssue(e: unknown): string {
  if (e instanceof z.ZodError) return e.issues[0]?.message ?? "Dati non validi"
  return e instanceof Error ? e.message : "Errore"
}

async function isAdmin() {
  const session = await getCurrentSession()
  return isAdminEmail(session?.user?.email)
}

function revalidateShop() {
  revalidatePath("/shop")
  revalidatePath("/admin/shop")
  revalidatePath("/")
  revalidatePath("/profile")
}

/* ── Buyer ─────────────────────────────────────────────────────────────── */

/** Place the order and hand back SumUp's page. */
export async function startShopCheckout(input: unknown): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const data = ShopCheckoutSchema.parse(input)
    const me = await getCurrentPlayer()
    if (!me) return { ok: false, error: "Accedi per comprare" }
    const res = await placeShopOrder(me.id, data)
    if (!res.ok) return res
    revalidatePath("/shop")
    return { ok: true, url: res.url }
  } catch (e) {
    return { ok: false, error: firstIssue(e) }
  }
}

/* ── Admin: products ───────────────────────────────────────────────────── */

export async function adminSaveShopProduct(input: unknown): Promise<Result & { id?: string }> {
  try {
    if (!(await isAdmin())) return { ok: false, error: "Non autorizzato" }
    const p = ShopProductSchema.parse(input)
    const labels = p.variants.map((v) => v.label.toLowerCase())
    if (new Set(labels).size !== labels.length) return { ok: false, error: "Due taglie hanno lo stesso nome" }

    const fields = {
      name: p.name,
      description: p.description,
      category: p.category,
      priceCents: p.priceCents,
      images: p.images,
      active: p.active,
      featured: p.featured,
      sortOrder: p.sortOrder,
    }

    const id = await db.$transaction(async (tx) => {
      let productId = p.id
      if (productId) {
        await tx.shopProduct.update({ where: { id: productId }, data: fields })
      } else {
        // A free slug: the name, then -2, -3… if already taken.
        const base = slugify(p.name)
        let slug = base
        for (let n = 2; await tx.shopProduct.findUnique({ where: { slug }, select: { id: true } }); n++) slug = `${base}-${n}`
        productId = (await tx.shopProduct.create({ data: { ...fields, slug }, select: { id: true } })).id
      }
      // Sizes: update the kept ones, add the new ones, drop the removed ones
      // (orders keep their own copy of the size, so nothing breaks).
      const keep = p.variants.filter((v) => v.id).map((v) => v.id as string)
      await tx.shopVariant.deleteMany({ where: { productId, id: { notIn: keep } } })
      for (const [i, v] of p.variants.entries()) {
        if (v.id) await tx.shopVariant.updateMany({ where: { id: v.id, productId }, data: { label: v.label, stock: v.stock, sortOrder: i } })
        else await tx.shopVariant.create({ data: { productId, label: v.label, stock: v.stock, sortOrder: i } })
      }
      return productId
    })
    revalidateShop()
    return { ok: true, message: "Prodotto salvato", id }
  } catch (e) {
    return { ok: false, error: firstIssue(e) }
  }
}

const ToggleSchema = z.object({ productId: z.string().trim().min(1).max(64), field: z.enum(["active", "featured"]), value: z.boolean() })

export async function adminToggleShopProduct(input: unknown): Promise<Result> {
  try {
    if (!(await isAdmin())) return { ok: false, error: "Non autorizzato" }
    const { productId, field, value } = ToggleSchema.parse(input)
    await db.shopProduct.update({ where: { id: productId }, data: { [field]: value } })
    revalidateShop()
    const msg = field === "active" ? (value ? "Ora è in vendita" : "Nascosto dallo shop") : value ? "In evidenza in home" : "Tolto dalla home"
    return { ok: true, message: msg }
  } catch (e) {
    return { ok: false, error: firstIssue(e) }
  }
}

export async function adminDeleteShopProduct(input: unknown): Promise<Result> {
  try {
    if (!(await isAdmin())) return { ok: false, error: "Non autorizzato" }
    const productId = z.string().trim().min(1).max(64).parse(input)
    const open = await db.shopOrderItem.count({ where: { productId, order: { status: { in: ["PENDING", "PAID", "READY"] } } } })
    if (open > 0) return { ok: false, error: "Ha ordini da consegnare: nascondilo invece di eliminarlo" }
    await db.shopProduct.delete({ where: { id: productId } })
    revalidateShop()
    return { ok: true, message: "Prodotto eliminato" }
  } catch (e) {
    return { ok: false, error: firstIssue(e) }
  }
}

/* ── Admin: orders ─────────────────────────────────────────────────────── */

/** Move a paid order along; cancelling refunds the card and restocks. */
export async function adminSetShopOrderStatus(input: unknown): Promise<Result> {
  try {
    if (!(await isAdmin())) return { ok: false, error: "Non autorizzato" }
    const { orderId, status } = ShopOrderStatusSchema.parse(input)
    const order = await db.shopOrder.findUnique({ where: { id: orderId }, select: { id: true, number: true, status: true, playerId: true, delivery: true } })
    if (!order) return { ok: false, error: "Ordine non trovato" }
    if (!nextAdminStatuses(order.status as ShopOrderStatus).includes(status)) return { ok: false, error: "Passaggio non consentito" }

    if (status === "CANCELLED") {
      let refunded = false
      try {
        refunded = await refundShopOrder(order.id)
      } catch (e) {
        console.error("[shop] refund failed", order.id, e)
        return { ok: false, error: "Rimborso non riuscito: riprova o rimborsa dalla dashboard SumUp" }
      }
      await cancelAndRestock(order.id, ["PAID", "READY"])
      await notifyPlayer(order.playerId, {
        title: `Ordine #${order.number} annullato`,
        body: refunded ? "Ti abbiamo rimborsato sulla carta: arriva in pochi giorni." : "Scrivici se hai domande sul rimborso.",
        url: `/shop/ordini/${order.id}`,
      }).catch(() => {})
      revalidatePath("/admin/shop/ordini")
      return { ok: true, message: refunded ? "Annullato e rimborsato" : "Annullato (rimborso da fare a mano)" }
    }

    const now = new Date()
    await db.shopOrder.update({
      where: { id: order.id },
      data: {
        status,
        ...(status === "READY" ? { readyAt: now } : {}),
        ...(status === "DELIVERED" ? { deliveredAt: now } : {}),
      },
    })
    if (status === "READY") {
      await notifyPlayer(order.playerId, {
        title: `Il tuo ordine #${order.number} è pronto`,
        body: order.delivery === "SHIP" ? "Sta per partire: ti scriviamo con la spedizione." : "Ritiralo al prossimo torneo: mostra il codice dell'ordine.",
        url: `/shop/ordini/${order.id}`,
      }).catch(() => {})
    }
    revalidatePath("/admin/shop/ordini")
    revalidatePath(`/shop/ordini/${order.id}`)
    return { ok: true, message: status === "READY" ? "Segnato come pronto: avvisato il cliente" : status === "DELIVERED" ? "Consegnato" : "Aggiornato" }
  } catch (e) {
    return { ok: false, error: firstIssue(e) }
  }
}
