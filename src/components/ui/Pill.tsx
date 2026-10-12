import { cn } from "@/lib/utils"
import { toneOf, type Tone } from "./Card"

/** Small status label. `live` adds a pulsing dot. */
export function Pill({
  children,
  tone,
  live,
  solid,
  className,
}: {
  children: React.ReactNode
  tone?: Tone
  live?: boolean
  solid?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-extrabold uppercase tracking-wide",
        solid ? "bg-[var(--tone)] text-black" : "bg-[var(--tone-soft)] text-[var(--tone)]",
        toneOf(tone),
        className,
      )}
    >
      {live && <span className="live-dot h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
}
