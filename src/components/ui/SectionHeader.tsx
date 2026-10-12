import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { toneOf, type Tone } from "./Card"

/** Title above a group of cards: small coloured eyebrow + optional "see all". */
export function SectionHeader({
  title,
  eyebrow,
  tone,
  action,
  className,
}: {
  title: string
  eyebrow?: string
  tone?: Tone
  action?: { href: string; label: string }
  className?: string
}) {
  return (
    <div className={cn("flex items-end justify-between gap-3", toneOf(tone), className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow text-[var(--tone)]">{eyebrow}</p>}
        <h2 className="font-display text-2xl font-extrabold uppercase leading-none text-white">{title}</h2>
      </div>
      {action && (
        <Link
          href={action.href}
          className="flex min-h-[2.75rem] shrink-0 items-center gap-0.5 text-sm font-bold text-[var(--tone)]"
        >
          {action.label}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}
