"use client"

import { usePathname } from "next/navigation"

/**
 * Wraps page content with a key tied to the current pathname.
 * React remounts the inner div on every navigation → triggers the
 * `page-enter` CSS animation (fadeUp 220ms) on each page transition.
 */
export function PageWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  )
}
