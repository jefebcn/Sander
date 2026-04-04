"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Home, Users, User, Trophy } from "lucide-react"
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
      <line x1="3" y1="3" x2="3" y2="20" />
      <line x1="21" y1="3" x2="21" y2="20" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="8" y1="9" x2="8" y2="15" />
      <line x1="12" y1="9" x2="12" y2="15" />
      <line x1="16" y1="9" x2="16" y2="15" />
      <line x1="1" y1="20" x2="23" y2="20" />
    </svg>
  )
}

const NAV_ITEMS = [
  { href: "/",        icon: Home,        label: "Home" },
  { href: "/sessions", icon: BeachNetIcon, label: "Partite" },
  { href: "/tournaments", icon: Trophy,   label: "Tornei" },
  { href: "/players", icon: Users,       label: "Giocatori" },
  { href: "/profile", icon: User,        label: "Profilo" },
]

export function MobileNav() {
  const router = useRouter()
  const pathname = usePathname()
  const haptic = useHaptic()
  const [, startTransition] = useTransition()
  // Optimistic path — updates immediately on tap for instant active-state feedback
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null)

  // Sync back once real navigation completes
  useEffect(() => { setOptimisticPath(null) }, [pathname])

  if (pathname.startsWith("/auth/") || pathname.startsWith("/onboarding/")) return null

  const displayPath = optimisticPath ?? pathname

  function navigate(href: string) {
    if (displayPath === href || (href !== "/" && displayPath.startsWith(href))) return
    haptic("light")
    setOptimisticPath(href)           // instant visual switch
    startTransition(() => router.push(href))
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--surface-1)]/95 backdrop-blur-md md:hidden"
      aria-label="Navigazione principale"
    >
      <div
        className="flex items-start justify-around pt-4"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.75rem)" }}
      >
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = displayPath === href || (href !== "/" && displayPath.startsWith(href))
          return (
            <button
              key={href}
              onClick={() => navigate(href)}
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
            </button>
          )
        })}
      </div>
    </nav>
  )
}
