"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Trophy, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/tournaments", icon: Trophy, label: "Tornei" },
  { href: "/players", icon: Users, label: "Giocatori" },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--border)] bg-[var(--surface-1)]">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                active
                  ? "text-[var(--accent)]"
                  : "text-[var(--muted-text)] hover:text-[var(--foreground)]",
              )}
            >
              <Icon
                className={cn("h-6 w-6", active && "drop-shadow-[0_0_6px_var(--accent)]")}
              />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
