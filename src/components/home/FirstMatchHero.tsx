import Link from "next/link"
import { ArrowRight, Plus } from "lucide-react"

/**
 * First thing a new player sees: how many matches they could join right now,
 * and one button. With nothing open, the button creates one instead.
 */
export function FirstMatchHero({
  todayCount,
  weekCount,
  city,
}: {
  todayCount: number
  weekCount: number
  city: string | null
}) {
  const where = city ? `a ${city}` : "vicino a te"
  const title =
    todayCount > 0
      ? `${todayCount} ${todayCount === 1 ? "partita aperta" : "partite aperte"} oggi ${where}`
      : weekCount > 0
        ? `${weekCount} ${weekCount === 1 ? "partita aperta" : "partite aperte"} nei prossimi giorni`
        : `Nessuna partita in programma ${where}`
  const empty = weekCount === 0
  return (
    <section
      className="tone-play flex flex-col gap-2.5 rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-5"
      style={{ boxShadow: "inset 0 0 0 1px var(--accent-line)" }}
    >
      <p className="eyebrow text-[var(--accent)]">La tua prima partita</p>
      <h2 className="font-display text-[2.15rem] font-extrabold uppercase leading-none text-white">{title}</h2>
      <p className="text-base text-white/75">
        {empty
          ? "Creane una tu: avvisiamo noi chi è libero vicino a te."
          : "Scegli l'orario che ti va e sei dentro con un tocco."}
      </p>
      <Link
        href={empty ? "/sessions/new" : "/sessions"}
        className="pressable mt-1.5 flex min-h-[3.5rem] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-lg font-extrabold text-black"
      >
        {empty ? (
          <>
            <Plus className="h-5 w-5" aria-hidden="true" /> Crea la prima partita
          </>
        ) : (
          <>
            Scegli una partita <ArrowRight className="h-5 w-5" aria-hidden="true" />
          </>
        )}
      </Link>
    </section>
  )
}
