interface Props {
  value: number // 0–100
  size?: number
}

function color(v: number): string {
  if (v >= 80) return "#22c55e"
  if (v >= 55) return "#c9f31d"
  if (v >= 30) return "#eab308"
  return "#f97316"
}

/** Circular compatibility gauge (conic-gradient). Server-safe. */
export function CompatibilityRing({ value, size = 48 }: Props) {
  const c = color(value)
  const thickness = size * 0.12
  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-full"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(${c} ${value * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
      }}
    >
      <div
        className="flex items-center justify-center rounded-full bg-[var(--surface-1)]"
        style={{ width: size - thickness * 2, height: size - thickness * 2 }}
      >
        <span className="text-xs font-black" style={{ color: c }}>
          {value}
        </span>
      </div>
    </div>
  )
}
