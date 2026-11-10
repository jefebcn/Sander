"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { PUSH_EVENT } from "@/lib/nativePush"

/**
 * Keeps a server-rendered page fresh: re-renders it every `everyMs` while it is
 * on screen, when the app comes back to the foreground, and at once when a push
 * arrives with the app open. Renders nothing.
 */
export function AutoRefresh({ everyMs }: { everyMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh()
    }
    const timer = everyMs ? window.setInterval(refresh, everyMs) : undefined
    document.addEventListener("visibilitychange", refresh)
    window.addEventListener(PUSH_EVENT, refresh)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener("visibilitychange", refresh)
      window.removeEventListener(PUSH_EVENT, refresh)
    }
  }, [router, everyMs])

  return null
}
