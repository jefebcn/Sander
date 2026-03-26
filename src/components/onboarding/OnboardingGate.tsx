"use client"

import { useEffect, useState } from "react"
import { OnboardingCarousel } from "./OnboardingCarousel"

const STORAGE_KEY = "sander_onboarded"

type Status = "loading" | "onboarding" | "done"

export function OnboardingGate() {
  const [status, setStatus] = useState<Status>("loading")

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) {
      setStatus("done")
    } else {
      setStatus("onboarding")
    }
  }, [])

  function handleComplete() {
    localStorage.setItem(STORAGE_KEY, "1")
    setStatus("done")
  }

  // Always cover the screen until we know what to show — prevents flash
  if (status === "loading") {
    return <div className="fixed inset-0 z-[200] bg-black" />
  }

  if (status === "onboarding") {
    return <OnboardingCarousel onComplete={handleComplete} />
  }

  return null
}
