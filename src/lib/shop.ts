/* ────────────────────────────────────────────────────────────────────────── */
/*  Shop rules: pure functions, no DB. Shared by server actions, pages, UI.   */
/*  Prices are a business decision: change them here, nowhere else.           */
/* ────────────────────────────────────────────────────────────────────────── */

/** Flat shipping fee in Italy, euro cents. Pickup at a tournament is free. */
export const SHOP_SHIPPING_CENTS = 200

/** Most pieces of one product in a single order. */
export const SHOP_MAX_QTY = 5

/** An unpaid order holds its pieces this long, then they go back on sale. */
export const SHOP_HOLD_MINUTES = 35

/** "Ultimi N pezzi" shows from this stock down. */
export const SHOP_LOW_STOCK = 3

export const SHOP_CATEGORIES = [
  { id: "MAGLIE", label: "Maglie" },
  { id: "ACCESSORI", label: "Accessori" },
] as const
export type ShopCategory = (typeof SHOP_CATEGORIES)[number]["id"]

export const SIZE_PRESETS = {
  shirts: ["XS", "S", "M", "L", "XL", "XXL"],
  oneSize: ["Taglia unica"],
} as const

export type ShopDelivery = "PICKUP" | "SHIP"
export type ShopOrderStatus = "PENDING" | "PAID" | "READY" | "DELIVERED" | "CANCELLED"

/** "25 €", "22,50 €". */
export function euro(cents: number): string {
  const whole = cents % 100 === 0
  return `${(cents / 100).toLocaleString("it-IT", { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 })} €`
}

export function shippingCents(delivery: ShopDelivery): number {
  return delivery === "SHIP" ? SHOP_SHIPPING_CENTS : 0
}

export function orderTotals(unitCents: number, qty: number, delivery: ShopDelivery) {
  const items = unitCents * qty
  const shipping = shippingCents(delivery)
  return { itemsCents: items, shippingCents: shipping, totalCents: items + shipping }
}

/** Badge for a size or a product: null when there is nothing worth saying. */
export function stockLabel(stock: number): string | null {
  if (stock <= 0) return "Esaurita"
  if (stock <= SHOP_LOW_STOCK) return stock === 1 ? "Ultimo pezzo" : `Ultimi ${stock}`
  return null
}

/** URL-safe slug from a product name: "Maglia ufficiale SANDER" → "maglia-ufficiale-sander". */
export function slugify(name: string): string {
  return (
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "prodotto"
  )
}

/* ── Colours ──────────────────────────────────────────────────────────────
   A product in several colours keeps one variant per colour and size, named
   "Nero · M": orders, stock, the admin form and the CSV need nothing else.
   The first colour is the default one (its photos are the product's cover). */

export const COLOR_SEP = " · "

export interface ColorSize {
  id: string
  size: string
  stock: number
}
export interface ColorOption {
  name: string
  sizes: ColorSize[]
}

/** Variants named "Colore · Taglia", grouped by colour in variant order; null when the product has one colour. */
export function colorOptions(variants: { id: string; label: string; stock: number }[]): ColorOption[] | null {
  if (variants.length === 0 || !variants.every((v) => v.label.includes(COLOR_SEP))) return null
  const out: ColorOption[] = []
  for (const v of variants) {
    const at = v.label.indexOf(COLOR_SEP)
    const name = v.label.slice(0, at).trim()
    const size = v.label.slice(at + COLOR_SEP.length).trim()
    if (!name || !size) return null
    let c = out.find((o) => o.name === name)
    if (!c) out.push((c = { name, sizes: [] }))
    c.sizes.push({ id: v.id, size, stock: v.stock })
  }
  return out.length > 1 ? out : null
}

/** Photos of one colour (JSON column { "Nero": [...] }), or the product's own photos. */
export function colorPhotos(raw: unknown, color: string | null, fallback: string[]): string[] {
  if (!color || !raw || typeof raw !== "object" || Array.isArray(raw)) return fallback
  const list = productImages((raw as Record<string, unknown>)[color])
  return list.length ? list : fallback
}

/** CSS colour of a swatch: a --swatch-<name> variable in globals.css, grey when unknown. */
export function swatchColor(color: string): string {
  return `var(--swatch-${slugify(color)}, var(--surface-4))`
}

/** The images column is JSON: keep only http(s) strings, whatever is stored. */
export function productImages(raw: unknown): string[] {
  if (!Array.isArray(raw)) return []
  return raw.filter((u): u is string => typeof u === "string" && /^https?:\/\//.test(u))
}

/** True when an unpaid order is past its hold and its pieces can go back on sale. */
export function isExpiredHold(createdAt: Date, now: Date = new Date()): boolean {
  return now.getTime() - createdAt.getTime() > SHOP_HOLD_MINUTES * 60_000
}

export const ORDER_STATUS: Record<ShopOrderStatus, { label: string; tone: "accent" | "social" | "muted" | "danger" }> = {
  PENDING: { label: "In attesa di pagamento", tone: "muted" },
  PAID: { label: "Pagato, in preparazione", tone: "accent" },
  READY: { label: "Pronto", tone: "social" },
  DELIVERED: { label: "Consegnato", tone: "muted" },
  CANCELLED: { label: "Annullato", tone: "danger" },
}

/** Who can move an order where: the admin's buttons follow this. */
export function nextAdminStatuses(status: ShopOrderStatus): ShopOrderStatus[] {
  switch (status) {
    case "PAID":
      return ["READY", "DELIVERED", "CANCELLED"]
    case "READY":
      return ["DELIVERED", "PAID", "CANCELLED"]
    case "DELIVERED":
      return ["READY"]
    default:
      return []
  }
}

/** One line of the admin CSV export (semicolon-separated, opens in Excel IT). */
export function csvCell(v: string | number | null | undefined): string {
  const s = v === null || v === undefined ? "" : String(v)
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
