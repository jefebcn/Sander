import Link from "next/link"
import { formatTime } from "@/lib/datetime"
import { FORMAT_SHORT, matchPriceLabel, type HomeMatch } from "@/lib/homeMatches"
import { dayWord } from "./NextMatchCard"

/** One open match a single player away from happening: the most useful tap on the screen. */
export function MissingPlayerCard({ match }: { match: HomeMatch }) {
  // "Stasera 19:00" reads better than "Oggi 19:00" for an evening match.
  const day = dayWord(match.date)
  const evening = Number(formatTime(match.date).slice(0, 2)) >= 17
  const whenLabel = day === "Oggi" && evening ? "Stasera" : day
  return (
    <section
      className="flex flex-col gap-2 rounded-[var(--radius-lg)] p-[1.125rem]"
      style={{
        background: "color-mix(in srgb, var(--compete) 10%, transparent)",
        boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--compete) 40%, transparent)",
      }}
    >
      <p className="eyebrow flex items-center gap-2 text-[var(--compete)]">
        <span className="h-2 w-2 rounded-full bg-[var(--compete)]" aria-hidden="true" />
        Manca 1 giocatore
      </p>
      <p className="text-xl font-extrabold text-white">
        {whenLabel} {formatTime(match.date)} · {match.location}
      </p>
      <p className="text-base text-white/75">
        {[match.cityName, FORMAT_SHORT[match.format], matchPriceLabel(match.paymentType, match.quotaAmount)]
          .filter(Boolean)
          .join(" · ")}
      </p>
      <Link
        href={`/sessions/${match.id}`}
        className="pressable mt-1 flex min-h-[3.25rem] items-center justify-center rounded-[var(--radius-md)] bg-[var(--compete)] text-base font-extrabold text-black"
      >
        Entra nella partita
      </Link>
    </section>
  )
}
