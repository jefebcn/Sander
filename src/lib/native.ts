"use client"

import { useSyncExternalStore } from "react"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Native capabilities bridge (Capacitor).                                    */
/*                                                                             */
/*  SANDER runs both as a web PWA and inside a Capacitor native shell. These   */
/*  helpers use real native APIs (haptics, camera, native share) when running  */
/*  in the app, and degrade gracefully on the web. Beyond the UX win, this     */
/*  gives the Android build genuine native functionality (Play "Minimum        */
/*  Functionality" policy) on top of the existing native push notifications.   */
/*                                                                             */
/*  All calls are dynamically imported and fail-safe: they never throw.        */
/* ────────────────────────────────────────────────────────────────────────── */

/** True when running inside the Capacitor native app (not a browser). */
export function isNativeApp(): boolean {
  try {
    if (typeof window === "undefined") return false
    // Capacitor injects this global into the native WebView
    const cap = (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
    return Boolean(cap?.isNativePlatform?.())
  } catch {
    return false
  }
}

/** Short haptic tap on a meaningful action. No-op / vibration on the web. */
export async function hapticTap(style: "light" | "medium" | "heavy" = "light"): Promise<void> {
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics")
    const map = { light: ImpactStyle.Light, medium: ImpactStyle.Medium, heavy: ImpactStyle.Heavy }
    await Haptics.impact({ style: map[style] })
  } catch {
    try {
      navigator.vibrate?.(8)
    } catch {
      /* no-op */
    }
  }
}

/** Success haptic pattern (e.g. after a win / share). */
export async function hapticSuccess(): Promise<void> {
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics")
    await Haptics.notification({ type: NotificationType.Success })
  } catch {
    try {
      navigator.vibrate?.([10, 30, 10])
    } catch {
      /* no-op */
    }
  }
}

/**
 * Capture a photo with the native camera / gallery picker.
 * Native only — returns null on the web (callers keep their file-input path).
 * Returns a JPEG Blob ready to upload.
 */
export async function capturePhoto(): Promise<Blob | null> {
  if (!isNativeApp()) return null
  try {
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera")
    const photo = await Camera.getPhoto({
      quality: 80,
      width: 512,
      allowEditing: true,
      resultType: CameraResultType.Uri,
      source: CameraSource.Prompt, // let the user choose camera or gallery
      promptLabelHeader: "Foto profilo",
      promptLabelPhoto: "Dalla galleria",
      promptLabelPicture: "Scatta foto",
    })
    if (!photo.webPath) return null
    const res = await fetch(photo.webPath)
    return await res.blob()
  } catch {
    return null
  }
}

function noopSubscribe() {
  return () => {}
}

/**
 * React hook form of isNativeApp(): false on the server and the first paint,
 * then the real value, without a set-state-in-effect.
 */
export function useIsNativeApp(): boolean {
  return useSyncExternalStore(noopSubscribe, isNativeApp, () => false)
}

/** True in app builds that include native Google sign-in (older installs don't). */
export function hasNativeGoogle(): boolean {
  try {
    if (!isNativeApp()) return false
    const cap = (window as { Capacitor?: { isPluginAvailable?: (name: string) => boolean } }).Capacitor
    return Boolean(cap?.isPluginAvailable?.("SocialLogin"))
  } catch {
    return false
  }
}

export function useHasNativeGoogle(): boolean {
  return useSyncExternalStore(noopSubscribe, hasNativeGoogle, () => false)
}

/**
 * Google sign-in with the phone's own account picker (Credential Manager).
 * Google refuses OAuth inside the app's web view, so this is the only way in
 * from the app. Returns the ID token for the "google-native" provider, or null
 * when the user closes the picker. Throws on other failures.
 */
export async function nativeGoogleIdToken(webClientId: string): Promise<string | null> {
  const { SocialLogin } = await import("@capgo/capacitor-social-login")
  await SocialLogin.initialize({ google: { webClientId, mode: "online" } })
  try {
    const res = await SocialLogin.login({ provider: "google", options: { scopes: ["email", "profile"] } })
    return (res.result as { idToken?: string | null }).idToken ?? null
  } catch (e) {
    if (/cancel/i.test(e instanceof Error ? e.message : String(e))) return null
    throw e
  }
}
