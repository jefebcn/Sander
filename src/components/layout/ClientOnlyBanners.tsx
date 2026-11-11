"use client"

import dynamic from "next/dynamic"

const CookieBanner = dynamic(
  () => import("./CookieBanner").then((m) => m.CookieBanner),
  { ssr: false }
)

export function ClientOnlyBanners() {
  return (
    <>
      <CookieBanner />
    </>
  )
}
