"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Trophy, Users, Volleyball } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/sessions", icon: Volleyball, label: "Partite" },
  { href: "/tournaments", icon: Trophy, label: "Tornei" },
  { href: "/players", icon: Users, label: "Giocatori" },
]

export function MobileNav() {
  const pathname = usePathname()

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
              className={cn(
                "relative flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors duration-150",
                active ? "text-[var(--accent)]" : "text-[var(--muted-text)] hover:text-[var(--foreground)]",
              )}
            >
              <Icon className="h-6 w-6" aria-hidden="true" />
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
