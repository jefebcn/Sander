"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, Banknote, Bug, ChartColumn, Coins, LayoutGrid, ShieldCheck, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"

const LINKS = [
  { href: "/admin", icon: LayoutGrid, label: "Panoramica" },
  { href: "/admin/investitori", icon: TrendingUp, label: "Investitori" },
  { href: "/admin/metriche", icon: ChartColumn, label: "Metriche" },
  { href: "/admin/segnalazioni", icon: ShieldCheck, label: "Moderazione" },
  { href: "/admin/payments", icon: Banknote, label: "Pagamenti" },
  { href: "/admin/sistema", icon: Bug, label: "Sistema" },
  { href: "/profile?tab=admin", icon: Coins, label: "Crediti e contenuti" },
] as const

/** Desktop only: the admin pages side by side with the page you are on. */
export function AdminNav() {
  const pathname = usePathname()
  return (
    <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-1)] px-3 py-6 lg:flex print:hidden">
      <div className="px-3 pb-6">
        <p className="font-display text-2xl font-extrabold tracking-tight text-white">SANDER</p>
        <p className="eyebrow text-[var(--accent)]">Admin</p>
      </div>
      <nav aria-label="Pagine admin" className="flex flex-1 flex-col gap-1">
        {LINKS.map(({ href, icon: Icon, label }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href.split("?")[0])
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[3rem] items-center gap-3 rounded-xl px-3 text-base font-bold transition-colors",
                active ? "bg-[var(--surface-3)] text-white" : "text-[var(--muted-text)] hover:bg-[var(--surface-2)] hover:text-white",
              )}
            >
              <Icon className={cn("h-5 w-5 shrink-0", active && "text-[var(--accent)]")} aria-hidden="true" />
              {label}
            </Link>
          )
        })}
      </nav>
      <Link
        href="/"
        className="flex min-h-[3rem] items-center gap-3 rounded-xl px-3 text-base font-bold text-[var(--muted-text)] hover:bg-[var(--surface-2)] hover:text-white"
      >
        <ArrowLeft className="h-5 w-5" aria-hidden="true" /> Torna all&apos;app
      </Link>
    </aside>
  )
}
