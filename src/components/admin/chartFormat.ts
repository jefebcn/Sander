/* Axis scale and number formats shared by the admin charts. */

export type Unit = "count" | "euro"

/** Ticks from 0 to a round top (1/2/5 steps, about four of them).
 *  Counts never get fractional steps: "0,5 iscritti" is not a thing. */
export function niceTicks(max: number, unit: Unit): number[] {
  const raw = Math.max(max, unit === "count" ? 4 : 1) / 4
  const pow = 10 ** Math.floor(Math.log10(raw))
  const r = raw / pow
  let step = (r <= 1 ? 1 : r <= 2 ? 2 : r <= 5 ? 5 : 10) * pow
  if (unit === "count") step = Math.max(1, Math.round(step))
  const top = Math.ceil(max / step) * step || step * 4
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step)
}

const whole = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 0 })
const oneDecimal = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 1 })
const euro = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })

/** Full value, for tooltips and tables: 1.284 · 1.284 €. */
export function formatValue(value: number, unit: Unit): string {
  return unit === "euro" ? euro.format(value) : whole.format(value)
}

/** Short value, for axis ticks: 1,2k · 1,2k €. */
export function formatTick(value: number, unit: Unit): string {
  const short = value >= 1000 ? `${oneDecimal.format(value / 1000)}k` : whole.format(value)
  return unit === "euro" ? `${short} €` : short
}
