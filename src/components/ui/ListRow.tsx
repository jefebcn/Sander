import Link from "next/link"
import { ChevronRight, type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { IconTile } from "./IconTile"
import { toneOf, type Tone } from "./Card"

interface ListRowProps {
  title: React.ReactNode
  subtitle?: React.ReactNode
  icon?: LucideIcon
  /** Custom leading element (avatar, time block) instead of an icon. */
  leading?: React.ReactNode
  trailing?: React.ReactNode
  href?: string
  tone?: Tone
  className?: string
}

/**
 * The row pattern the app repeats everywhere: leading icon, title, one line of
 * detail, and a chevron when it navigates. One component, one look.
 */
export function ListRow({ title, subtitle, icon, leading, trailing, href, tone, className }: ListRowProps) {
  const body = (
    <>
      {leading ?? (icon && <IconTile icon={icon} />)}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-base font-bold text-white">{title}</span>
        {subtitle && <span className="block truncate text-sm text-[var(--muted-text)]">{subtitle}</span>}
      </span>
      {trailing}
      {href && <ChevronRight className="h-5 w-5 shrink-0 text-[var(--tone)]" aria-hidden="true" />}
    </>
  )
  const base = cn(
    "flex min-h-[3.5rem] items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-3 pr-4",
    toneOf(tone),
    className,
  )
  return href ? (
    <Link href={href} className={cn(base, "pressable active:bg-[var(--surface-3)]")}>
      {body}
    </Link>
  ) : (
    <div className={base}>{body}</div>
  )
}
