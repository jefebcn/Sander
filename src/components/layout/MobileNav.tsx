"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Users, User, Trophy, Volleyball } from "lucide-react"
import { cn } from "@/lib/utils"
import { useHaptic } from "@/lib/useHaptic"

/**
 * Five tabs is the practical maximum for a thumb-reachable bar, so secondary
 * surfaces don't get their own tab — they light up their parent instead.
 * Without `matches`, /segna, /feed, /trova and /messaggi highlighted nothing
 * and the user lost all sense of where they were.
 */
const NAV_ITEMS = [
  { href: "/",            icon: Home,       label: "Home",      matches: ["/feed"] },
  { href: "/sessions",    icon: Volleyball, label: "Partite",   matches: ["/segna"] },
  { href: "/tournaments", icon: Trophy,     label: "Tornei",    matches: [] as string[] },
  { href: "/players",     icon: Users,      label: "Giocatori", matches: ["/trova"] },
  { href: "/profile",     icon: User,       label: "Profilo",   matches: ["/messaggi"] },
]

export function MobileNav() {
  const pathname = usePathname()
  const haptic = useHaptic()
  // Optimistic path — updates immediately on tap for instant active-state feedback
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null)

  // Sync back once real navigation completes
  useEffect(() => { setOptimisticPath(null) }, [pathname])

  // Hide on full-screen overlays: auth, onboarding, and an open conversation
  // (/messaggi/<id> — but keep it on the /messaggi inbox).
  if (
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/onboarding/") ||
    pathname.startsWith("/messaggi/")
  )
    return null

  const displayPath = optimisticPath ?? pathname

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--surface-1)]/95 backdrop-blur-md md:hidden"
      aria-label="Navigazione principale"
    >
      <div
        className="flex items-start justify-around pt-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
      >
        {NAV_ITEMS.map(({ href, icon: Icon, label, matches }) => {
          const active =
            displayPath === href ||
            (href !== "/" && displayPath.startsWith(href)) ||
            matches.some((m) => displayPath === m || displayPath.startsWith(`${m}/`))
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              onClick={(e) => {
                if (active) { e.preventDefault(); return }
                haptic("light")
                setOptimisticPath(href)
              }}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1.5 pb-1 text-xs font-medium",
                "transition-colors duration-100",
                "active:scale-90",
                active
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted-text)]",
              )}
              style={{ WebkitTapHighlightColor: "transparent" }}
            >
              <Icon className="h-7 w-7" />
              <span>{label}</span>
              {active && (
                <span className="absolute top-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[var(--accent)]" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
