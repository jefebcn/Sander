"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { OnboardingCarousel } from "./OnboardingCarousel"

const STORAGE_KEY = "sander_onboarded"

type Status = "loading" | "onboarding" | "done"

// Routes where the gate should stay out of the way
const EXEMPT = ["/onboarding/", "/auth/"]

export function OnboardingGate() {
  // Read localStorage synchronously on first render (client only).
  // If the key already exists the user has been through onboarding —
  // jump straight to "done" so there is zero black flash for returning users.
  const [status, setStatus] = useState<Status>(() => {
    if (typeof window === "undefined") return "loading"
    return localStorage.getItem(STORAGE_KEY) ? "done" : "loading"
  })

  const pathname = usePathname()
  const { data: session, status: sessionStatus } = useSession()

  useEffect(() => {
    if (sessionStatus === "loading") return

    if (session?.user) {
      localStorage.setItem(STORAGE_KEY, "1")
      setStatus("done")
      return
    }

    // No session — check localStorage (already read above, but re-check in
    // case it was cleared externally, e.g. sign-out)
    if (localStorage.getItem(STORAGE_KEY)) {
      setStatus("done")
    } else {
      setStatus("onboarding")
    }
  }, [session, sessionStatus])

  // Never block the profile setup or auth pages
  if (EXEMPT.some((p) => pathname.startsWith(p))) return null

  // Only show the black loading screen for first-time visitors (no localStorage key)
  if (status === "loading") {
    return <div className="fixed inset-0 z-[200] bg-black" />
  }

  if (status === "onboarding") {
    return <OnboardingCarousel onComplete={() => setStatus("done")} />
  }

  return null
}
