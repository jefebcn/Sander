"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { listenForTaps, nativePushSupported, refreshNativePush } from "@/lib/nativePush"

let lastRefresh = 0

/**
 * iPhone app: opens tapped notifications and keeps the APNs token tied to
 * whoever is signed in (re-checked on navigation, at most every 10 minutes,
 * so a fresh sign-in picks it up). Renders nothing.
 */
export function NativePushBridge() {
  const pathname = usePathname()
  useEffect(() => {
    if (!nativePushSupported()) return
    void listenForTaps().catch(() => {})
    if (Date.now() - lastRefresh < 10 * 60_000) return
    lastRefresh = Date.now()
    void refreshNativePush().catch(() => {})
  }, [pathname])
  return null
}
