/**
 * An integer that counts up from 0 when it first appears.
 * Pure CSS (an animated @property counter): no JS, no flash of the wrong
 * number, and reduced-motion users just see the final value. Browsers without
 * @property jump straight to the value.
 */
export function CountUp({ value, className }: { value: number; className?: string }) {
  const n = Math.max(0, Math.round(value))
  return (
    <span className={className}>
      <span className="count-up" style={{ "--to": n } as React.CSSProperties} aria-hidden="true" />
      <span className="sr-only">{n}</span>
    </span>
  )
}
