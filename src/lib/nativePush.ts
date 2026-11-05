"use client"

import { nativePlatform } from "@/lib/native"
import { registerNativePush } from "@/actions/push"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Native push in the iPhone app (@capacitor/push-notifications → APNs).      */
/*                                                                             */
/*  Web push never reaches the app's web view, so on iOS the notification      */
/*  prompts use this instead. Android stays on the old path until the app      */
/*  ships with Firebase: registering there without it crashes the app.         */
/* ────────────────────────────────────────────────────────────────────────── */

export function nativePushSupported(): boolean {
  try {
    if (nativePlatform() !== "ios") return false
    const cap = (window as { Capacitor?: { isPluginAvailable?: (name: string) => boolean } }).Capacitor
    return Boolean(cap?.isPluginAvailable?.("PushNotifications"))
  } catch {
    return false
  }
}

export type NativePushState = "granted" | "denied" | "prompt"

export async function nativePushPermission(): Promise<NativePushState> {
  const { PushNotifications } = await import("@capacitor/push-notifications")
  const { receive } = await PushNotifications.checkPermissions()
  return receive === "granted" ? "granted" : receive === "denied" ? "denied" : "prompt"
}

/** Registers with APNs and saves the token for the signed-in player. */
async function registerToken(): Promise<boolean> {
  const { PushNotifications } = await import("@capacitor/push-notifications")
  let done: (token: string | null) => void = () => {}
  const result = new Promise<string | null>((resolve) => (done = resolve))
  const timer = setTimeout(() => done(null), 15_000)
  const handles = await Promise.all([
    PushNotifications.addListener("registration", (t) => done(t.value)),
    PushNotifications.addListener("registrationError", () => done(null)),
  ])
  await PushNotifications.register()
  const token = await result
  clearTimeout(timer)
  await Promise.all(handles.map((h) => h.remove()))
  if (!token) return false
  await registerNativePush({ token, platform: "ios" })
  return true
}

/** Asks for permission (the system prompt) and registers. True when notifications are on. */
export async function enableNativePush(): Promise<boolean> {
  const { PushNotifications } = await import("@capacitor/push-notifications")
  const { receive } = await PushNotifications.requestPermissions()
  if (receive !== "granted") return false
  return registerToken()
}

/** On app start: refresh the token when permission was already given. Never prompts. */
export async function refreshNativePush(): Promise<void> {
  if ((await nativePushPermission()) === "granted") await registerToken()
}

let tapsBound = false

/** Tapping a notification opens its page inside the app (same-site paths only). Bound once. */
export async function listenForTaps(): Promise<void> {
  if (tapsBound) return
  tapsBound = true
  const { PushNotifications } = await import("@capacitor/push-notifications")
  await PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    const url = (action.notification.data as { url?: unknown } | undefined)?.url
    if (typeof url === "string" && url.startsWith("/") && !url.startsWith("//")) window.location.assign(url)
  })
}
