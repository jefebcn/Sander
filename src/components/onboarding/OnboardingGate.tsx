"use client"

import { useEffect, useLayoutEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { checkHasPlayerProfile } from "@/actions/players"
import { OnboardingCarousel } from "./OnboardingCarousel"

const STORAGE_KEY = "sander_onboarded"
const PROFILE_KEY = "sander_has_profile"

type Status = "loading" | "onboarding" | "done"

const EXEMPT = ["/onboarding/", "/auth/"]

export function OnboardingGate() {
  // Always start with "loading" on both server and client — avoids hydration mismatch.
  const [status, setStatus] = useState<Status>("loading")

  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()

  // useLayoutEffect runs client-only, synchronously after hydration, before the
  // browser paints. If the user already has both keys in localStorage, jump to
  // "done" instantly — no visible black screen for returning users.
  useLayoutEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) && localStorage.getItem(PROFILE_KEY)) {
      setStatus("done")
    }
  }, [])

  useEffect(() => {
    if (sessionStatus === "loading") return

    if (session?.user) {
      // Fast path: already verified this session has a player profile
      if (localStorage.getItem(PROFILE_KEY)) {
        localStorage.setItem(STORAGE_KEY, "1")
        setStatus("done")
        return
      }
      // Verify server-side whether a Player record exists for this user
      checkHasPlayerProfile().then((hasProfile) => {
        if (hasProfile) {
          localStorage.setItem(STORAGE_KEY, "1")
          localStorage.setItem(PROFILE_KEY, "1")
          setStatus("done")
        } else {
          // No player profile yet — send to profile setup
          setStatus("done") // hide carousel; page will show profile form
          router.push("/onboarding/profile")
        }
      })
      return
    }

    // Logged-out path: clear cached profile flag (different user may sign in next)
    localStorage.removeItem(PROFILE_KEY)

    if (localStorage.getItem(STORAGE_KEY)) {
      setStatus("done")
    } else {
      setStatus("onboarding")
    }
  }, [session, sessionStatus, router])

  if (EXEMPT.some((p) => pathname.startsWith(p))) return null

  // While loading: render nothing (not a black div) so page content is visible
  // beneath. For first-time visitors the carousel overlays once session resolves.
  if (status === "loading") return null

  if (status === "onboarding") {
    return <OnboardingCarousel onComplete={() => setStatus("done")} />
  }

  return null
}
