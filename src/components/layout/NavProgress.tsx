"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname, useSearchParams } from "next/navigation"

/**
 * A thin lime bar at the top while the next page loads. There are no
 * full-page skeletons (they flashed grey blocks on every tap): the page you
 * are on stays until the next one is ready, and this bar says it's coming.
 * It appears only if loading takes longer than a blink.
 */
export function NavProgress() {
  const pathname = usePathname()
  const search = useSearchParams()
  const [state, setState] = useState<"idle" | "loading" | "done">("idle")
  const delay = useRef<number | undefined>(undefined)
  const safety = useRef<number | undefined>(undefined)

  // Arrived: drop a bar that hasn't shown yet, finish one that has.
  useEffect(() => {
    window.clearTimeout(delay.current)
    window.clearTimeout(safety.current)
    setState((s) => (s === "loading" ? "done" : s))
    const t = window.setTimeout(() => setState((s) => (s === "done" ? "idle" : s)), 300)
    return () => window.clearTimeout(t)
  }, [pathname, search])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.("a")
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return
      const url = new URL(a.href, location.href)
      if (url.origin !== location.origin) return
      if (url.pathname === location.pathname && url.search === location.search) return
      window.clearTimeout(delay.current)
      window.clearTimeout(safety.current)
      // Instant navigations (cached pages) never show the bar.
      delay.current = window.setTimeout(() => setState("loading"), 120)
      safety.current = window.setTimeout(() => setState("idle"), 10_000)
    }
    document.addEventListener("click", onClick, true)
    return () => {
      document.removeEventListener("click", onClick, true)
      window.clearTimeout(delay.current)
      window.clearTimeout(safety.current)
    }
  }, [])

  if (state === "idle") return null
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]">
      <div className={`nav-progress h-full bg-[var(--accent)] ${state === "done" ? "nav-progress--done" : ""}`} />
    </div>
  )
}
