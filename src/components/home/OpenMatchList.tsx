import Link from "next/link"
import { formatTime, daysFromNow, formatDayShort } from "@/lib/datetime"
import { FORMAT_SHORT, matchPriceLabel, type HomeMatch } from "@/lib/homeMatches"

/** Short list of joinable matches: time, place, price, seats. One tap opens it. */
export function OpenMatchList({ title, matches }: { title: string; matches: HomeMatch[] }) {
  if (matches.length === 0) return null
  return (
    <section className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-extrabold text-white">{title}</h2>
        <Link href="/sessions" className="flex min-h-[2.75rem] items-center text-base font-bold text-[var(--accent)]">
          Vedi tutte
        </Link>
      </div>
      <ul className="flex flex-col gap-2.5">
        {matches.map((m) => {
          const today = daysFromNow(m.date) === 0
          const day = formatDayShort(m.date).split(" ").slice(0, 2).join(" ")
          const urgent = m.spotsLeft === 1
          return (
            <li key={m.id}>
              <Link
                href={`/sessions/${m.id}`}
                className="pressable flex min-h-[4.5rem] items-center gap-3.5 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4"
              >
                <span className="min-w-[4.25rem] font-display text-[1.65rem] font-extrabold capitalize leading-none text-white">
                  {today ? formatTime(m.date) : day}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold text-white">
                    {m.location}
                    {!today && <span className="font-semibold text-white/70"> · {formatTime(m.date)}</span>}
                  </span>
                  <span className="block truncate text-sm text-[var(--muted-text)]">
                    {FORMAT_SHORT[m.format]} · {matchPriceLabel(m.paymentType, m.quotaAmount)}
                  </span>
                </span>
                <span
                  className="shrink-0 rounded-full px-2.5 py-1 text-sm font-extrabold"
                  style={
                    urgent
                      ? { background: "color-mix(in srgb, var(--compete) 16%, transparent)", color: "var(--compete)" }
                      : { background: "var(--accent-soft)", color: "var(--accent)" }
                  }
                >
                  {urgent ? "Manca 1" : `${m.spotsLeft} posti`}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
