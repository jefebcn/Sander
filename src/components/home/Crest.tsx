import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * The logo's shield: a white (or lime) monoline frame with a chevron tip.
 * Two nested clip-paths instead of a border, because borders are clipped away
 * on a polygon; the 2px gap between them is the line. Keep content clear of
 * the tip with bottom padding at least as deep as `tip`.
 */
export function Crest({
  children,
  className,
  innerClassName,
  line = "white",
  tip = "1.75rem",
}: {
  children: React.ReactNode
  className?: string
  innerClassName?: string
  line?: "white" | "lime" | "hair"
  tip?: string
}) {
  return (
    <div
      className={cn(
        "crest-clip p-[2px]",
        line === "lime" ? "bg-[var(--accent)]" : line === "hair" ? "bg-[var(--crest-hair)]" : "bg-[var(--crest-line)]",
        className,
      )}
      style={{ "--crest-tip": tip } as React.CSSProperties}
    >
      <div className={cn("crest-clip relative bg-[var(--surface-1)]", innerClassName)}>{children}</div>
    </div>
  )
}

/** Small solid shield with a number or a short mark: ranks, steps, places. */
export function CrestBadge({
  children,
  className,
  tone = "lime",
}: {
  children: React.ReactNode
  className?: string
  tone?: "lime" | "white" | "dark"
}) {
  return (
    <span
      className={cn(
        "crest-clip num flex shrink-0 items-start justify-center pt-[0.35em] leading-none",
        tone === "lime" && "bg-[var(--accent)] text-black",
        tone === "white" && "bg-[var(--crest-line)] text-black",
        tone === "dark" && "bg-[var(--surface-4)] text-[var(--accent)]",
        className,
      )}
      style={{ "--crest-tip": "28%" } as React.CSSProperties}
    >
      {children}
    </span>
  )
}

/**
 * Section title in the crest voice: lime eyebrow, white condensed title, and
 * a hairline running to the edge like the bar of a coat of arms.
 */
export function CrestHeading({
  id,
  eyebrow,
  title,
  action,
  className,
}: {
  /** For the section's aria-labelledby. */
  id?: string
  eyebrow?: string
  title: string
  action?: { href: string; label: string }
  className?: string
}) {
  return (
    <div className={cn("flex items-end gap-3", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow text-[var(--accent)]">{eyebrow}</p>}
        <h2 id={id} className="font-display text-2xl font-extrabold uppercase leading-none text-white">{title}</h2>
      </div>
      <span aria-hidden="true" className="mb-1.5 h-px min-w-6 flex-1 bg-[var(--crest-hair)]" />
      {action && (
        <Link
          href={action.href}
          className="-my-2 flex min-h-[2.75rem] shrink-0 items-center gap-0.5 text-sm font-bold text-[var(--accent)]"
        >
          {action.label}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}

/** Logo + wordmark, spaced like the lettering on the shield. */
export function CrestWordmark() {
  return (
    <Link href="/" className="flex min-h-[2.75rem] items-center gap-2.5" aria-label="SANDER, home">
      <Image src="/icon-192.png" alt="" width={40} height={40} className="rounded-[0.6rem]" loading="eager" />
      <span className="font-display text-[1.35rem] font-black uppercase leading-none tracking-[0.22em] text-white">
        Sander
      </span>
    </Link>
  )
}
