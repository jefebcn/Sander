import { describe, expect, it } from "vitest"
import {
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
