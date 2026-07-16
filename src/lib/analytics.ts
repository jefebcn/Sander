"use client"

import { track } from "@vercel/analytics"

/* ────────────────────────────────────────────────────────────────────────── */
/*  Funnel analytics — a thin, fail-safe wrapper around Vercel Analytics.      */
/*                                                                             */
/*  Lets us measure what actually drives growth: where visitors come from      */
/*  (?ref), installs, signups and shares. Never throws — analytics must never  */
/*  break a user flow.                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

export type FunnelEvent =
  | "landing" // a visit tagged with a ?ref source
  | "install_click" // tapped install / add-to-home
  | "signup" // completed registration
  | "share" // shared a Story / card / content

export function trackEvent(
  event: FunnelEvent,
  props?: Record<string, string | number | boolean>,
): void {
  try {
    track(event, props)
  } catch {
    // no-op — analytics is best-effort
  }
}
