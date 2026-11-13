import Link from "next/link"
import { cn } from "@/lib/utils"

/** "Su SANDER | Calendario FIPAV" on the Tornei page. Real links: back/forward keep working. */
export function FipavSourceToggle({ active }: { active: "sander" | "fipav" }) {
  const items = [
    { id: "sander", href: "/tournaments", label: "Su SANDER" },
    { id: "fipav", href: "/tournaments/fipav", label: "Calendario FIPAV" },
  ] as const
  return (
    <nav aria-label="Fonte dei tornei" className="tone-compete px-4 pb-4">
      <div className="flex rounded-full bg-[var(--surface-1)] p-1 ring-1 ring-[var(--border)]">
        {items.map((it) => {
          const on = it.id === active
          return (
            <Link
              key={it.id}
              href={it.href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex min-h-[2.75rem] flex-1 items-center justify-center rounded-full px-3 text-sm font-extrabold transition-colors",
                on ? "bg-[var(--tone)] text-[var(--accent-fg)]" : "text-[var(--muted-text)] active:text-white",
              )}
            >
              {it.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
