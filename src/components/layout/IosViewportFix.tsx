"use client"

import { useEffect, useState } from "react"

const FIELD = "input, textarea, select, [contenteditable='true']"

/**
 * Three iPhone fixes, all no-ops elsewhere.
 *
 * 1. With the translucent status bar (see appleWebApp in layout.tsx) the page
 *    scrolls under the clock. Once you scroll, a strip the height of the
 *    status bar covers it; at the top of the page heroes still bleed under.
 * 2. iOS, above all as an installed app, sometimes leaves the viewport offset
 *    after the keyboard (or a select / date picker) closes: the tab bar floats mid-screen with the page
 *    showing below it, and the header slides under the clock. Nudging the
 *    scroll position once the keyboard is gone makes WebKit lay it out again.
 * 3. No pinch-zoom: Safari ignores user-scalable=no in the viewport, so its
 *    gesture event is cancelled; touch-action: pan-x pan-y (globals.css) stops
 *    pinch and double-tap zoom without slowing scrolling down.
 */
export function IosViewportFix() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    // Only touch React when the strip has to appear or disappear, not on every scrolled pixel.
    let last: boolean | null = null
    const onScroll = () => {
      const now = window.scrollY > 4
      if (now !== last) setScrolled((last = now))
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })

    let timer: number | undefined
    let closingUntil = 0
    const settle = (force = false) => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        // Moving from one field to the next: the keyboard stays up.
        if (!force && document.activeElement?.matches(FIELD)) return
        const y = window.scrollY
        window.scrollTo(0, y + 1)
        window.scrollTo(0, y)
      }, 150)
    }
    const onFocusOut = (e: FocusEvent) => {
      if (!(e.target instanceof Element) || !e.target.matches(FIELD)) return
      closingUntil = Date.now() + 1500
      settle()
    }
    // The keyboard finishes sliding away after focusout; settle again when the
    // viewport grows back right after a field lost focus. A select or date
    // picker closes without focusout (the field keeps focus), so a big jump
    // back in height settles too, whatever has focus. Safari's own bars change
    // the height far less than that, so normal scrolling is never touched.
    let height = window.visualViewport?.height ?? window.innerHeight
    const onViewportResize = () => {
      const h = window.visualViewport?.height ?? window.innerHeight
      const grew = h - height
      height = h
      if (grew > 150) settle(true)
      else if (Date.now() < closingUntil) settle()
    }
    document.addEventListener("focusout", onFocusOut)
    window.visualViewport?.addEventListener("resize", onViewportResize)
    const noZoom = (e: Event) => e.preventDefault()
    document.addEventListener("gesturestart", noZoom)
    return () => {
      document.removeEventListener("gesturestart", noZoom)
      window.clearTimeout(timer)
      window.removeEventListener("scroll", onScroll)
      document.removeEventListener("focusout", onFocusOut)
      window.visualViewport?.removeEventListener("resize", onViewportResize)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-40 bg-[var(--background)]/95 transition-opacity duration-200 ${scrolled ? "opacity-100" : "opacity-0"}`}
      style={{ height: "env(safe-area-inset-top, 0px)" }}
    />
  )
}
