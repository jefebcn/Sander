"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { OnboardingCarousel } from "./OnboardingCarousel"

const STORAGE_KEY = "sander_onboarded"

type Status = "loading" | "onboarding" | "done"

// Routes where the gate should stay out of the way
const EXEMPT = ["/onboarding/", "/auth/"]

export function OnboardingGate() {
  const [status, setStatus] = useState<Status>("loading")
  const pathname = usePathname()

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) {
      setStatus("done")
    } else {
      setStatus("onboarding")
    }
  }, [])

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
