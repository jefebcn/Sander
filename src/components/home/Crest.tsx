import Image from "next/image"
import Link from "next/link"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * The home's card: rounded like everything else in the Riviera style, with a
 * hairline and, for the card that holds the main action, a coral glow from
 * the top corner instead of a heavy frame.
 */
export function Crest({
  children,
  className,
  innerClassName,
  line = "hair",
}: {
  children: React.ReactNode
  className?: string
  innerClassName?: string
  line?: "accent" | "hair"
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-card)] ring-1",
        line === "accent" ? "ring-[var(--accent-line)]" : "ring-[var(--crest-hair)]",
        className,
      )}
      style={{
        background:
          line === "accent"
            ? "radial-gradient(120% 70% at 0% 0%, color-mix(in srgb, var(--accent) 20%, transparent), transparent 60%), var(--surface-2)"
            : "linear-gradient(180deg, var(--surface-2), var(--surface-1))",
      }}
    >
      <div className={cn("relative", innerClassName)}>{children}</div>
    </div>
  )
}

/** Small solid badge with a number or a short mark: ranks, steps, places. */
export function CrestBadge({
  children,
  className,
  tone = "accent",
}: {
  children: React.ReactNode
  className?: string
  tone?: "accent" | "white" | "dark"
}) {
  return (
    <span
      className={cn(
        "num flex shrink-0 items-center justify-center rounded-[0.8rem] leading-none",
        tone === "accent" && "bg-[var(--tone,var(--accent))] text-black",
        tone === "white" && "bg-[var(--crest-line)] text-black",
        tone === "dark" && "bg-[var(--surface-4)] text-[var(--tone,var(--accent))]",
        className,
      )}
    >
      {children}
    </span>
  )
}

/**
 * Section title: eyebrow in the area's tone (set a tone-* class on a parent),
 * white title, and a hairline running to the edge.
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
        {eyebrow && <p className="eyebrow text-[var(--tone)]">{eyebrow}</p>}
        <h2 id={id} className="font-display text-2xl font-extrabold leading-none text-white">{title}</h2>
      </div>
      <span aria-hidden="true" className="mb-1.5 h-px min-w-6 flex-1 bg-[var(--crest-hair)]" />
      {action && (
        <Link
          href={action.href}
          className="-my-2 flex min-h-[2.75rem] shrink-0 items-center gap-0.5 text-sm font-bold text-[var(--tone)]"
        >
          {action.label}
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}

/** Logo + wordmark: the crest and SANDER in capitals. */
export function CrestWordmark() {
  return (
    <Link href="/" className="flex min-h-[2.75rem] items-center gap-2.5" aria-label="SANDER, home">
      <Image src="/icon-192.png" alt="" width={40} height={40} className="rounded-[0.7rem] ring-1 ring-[var(--crest-hair)]" loading="eager" />
      <span className="font-display text-[1.3rem] font-extrabold uppercase leading-none tracking-[0.16em] text-white">
        Sander
      </span>
    </Link>
  )
}
