import Link from "next/link"
import { cn } from "@/lib/utils"

export type Tone = "play" | "compete" | "social" | "sand"

const toneClass: Record<Tone, string> = {
  play: "tone-play",
  compete: "tone-compete",
  social: "tone-social",
  sand: "tone-sand",
}

/** Class for an area tone; children read var(--tone). */
export function toneOf(tone?: Tone) {
  return tone ? toneClass[tone] : undefined
}

interface CardProps {
  children: React.ReactNode
  className?: string
  tone?: Tone
  /** Hairline in the area colour — use for the one card that should stand out. */
  highlight?: boolean
}

/** The one surface every block in the app sits on. */
export function Card({ children, className, tone, highlight }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-lg)] bg-[var(--surface-2)] shadow-[var(--shadow-card)]",
        highlight && "ring-1 ring-[var(--tone-line)]",
        toneOf(tone),
        className,
      )}
    >
      {children}
    </div>
  )
}

/** A whole card that navigates. Presses down slightly on touch. */
export function CardLink({ href, children, className, tone, highlight }: CardProps & { href: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "pressable block rounded-[var(--radius-lg)] bg-[var(--surface-2)] shadow-[var(--shadow-card)] active:bg-[var(--surface-3)]",
        highlight && "ring-1 ring-[var(--tone-line)]",
        toneOf(tone),
        className,
      )}
    >
      {children}
    </Link>
  )
}
