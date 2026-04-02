"use client"

import dynamic from "next/dynamic"

const PWAInstallBanner = dynamic(
  () => import("./PWAInstallBanner").then((m) => m.PWAInstallBanner),
  { ssr: false }
)
const CookieBanner = dynamic(
  () => import("./CookieBanner").then((m) => m.CookieBanner),
  { ssr: false }
)

export function ClientOnlyBanners() {
  return (
    <>
      <PWAInstallBanner />
      <CookieBanner />
    </>
  )
}
