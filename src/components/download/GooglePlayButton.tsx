"use client"

import { useEffect, useState } from "react"
import { Play } from "lucide-react"
import { trackEvent } from "@/lib/analytics"

const PLAY_URL = "https://play.google.com/store/apps/details?id=com.sanderbv.app"

/** Primary CTA for Android: the native app on Google Play.
    Hidden on iPhone/iPad (no Play Store there — those users install the PWA). */
export function GooglePlayButton() {
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (/iphone|ipad|ipod/i.test(navigator.userAgent)) setHidden(true)
  }, [])

  if (hidden) return null

  return (
    <a
      href={PLAY_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("install_click", { platform: "android_store" })}
      className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-black transition-transform active:scale-[0.99]"
      style={{ background: "var(--accent)" }}
    >
      <Play className="h-5 w-5" fill="currentColor" /> Scarica su Google Play
    </a>
  )
}
