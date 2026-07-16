"use client"

import { useEffect } from "react"
import { trackEvent } from "@/lib/analytics"

/** Fires a "landing" event once when the URL carries a ?ref source
 *  (story / wrapped / duo / division / content …). This is the attribution
 *  signal that tells us which content actually drives visits. */
export function RefTracker() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const ref = params.get("ref")
      if (ref) {
        trackEvent("landing", { ref, path: window.location.pathname })
      }
    } catch {
      /* no-op */
    }
  }, [])
  return null
}
