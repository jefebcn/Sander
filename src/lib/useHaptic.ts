"use client"

/**
 * useHaptic — trigger device vibration for tactile feedback.
 *
 * Works on Android/Chrome and Safari 16.4+.
 * Silently no-ops on unsupported platforms (iOS < 16, desktop).
 *
 * Usage:
 *   const haptic = useHaptic()
 *   haptic("light")      // 30ms — nav tap, button press
 *   haptic("success")    // 2-pulse: 15ms + 10ms — confirm, join, save
 *   haptic("error")      // 80ms buzz — validation failure
 *   haptic("heavy")      // 60ms — level-up, tournament win
 */

type HapticPattern = "light" | "success" | "error" | "heavy"

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light:   30,
  success: [15, 80, 10],
  error:   [80, 60, 80],
  heavy:   60,
}

export function useHaptic() {
  return (pattern: HapticPattern = "light") => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(PATTERNS[pattern])
      } catch {
        // silently ignore if vibrate is blocked
      }
    }
  }
}
