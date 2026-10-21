"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Home, Volleyball, Trophy, User, HeartHandshake } from "lucide-react"
import { cn } from "@/lib/utils"
import { useHaptic } from "@/lib/useHaptic"
import { getScopriBadge } from "@/actions/scopri"

/**
 * Four destinations around Scopri. The centre button is the thing people open
 * the app to do now — find someone to play with — so it is one thumb-tap away
 * from every screen, with the likes and replies waiting for you on it.
 * (Quick actions: the round buttons at the top of Home, and the "+" on Gioca.)
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

const SCOPRI_PATH = "/scopri"

export function MobileNav() {
  const pathname = usePathname()
  const haptic = useHaptic()
  // Optimistic path — updates immediately on tap for instant active-state feedback
  // The tapped tab lights up at once; it's dropped as soon as the path changes
  // (it remembers the path it was set on, so no effect is needed to reset it).
  const [optimistic, setOptimistic] = useState<{ to: string; from: string } | null>(null)
  const optimisticPath = optimistic && optimistic.from === pathname ? optimistic.to : null
  const setOptimisticPath = (to: string) => setOptimistic({ to, from: pathname })
  const { data: badge = 0 } = useQuery({
    queryKey: ["scopri-badge"],
    queryFn: () => getScopriBadge(),
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  })

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
      {/* z-30: above page content, below every sheet/dialog (z-50+), so an
          overlay opened inside a page always covers the bar. On wide screens
          the same bar is shown, centred under the phone-width app column. */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 mx-auto border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_94%,transparent)] md:max-w-[560px] md:rounded-t-2xl md:border-x"
        aria-label="Navigazione principale"
      >
        <div
          className="mx-auto flex max-w-lg items-end px-1 pt-1.5"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 0.4rem)" }}
        >
          {NAV_ITEMS.slice(0, 2).map(renderTab)}

          {/* Centre: Scopri */}
          <div className="flex flex-1 justify-center">
            <Link
              href={SCOPRI_PATH}
              prefetch={true}
              onClick={() => { haptic("success"); setOptimisticPath(SCOPRI_PATH) }}
              aria-label={badge > 0 ? `Scopri: trova con chi giocare, ${badge} novità` : "Scopri: trova con chi giocare"}
              aria-current={displayPath.startsWith(SCOPRI_PATH) ? "page" : undefined}
              className={cn(
                "relative -mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-black shadow-[var(--shadow-glow)] ring-4 ring-[var(--background)] transition-transform duration-150 active:scale-90",
                displayPath.startsWith(SCOPRI_PATH) && "scale-105",
              )}
            >
              <HeartHandshake className="h-8 w-8" strokeWidth={2.25} aria-hidden="true" />
              {badge > 0 && (
                <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[var(--love)] px-1.5 text-xs font-extrabold text-white ring-2 ring-[var(--background)]">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </Link>
          </div>

          {NAV_ITEMS.slice(2).map(renderTab)}
        </div>
      </nav>
    </>
  )
}
