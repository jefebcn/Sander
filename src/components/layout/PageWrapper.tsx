"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { markInAppNavigation } from "@/lib/navHistory"

/** Top-level areas: moving between them is a "tab switch", not a drill-down. */
const AREA_ROOTS = ["/", "/sessions", "/tournaments", "/trova", "/players", "/settimana", "/stagione", "/bagni", "/profile"]

function depth(path: string) {
  return path.split("/").filter(Boolean).length
}

/**
 * Remounts the page on navigation and picks the entrance by direction, the way
 * native apps do: going deeper slides in from the right, going back slides in
 * from the left, switching area just fades. It tells you where you went
 * without a word. Reduced-motion users get an instant swap (globals.css).
 */
export function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const prev = useRef<string | null>(null)
  const last = useRef<{ path: string; cls: string } | null>(null)
  const seenPath = useRef(pathname)

  // Lets back buttons know there is an in-app page behind this one.
  useEffect(() => {
    if (pathname !== seenPath.current) markInAppNavigation()
    seenPath.current = pathname
  }, [pathname])

  // Compute once per pathname, during render, so the class is on the first paint.
  if (last.current?.path !== pathname) {
    const from = prev.current
    let cls = "page-tab"
    if (from && from !== pathname) {
      const bothRoots = AREA_ROOTS.includes(from) && AREA_ROOTS.includes(pathname)
      if (!bothRoots) {
        if (pathname.startsWith(from === "/" ? "/__never__" : `${from}/`) || depth(pathname) > depth(from)) cls = "page-forward"
        else if (from.startsWith(`${pathname}/`) || depth(pathname) < depth(from)) cls = "page-back"
      }
    }
    prev.current = pathname
    last.current = { path: pathname, cls }
  }

  return (
    <div key={pathname} className={last.current.cls}>
      {children}
    </div>
  )
}
