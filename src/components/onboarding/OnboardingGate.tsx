"use client"

import { useEffect, useState } from "react"
import { OnboardingCarousel } from "./OnboardingCarousel"

const STORAGE_KEY = "sander_onboarded"

export function OnboardingGate() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Only show on first visit
    if (!localStorage.getItem(STORAGE_KEY)) {
      setShow(true)
    }
  }, [])

  function handleComplete() {
    localStorage.setItem(STORAGE_KEY, "1")
    setShow(false)
  }

  if (!show) return null

  return <OnboardingCarousel onComplete={handleComplete} />
}
