"use client"

import { useEffect, useLayoutEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { OnboardingCarousel } from "./OnboardingCarousel"

const STORAGE_KEY = "sander_onboarded"

type Status = "loading" | "onboarding" | "done"

const EXEMPT = ["/onboarding/", "/auth/"]

export function OnboardingGate() {
  // Always start with "loading" on both server and client — avoids hydration mismatch.
  const [status, setStatus] = useState<Status>("loading")

  const pathname = usePathname()
  const { data: session, status: sessionStatus } = useSession()

  // useLayoutEffect runs client-only, synchronously after hydration, before the
  // browser paints. If the user already has the key in localStorage, jump to
  // "done" instantly — no visible black screen for returning users.
  useLayoutEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) {
      setStatus("done")
    }
  }, [])

  useEffect(() => {
    if (sessionStatus === "loading") return

    if (session?.user) {
      localStorage.setItem(STORAGE_KEY, "1")
      setStatus("done")
      return
    }

    if (localStorage.getItem(STORAGE_KEY)) {
      setStatus("done")
    } else {
      setStatus("onboarding")
    }
  }, [session, sessionStatus])

  if (EXEMPT.some((p) => pathname.startsWith(p))) return null

  // While loading: render nothing (not a black div) so page content is visible
  // beneath. For first-time visitors the carousel overlays once session resolves.
  if (status === "loading") return null

  if (status === "onboarding") {
    return <OnboardingCarousel onComplete={() => setStatus("done")} />
  }

  return null
}
