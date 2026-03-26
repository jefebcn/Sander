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
  const [status, setStatus] = useState<Status>("loading")
  const pathname = usePathname()
  const { data: session, status: sessionStatus } = useSession()

  useEffect(() => {
    // Wait for session to resolve
    if (sessionStatus === "loading") return

    // If user has an active session, they're already registered — skip onboarding
    if (session?.user) {
      localStorage.setItem(STORAGE_KEY, "1")
      setStatus("done")
      return
    }

    // Fallback: check localStorage for users who completed onboarding
    if (localStorage.getItem(STORAGE_KEY)) {
      setStatus("done")
    } else {
      setStatus("onboarding")
    }
  }, [session, sessionStatus])

  // Never block the profile setup or auth pages
  if (EXEMPT.some((p) => pathname.startsWith(p))) return null

  if (status === "loading") {
    return <div className="fixed inset-0 z-[200] bg-black" />
  }

  if (status === "onboarding") {
    return <OnboardingCarousel onComplete={() => setStatus("done")} />
  }

  return null
}
