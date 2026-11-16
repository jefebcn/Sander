import Link from "next/link"
import { cn } from "@/lib/utils"

/** A horizontal row of filter chips; each chip is a link with its query string. */
export function FipavChips({
  label,
  items,
}: {
  label: string
  items: { key: string; label: string; href: string; on: boolean; count?: number }[]
}) {
  return (
    <div role="group" aria-label={label} className="rail gap-2 px-4">
      {items.map((it) => (
        <Link
          key={it.key}
          href={it.href}
          scroll={false}
          aria-current={it.on ? "true" : undefined}
          className={cn(
            "flex min-h-[2.75rem] items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-sm font-bold transition-colors",
            it.on ? "bg-[var(--tone)] text-[var(--accent-fg)]" : "bg-[var(--surface-2)] text-white active:bg-[var(--surface-3)]",
          )}
        >
          {it.label}
          {it.count != null && (
            <span className={cn("text-xs font-semibold", it.on ? "text-[var(--accent-fg)]" : "text-[var(--muted-text)]")}>{it.count}</span>
          )}
        </Link>
      ))}
    </div>
  )
}
