import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/** The profile's sections (Carta · Attività · Account, or the club's): one tap, no sideways scrolling. */
export function Segments({ items, active }: { items: { id: string; label: string; href: string }[]; active: string }) {
  return (
    <nav aria-label="Sezioni del profilo" className="flex gap-1 rounded-2xl bg-[var(--surface-2)] p-1">
      {items.map((it) => (
        <Link
          key={it.id}
          href={it.href}
          scroll={false}
          aria-current={active === it.id ? "page" : undefined}
          className={cn(
            "flex min-h-[2.75rem] flex-1 items-center justify-center rounded-xl px-1 text-sm font-extrabold transition-colors",
            active === it.id ? "bg-[var(--accent)] text-black" : "text-[var(--muted-text)]",
          )}
        >
          {it.label}
        </Link>
      ))}
    </nav>
  )
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h2 className={cn("px-1 pb-2 pt-3 text-xs font-extrabold uppercase tracking-[0.14em] text-[var(--muted-text)]", className)}>{children}</h2>
}

/** Rows grouped in one rounded block, like the settings of a phone. */
export function ListGroup({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-[var(--border)] overflow-hidden rounded-[1.25rem] bg-[var(--surface-2)]">{children}</div>
}

export function ListRow({
  href,
  icon,
  title,
  subtitle,
  value,
  external,
  tone,
}: {
  href: string
  icon: React.ReactNode
  title: string
  subtitle?: string
  value?: string
  external?: boolean
  tone?: "danger"
}) {
  const inner = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-3)]">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-base font-bold", tone === "danger" ? "text-[var(--danger)]" : "text-white")}>{title}</span>
        {subtitle && <span className="block truncate text-sm text-[var(--muted-text)]">{subtitle}</span>}
      </span>
      {value ? (
        <span className="shrink-0 text-base font-extrabold text-[var(--accent)]">{value}</span>
      ) : (
        <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
      )}
    </>
  )
  const cls = "flex min-h-[3.75rem] items-center gap-3 px-3.5 py-2 active:bg-[var(--surface-3)]"
  return external ? (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link href={href} className={cls}>
      {inner}
    </Link>
  )
}

/** "‹ Account": the way back from a page opened from a section's list. */
export function BackRow({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="-ml-1 flex min-h-[2.75rem] w-fit items-center gap-1 pr-3 text-base font-bold text-[var(--muted-text)] active:text-white">
      <ChevronLeft className="h-5 w-5" aria-hidden="true" /> {label}
    </Link>
  )
}
