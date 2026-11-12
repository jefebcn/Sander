import { describe, expect, it } from "vitest"
import {
  colorOptions,
  colorPhotos,
  csvCell,
  euro,
  isExpiredHold,
  nextAdminStatuses,
  orderTotals,
  productImages,
  SHOP_HOLD_MINUTES,
  SHOP_SHIPPING_CENTS,
  slugify,
  stockLabel,
  swatchColor,
} from "./shop"

describe("shop rules", () => {
  it("formats euros the Italian way", () => {
    expect(euro(2500)).toBe("25 €")
    expect(euro(2250)).toBe("22,50 €")
  })

  it("adds shipping only when shipped", () => {
    expect(orderTotals(2500, 2, "PICKUP")).toEqual({ itemsCents: 5000, shippingCents: 0, totalCents: 5000 })
    expect(orderTotals(2500, 1, "SHIP")).toEqual({ itemsCents: 2500, shippingCents: SHOP_SHIPPING_CENTS, totalCents: 2500 + SHOP_SHIPPING_CENTS })
  })

  it("labels low and empty stock", () => {
    expect(stockLabel(0)).toBe("Esaurita")
    expect(stockLabel(1)).toBe("Ultimo pezzo")
    expect(stockLabel(3)).toBe("Ultimi 3")
    expect(stockLabel(4)).toBeNull()
  })

  it("makes clean slugs", () => {
    expect(slugify("Maglia ufficiale SANDER")).toBe("maglia-ufficiale-sander")
    expect(slugify("  Città & Mare!! ")).toBe("citta-mare")
    expect(slugify("€€€")).toBe("prodotto")
  })

  it("keeps only web image urls", () => {
    expect(productImages(["https://a.it/x.jpg", "javascript:alert(1)", 3, null])).toEqual(["https://a.it/x.jpg"])
    expect(productImages("nope")).toEqual([])
  })

  it("expires an unpaid hold after the window", () => {
    const now = new Date("2026-11-11T12:00:00Z")
    expect(isExpiredHold(new Date(now.getTime() - (SHOP_HOLD_MINUTES - 1) * 60_000), now)).toBe(false)
    expect(isExpiredHold(new Date(now.getTime() - (SHOP_HOLD_MINUTES + 1) * 60_000), now)).toBe(true)
  })

  it("only moves paid orders forward or back one step", () => {
    expect(nextAdminStatuses("PENDING")).toEqual([])
    expect(nextAdminStatuses("CANCELLED")).toEqual([])
    expect(nextAdminStatuses("PAID")).toContain("READY")
  })

  it("quotes CSV cells that need it", () => {
    expect(csvCell("Via Roma; 3")).toBe('"Via Roma; 3"')
    expect(csvCell('Detto "ciao"')).toBe('"Detto ""ciao"""')
    expect(csvCell(null)).toBe("")
  })
})

describe("shop colours", () => {
  const v = (id: string, label: string, stock = 5) => ({ id, label, stock })

  it("groups «Colore · Taglia» variants by colour, keeping their order", () => {
    const c = colorOptions([v("1", "Nero · S"), v("2", "Nero · M", 0), v("3", "Bianco · S"), v("4", "Bianco · M")])
    expect(c?.map((o) => o.name)).toEqual(["Nero", "Bianco"])
    expect(c?.[0].sizes).toEqual([
      { id: "1", size: "S", stock: 5 },
      { id: "2", size: "M", stock: 0 },
    ])
  })

  it("is null for plain sizes, a single colour or a mix", () => {
    expect(colorOptions([v("1", "S"), v("2", "M")])).toBeNull()
    expect(colorOptions([v("1", "Nero · S"), v("2", "Nero · M")])).toBeNull()
    expect(colorOptions([v("1", "Nero · S"), v("2", "M")])).toBeNull()
    expect(colorOptions([])).toBeNull()
  })

  it("picks a colour's photos, or falls back to the product's", () => {
    const raw = { Nero: ["https://x.it/n.jpg"], Rosa: [] }
    expect(colorPhotos(raw, "Nero", ["https://x.it/c.jpg"])).toEqual(["https://x.it/n.jpg"])
    expect(colorPhotos(raw, "Rosa", ["https://x.it/c.jpg"])).toEqual(["https://x.it/c.jpg"])
    expect(colorPhotos(null, "Nero", [])).toEqual([])
    expect(colorPhotos(["x"], "Nero", ["https://x.it/c.jpg"])).toEqual(["https://x.it/c.jpg"])
  })

  it("names the swatch variable after the colour", () => {
    expect(swatchColor("Lime")).toBe("var(--swatch-lime, var(--surface-4))")
  })
})
