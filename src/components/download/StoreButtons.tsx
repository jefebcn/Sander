"use client"

import { useSyncExternalStore } from "react"
import { Apple, Play } from "lucide-react"
import { trackEvent } from "@/lib/analytics"
import { APPLE_APP_ID, PLAY_STORE_URL } from "@/lib/storeReview"

const APP_STORE_URL = `https://apps.apple.com/app/id${APPLE_APP_ID}`

/** "ios" | "android" | "other", from the user agent (the server renders both buttons). */
function deviceOf(ua: string): "ios" | "android" | "other" {
  if (/iphone|ipad|ipod/i.test(ua)) return "ios"
  if (/android/i.test(ua)) return "android"
  return "other"
}

/** The official stores: the phone's own one first and alone; both on a computer. */
export function StoreButtons() {
  const device = useSyncExternalStore(() => () => {}, () => deviceOf(navigator.userAgent), () => "other" as const)
  const cls = "flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-full font-black transition-transform active:scale-[0.99]"
  const apple = (
    <a
      key="ios"
      href={APP_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("install_click", { platform: "ios_store" })}
      className={`${cls} ${device === "ios" ? "bg-[var(--accent)] text-black" : "bg-[var(--surface-2)] text-white"}`}
    >
      <Apple className="h-5 w-5" aria-hidden="true" /> Scarica sull&apos;App Store
    </a>
  )
  const play = (
    <a
      key="android"
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent("install_click", { platform: "android_store" })}
      className={`${cls} ${device === "ios" ? "bg-[var(--surface-2)] text-white" : "bg-[var(--accent)] text-black"}`}
    >
      <Play className="h-5 w-5" fill="currentColor" aria-hidden="true" /> Scarica su Google Play
    </a>
  )
  if (device === "ios") return <div className="space-y-3">{apple}</div>
  if (device === "android") return <div className="space-y-3">{play}</div>
  return <div className="space-y-3">{[play, apple]}</div>
}
