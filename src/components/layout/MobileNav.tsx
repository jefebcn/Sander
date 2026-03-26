"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Trophy, User, Activity } from "lucide-react"
import { cn } from "@/lib/utils"
import { useHaptic } from "@/lib/useHaptic"

function BeachNetIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Left pole */}
      <line x1="3" y1="3" x2="3" y2="20" />
      {/* Right pole */}
      <line x1="21" y1="3" x2="21" y2="20" />
      {/* Top tape */}
      <line x1="3" y1="9" x2="21" y2="9" />
      {/* Net bottom edge */}
      <line x1="3" y1="15" x2="21" y2="15" />
      {/* Vertical net dividers */}
      <line x1="8" y1="9" x2="8" y2="15" />
      <line x1="12" y1="9" x2="12" y2="15" />
      <line x1="16" y1="9" x2="16" y2="15" />
      {/* Ground */}
      <line x1="1" y1="20" x2="23" y2="20" />
    </svg>
  )
}

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/sessions", icon: BeachNetIcon, label: "Partite" },
  { href: "/feed", icon: Activity, label: "Feed" },
  { href: "/tournaments", icon: Trophy, label: "Tornei" },
  { href: "/profile", icon: User, label: "Profilo" },
]

export function MobileNav() {
  const pathname = usePathname()
  const haptic = useHaptic()

  // Hide nav on auth and onboarding routes
  if (pathname.startsWith("/auth/") || pathname.startsWith("/onboarding/")) return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--surface-1)]/95 backdrop-blur-md md:hidden"
      aria-label="Navigazione principale"
    >
      <div className="flex items-center justify-around safe-area-pb">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              onClick={() => haptic("light")}
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors duration-150",
                active ? "text-[var(--accent)]" : "text-[var(--muted-text)] hover:text-[var(--foreground)]",
              )}
            >
              <Icon className="h-6 w-6" />
              <span>{label}</span>
              {active && (
                <span className="absolute bottom-0 left-1/2 h-0.5 w-6 -translate-x-1/2 rounded-full bg-[var(--accent)]" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
