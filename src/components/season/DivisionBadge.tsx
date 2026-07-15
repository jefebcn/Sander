import type { Division } from "@/lib/divisions"

interface Props {
  division: Division
  size?: number
  /** Show the division name under the emblem. */
  showName?: boolean
}

/** A glowing shield emblem tinted with the division color. Pure/server-safe. */
export function DivisionBadge({ division, size = 120, showName = false }: Props) {
  const c = division.color
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Outer glow */}
        <div
          className="absolute inset-0 rounded-[28%]"
          style={{ background: c, opacity: 0.18, filter: "blur(18px)" }}
        />
        {/* Ring */}
        <div
          className="absolute inset-0 rounded-[28%]"
          style={{
            background: `conic-gradient(from 210deg, ${c}, transparent 55%, ${c})`,
            padding: size * 0.045,
          }}
        >
          {/* Inner face */}
          <div
            className="flex h-full w-full items-center justify-center rounded-[26%]"
            style={{
              background: "linear-gradient(160deg, #14181a 0%, #0a0c0d 100%)",
              boxShadow: `inset 0 0 ${size * 0.25}px ${c}22`,
            }}
          >
            <span style={{ fontSize: size * 0.42, lineHeight: 1 }}>{division.emoji}</span>
          </div>
        </div>
      </div>
      {showName && (
        <span
          className="text-sm font-black uppercase tracking-widest"
          style={{ color: c }}
        >
          {division.name}
        </span>
      )}
    </div>
  )
}
