"use client"

import { useEffect } from "react"
import { trackEvent } from "@/lib/analytics"
import { parseSignupSource, SIGNUP_SOURCE_KEY } from "@/lib/signupSource"

/** Fires a "landing" event once when the URL carries a ?ref source
 *  (story / wrapped / duo / division / content …). This is the attribution
 *  signal that tells us which content actually drives visits.
 *  It also remembers the first visit's source, saved on the Player at sign-up. */
export function RefTracker() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const ref = params.get("ref")
      if (ref) {
        trackEvent("landing", { ref, path: window.location.pathname })
      }
      if (!localStorage.getItem(SIGNUP_SOURCE_KEY)) {
        localStorage.setItem(
          SIGNUP_SOURCE_KEY,
          parseSignupSource({ search: window.location.search, referrer: document.referrer, ownHost: window.location.host }),
        )
      }
    } catch {
      /* no-op */
    }
  }, [])
  return null
}
