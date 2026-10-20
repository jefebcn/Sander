"use client"

import { useEffect, useState } from "react"

const FIELD = "input, textarea, select, [contenteditable='true']"

/**
 * Two iPhone fixes, both no-ops elsewhere.
 *
 * 1. With the translucent status bar (see appleWebApp in layout.tsx) the page
 *    scrolls under the clock. Once you scroll, a strip the height of the
 *    status bar covers it; at the top of the page heroes still bleed under.
 * 2. iOS, above all as an installed app, sometimes leaves the viewport offset
 *    after the keyboard closes: the tab bar floats mid-screen with the page
 *    showing below it, and the header slides under the clock. Nudging the
 *    scroll position once the keyboard is gone makes WebKit lay it out again.
 */
export function IosViewportFix() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })

    let timer: number | undefined
    let closingUntil = 0
    const settle = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(() => {
        // Moving from one field to the next: the keyboard stays up.
        if (document.activeElement?.matches(FIELD)) return
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
    // viewport grows back, but only right after a field lost focus, so normal
    // scrolling (Safari's bars resize the viewport too) is never interrupted.
    const onViewportResize = () => {
      if (Date.now() < closingUntil) settle()
    }
    document.addEventListener("focusout", onFocusOut)
    window.visualViewport?.addEventListener("resize", onViewportResize)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener("scroll", onScroll)
      document.removeEventListener("focusout", onFocusOut)
      window.visualViewport?.removeEventListener("resize", onViewportResize)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-40 bg-[var(--background)]/90 backdrop-blur-xl transition-opacity duration-200 ${scrolled ? "opacity-100" : "opacity-0"}`}
      style={{ height: "env(safe-area-inset-top, 0px)" }}
    />
  )
}
