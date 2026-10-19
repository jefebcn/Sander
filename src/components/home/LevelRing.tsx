import { resizedPhoto } from "@/lib/photo"

/**
 * Avatar wrapped in an XP ring that draws itself on load (CSS, no JS), with
 * the level on a chip underneath. pathLength=100 makes the dash offset the
 * percentage directly.
 */
export function LevelRing({
  level,
  pct,
  avatarUrl,
  initials,
  size = 84,
}: {
  level: number
  pct: number
  avatarUrl?: string | null
  initials: string
  size?: number
}) {
  const offset = 100 - Math.max(3, Math.min(100, pct))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 80 80" className="absolute inset-0 h-full w-full -rotate-90 overflow-visible" aria-hidden="true">
        <circle cx="40" cy="40" r="37" fill="none" stroke="var(--surface-4)" strokeWidth="4.5" />
        <circle
          cx="40"
          cy="40"
          r="37"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="4.5"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray="100"
          strokeDashoffset={offset}
          className="ring-draw"
          style={{ filter: "drop-shadow(0 0 5px color-mix(in srgb, var(--accent) 60%, transparent))" }}
        />
      </svg>
      <div className="absolute inset-[9px] overflow-hidden rounded-full bg-[var(--surface-4)]">
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={resizedPhoto(avatarUrl, "thumb")} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-display text-2xl font-extrabold text-white/80">
            {initials}
          </span>
        )}
      </div>
      <span className="num absolute -bottom-1.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--accent)] px-2 py-0.5 text-sm leading-none text-black ring-2 ring-[var(--surface-1)]">
        LIV {level}
      </span>
    </div>
  )
}
