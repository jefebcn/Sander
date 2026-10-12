import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { IconTile } from "./IconTile"
import { toneOf, type Tone } from "./Card"

/** What to show when a list is empty: say why, and offer the next step. */
export function EmptyState({
  icon,
  title,
  text,
  action,
  tone = "play",
  className,
}: {
  icon: LucideIcon
  title: string
  text?: string
  action?: { href: string; label: string }
  tone?: Tone
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--tone-line)] px-5 py-8 text-center",
        toneOf(tone),
        className,
      )}
    >
      <IconTile icon={icon} size="lg" />
      <p className="font-display text-xl font-extrabold uppercase text-white">{title}</p>
      {text && <p className="max-w-xs text-base text-[var(--muted-text)]">{text}</p>}
      {action && (
        <Link
          href={action.href}
          className="mt-1 flex min-h-[3.5rem] items-center justify-center rounded-[var(--radius-md)] bg-[var(--tone)] px-6 text-base font-extrabold text-black"
        >
          {action.label}
        </Link>
      )}
    </div>
  )
}
