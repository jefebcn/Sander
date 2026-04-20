import { cn } from "@/lib/utils"

interface SkillBadgeProps {
  level: number | null | undefined
  size?: "sm" | "md"
  className?: string
}

const LABEL: Record<number, string> = {
  1: "Dilettante",
  2: "Intermedio",
  3: "Avanzato",
}

// Colors derived from CSS variables. Avoid hardcoded hex per CLAUDE.md.
const STYLE: Record<number, { bg: string; color: string }> = {
  1: { bg: "rgba(148,163,184,0.18)", color: "var(--muted-text)" },
  2: { bg: "rgba(34,197,94,0.18)", color: "var(--live)" },
  3: { bg: "rgba(251,191,36,0.22)", color: "var(--accent)" },
}

export function SkillBadge({ level, size = "sm", className }: SkillBadgeProps) {
  if (level !== 1 && level !== 2 && level !== 3) return null

  const style = STYLE[level]
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold tabular-nums",
        size === "sm" ? "h-4 min-w-4 px-1 text-[10px]" : "h-5 min-w-5 px-1.5 text-xs",
        className,
      )}
      style={{ background: style.bg, color: style.color }}
      title={LABEL[level]}
      aria-label={`Livello ${level} — ${LABEL[level]}`}
    >
      L{level}
    </span>
  )
}

export const SKILL_LEVEL_LABELS = LABEL
