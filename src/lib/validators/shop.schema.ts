import { z } from "zod"
import { SHOP_MAX_QTY } from "@/lib/shop"

const Id = z.string().trim().min(1).max(64)
const Text = (max: number) => z.string().trim().max(max)

/** Buyer side: one product, one size, pickup or shipping. */
export const ShopCheckoutSchema = z
  .object({
    variantId: Id,
    qty: z.number().int().min(1).max(SHOP_MAX_QTY),
    delivery: z.enum(["PICKUP", "SHIP"]),
    shipName: Text(80).optional(),
    shipAddress: Text(160).optional(),
    shipCity: Text(80).optional(),
    shipZip: Text(10).optional(),
    shipPhone: Text(30).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.delivery !== "SHIP") return
    const need: [keyof typeof v, string][] = [
      ["shipName", "Nome e cognome"],
      ["shipAddress", "Indirizzo"],
      ["shipCity", "Città"],
      ["shipZip", "CAP"],
      ["shipPhone", "Telefono"],
    ]
    for (const [k, label] of need) {
      if (!v[k] || String(v[k]).length < 2) ctx.addIssue({ code: "custom", path: [k], message: `${label}: campo obbligatorio per la spedizione` })
    }
    if (v.shipZip && !/^\d{5}$/.test(v.shipZip)) ctx.addIssue({ code: "custom", path: ["shipZip"], message: "CAP: 5 cifre" })
  })
export type ShopCheckoutInput = z.infer<typeof ShopCheckoutSchema>

const ImageUrl = z.string().trim().url().max(500).refine((u) => /^https:\/\//.test(u), "Solo indirizzi https")

/** Admin side: create or edit a product with its sizes. */
export const ShopProductSchema = z.object({
  id: Id.optional(),
  name: Text(80).min(2, "Nome troppo corto"),
  description: Text(1000).default(""),
  category: z.enum(["MAGLIE", "ACCESSORI"]),
  priceCents: z.number().int().min(50, "Prezzo minimo 0,50 €").max(100_000),
  images: z.array(ImageUrl).max(6).default([]),
  active: z.boolean(),
  featured: z.boolean(),
  sortOrder: z.number().int().min(0).max(999).default(0),
  variants: z
    .array(
      z.object({
        id: Id.optional(),
        label: Text(20).min(1, "Taglia senza nome"),
        stock: z.number().int().min(0).max(10_000),
      }),
    )
    .min(1, "Serve almeno una taglia (anche «Taglia unica»)")
    // Colours × sizes ("Nero · M"): 4 colours of 6 sizes still fit.
    .max(40),
})
export type ShopProductInput = z.infer<typeof ShopProductSchema>

export const ShopOrderStatusSchema = z.object({
  orderId: Id,
  status: z.enum(["PAID", "READY", "DELIVERED", "CANCELLED"]),
})
