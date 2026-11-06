/* ────────────────────────────────────────────────────────────────────────── */
/*  Club payment links (pure). A club pastes its own link (PayPal.me, SumUp,   */
/*  Satispay…): players pay the club directly, SANDER never holds the money.   */
/*  Only well-known payment services are accepted, so a link can't send        */
/*  players to a look-alike page.                                              */
/* ────────────────────────────────────────────────────────────────────────── */

export const PAYMENT_PROVIDERS = [
  { key: "paypal", name: "PayPal", match: (h: string) => h === "paypal.me" || h === "paypal.com" || h.endsWith(".paypal.me") || h.endsWith(".paypal.com") },
  { key: "sumup", name: "SumUp", match: (h: string) => h === "sumup.com" || h.endsWith(".sumup.com") },
  { key: "satispay", name: "Satispay", match: (h: string) => h === "satispay.com" || h.endsWith(".satispay.com") },
  { key: "revolut", name: "Revolut", match: (h: string) => h === "revolut.me" || h.endsWith(".revolut.me") },
  { key: "stripe", name: "Stripe", match: (h: string) => h === "buy.stripe.com" },
  { key: "bunq", name: "bunq", match: (h: string) => h === "bunq.me" },
] as const

export const PAYMENT_PROVIDER_NAMES = PAYMENT_PROVIDERS.map((p) => p.name).join(", ")

function parse(url: string | null | undefined): URL | null {
  try {
    const u = new URL((url ?? "").trim())
    return u.protocol === "https:" ? u : null
  } catch {
    return null
  }
}

/** The payment service behind a link, or null when it isn't an accepted one. */
export function paymentProvider(url: string | null | undefined): { key: string; name: string } | null {
  const u = parse(url)
  if (!u) return null
  const host = u.hostname.toLowerCase()
  const p = PAYMENT_PROVIDERS.find((x) => x.match(host))
  return p ? { key: p.key, name: p.name } : null
}

/**
 * The link to open for a fee: PayPal.me and bunq.me take the amount in the
 * path ("paypal.me/club/25EUR"), so the player doesn't type it. Other services
 * keep the club's link as it is (their links carry their own amount).
 */
export function paymentLinkFor(url: string | null | undefined, amountCents: number | null | undefined): string | null {
  const u = parse(url)
  if (!u || !paymentProvider(url)) return null
  const segments = u.pathname.split("/").filter(Boolean)
  const host = u.hostname.toLowerCase().replace(/^www\./, "")
  if (amountCents && amountCents > 0 && segments.length === 1 && (host === "paypal.me" || host === "bunq.me")) {
    const amount = (amountCents / 100).toFixed(amountCents % 100 ? 2 : 0)
    u.pathname = `/${segments[0]}/${amount}${host === "paypal.me" ? "EUR" : ""}`
  }
  return u.toString()
}
