import Stripe from "stripe"

const secretKey = process.env.STRIPE_SECRET_KEY

if (!secretKey) {
  // Don't throw at import time — allow the app to build without Stripe configured.
  // startCheckout() will throw a clear error at runtime if unset.
  // eslint-disable-next-line no-console
  console.warn("[stripe] STRIPE_SECRET_KEY is not set — Stripe payments will fail.")
}

export const stripe = new Stripe(secretKey ?? "sk_test_unset", {
  apiVersion: "2026-03-25.dahlia",
  typescript: true,
})

export function getAppUrl(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL
  if (!url) throw new Error("NEXT_PUBLIC_APP_URL non configurato")
  return url.replace(/\/$/, "")
}
