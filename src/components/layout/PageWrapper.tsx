"use client"

import { useEffect, useRef, useState } from "react"
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
  const [view, setView] = useState<{ path: string; cls: string }>({ path: pathname, cls: "page-tab" })
  const seenPath = useRef(pathname)

  // Lets back buttons know there is an in-app page behind this one.
  useEffect(() => {
    if (pathname !== seenPath.current) markInAppNavigation()
    seenPath.current = pathname
  }, [pathname])

  // New path: pick the entrance during render (React re-renders before paint),
  // so the class is already there on the first frame of the new page.
  let current = view
  if (view.path !== pathname) {
    current = { path: pathname, cls: entranceFor(view.path, pathname) }
    setView(current)
  }

  return (
    <div key={pathname} className={current.cls}>
      {children}
    </div>
  )
}

function entranceFor(from: string, to: string): string {
  if (from === to) return "page-tab"
  if (AREA_ROOTS.includes(from) && AREA_ROOTS.includes(to)) return "page-tab"
  if (to.startsWith(from === "/" ? "/__never__" : `${from}/`) || depth(to) > depth(from)) return "page-forward"
  if (from.startsWith(`${to}/`) || depth(to) < depth(from)) return "page-back"
  return "page-tab"
}
