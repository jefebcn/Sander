"use client"

import { useEffect, useRef } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { checkHasPlayerProfile } from "@/actions/players"

const PROFILE_KEY = "sander_has_profile"
const EXEMPT = ["/onboarding/", "/auth/"]

/**
 * Sends a signed-in user without a player profile to the 2-field profile
 * setup. Renders nothing.
 *
 * There used to be a 3-slide intro here ("Scendi in campo." …) shown to every
 * first-time visitor before anything else: three taps of slogans that said
 * nothing about what the app does, ending on the *login* form. The landing
 * page now does that job, so visitors see the promise straight away.
 */
export function OnboardingGate() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  // Read the path through a ref: re-running this on every navigation fired a
  // client redirect in the middle of the server's own redirect to the profile
  // step, which crashed the App Router ("Rendered more hooks…").
  const pathRef = useRef(pathname)
  pathRef.current = pathname

  useEffect(() => {
    if (status === "loading" || EXEMPT.some((p) => pathRef.current.startsWith(p))) return

    if (!session?.user) {
      // A different person may sign in next on this device.
      localStorage.removeItem(PROFILE_KEY)
      return
    }
    if (localStorage.getItem(PROFILE_KEY)) return

    checkHasPlayerProfile().then((hasProfile) => {
      if (hasProfile) localStorage.setItem(PROFILE_KEY, "1")
      else router.push("/onboarding/profile")
    })
  }, [session, status, router])

  return null
}
