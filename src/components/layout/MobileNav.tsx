"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Home, Volleyball, Trophy, User, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useHaptic } from "@/lib/useHaptic"
import { QuickActionsSheet } from "./QuickActionsSheet"

/**
 * Four destinations + one action. The centre button is the thing people open
 * the app to do — play — so it is one thumb-tap away from every screen
 * instead of buried inside a tab.
 *
 * Each tab lights up in its area colour (see globals.css), and secondary
 * surfaces light up their parent, so you always know where you are.
 */
const NAV_ITEMS = [
  { href: "/",          icon: Home,       label: "Home",        tone: "var(--play)",    matches: ["/feed", "/level-info"] },
  { href: "/sessions",  icon: Volleyball, label: "Gioca",       tone: "var(--play)",    matches: ["/tournaments", "/segna", "/trova"] },
  { href: "/players",   icon: Trophy,     label: "Classifiche", tone: "var(--compete)", matches: ["/settimana", "/stagione", "/bagni"] },
  { href: "/profile",   icon: User,       label: "Profilo",     tone: "var(--social)",  matches: ["/messaggi", "/admin"] },
] as const

export function MobileNav() {
  const pathname = usePathname()
  const haptic = useHaptic()
  // Optimistic path — updates immediately on tap for instant active-state feedback
  const [optimisticPath, setOptimisticPath] = useState<string | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    setOptimisticPath(null)
    setSheetOpen(false)
  }, [pathname])

  // Hide on full-screen overlays: auth, onboarding, and an open conversation
  // (/messaggi/<id> — but keep it on the /messaggi inbox).
  if (
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/onboarding/") ||
    pathname.startsWith("/messaggi/")
  )
    return null

  const displayPath = optimisticPath ?? pathname
  const isActive = (href: string, matches: readonly string[]) =>
    displayPath === href ||
    (href !== "/" && displayPath.startsWith(href)) ||
    matches.some((m) => displayPath === m || displayPath.startsWith(`${m}/`))

  const renderTab = ({ href, icon: Icon, label, tone, matches }: (typeof NAV_ITEMS)[number]) => {
    const active = isActive(href, matches)
    return (
      <Link
        key={href}
        href={href}
        prefetch={true}
        onClick={(e) => {
          if (active && displayPath === href) { e.preventDefault(); return }
          haptic("light")
          setOptimisticPath(href)
        }}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative flex min-h-[3.5rem] flex-1 flex-col items-center justify-center gap-1 text-xs font-bold",
          "transition-colors duration-150 active:scale-95",
          active ? "text-[var(--nav-tone)]" : "text-[var(--muted-text)]",
        )}
        style={{ "--nav-tone": tone, WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
      >
        <span
          className={cn(
            "flex h-8 w-14 items-center justify-center rounded-full transition-colors duration-200",
            active && "bg-[color-mix(in_srgb,var(--nav-tone)_16%,transparent)]",
          )}
        >
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <span>{label}</span>
      </Link>
    )
  }

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--surface-1)]/92 backdrop-blur-xl md:hidden"
        aria-label="Navigazione principale"
      >
        <div
          className="mx-auto flex max-w-lg items-end px-1 pt-1.5"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.4rem)" }}
        >
          {NAV_ITEMS.slice(0, 2).map(renderTab)}

          {/* Centre action */}
          <div className="flex flex-1 justify-center">
            <button
              type="button"
              onClick={() => { haptic("success"); setSheetOpen(true) }}
              aria-label="Azioni rapide: crea, trova, segna, invita"
              aria-haspopup="dialog"
              aria-expanded={sheetOpen}
              className="-mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-black shadow-[var(--shadow-glow)] ring-4 ring-[var(--background)] transition-transform duration-150 active:scale-90"
            >
              <Plus className={cn("h-8 w-8 transition-transform duration-300", sheetOpen && "rotate-45")} strokeWidth={2.75} />
            </button>
          </div>

          {NAV_ITEMS.slice(2).map(renderTab)}
        </div>
      </nav>
      <QuickActionsSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  )
}
