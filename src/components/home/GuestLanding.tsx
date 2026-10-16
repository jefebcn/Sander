import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Check, Users, Trophy, type LucideIcon } from "lucide-react"
import { TournamentSpotlight, type SpotlightTournament } from "./TournamentSpotlight"

/** Three reasons, in the words people use on the beach. */
const WHY: { icon: LucideIcon; text: string; tone: string }[] = [
  { icon: Check, text: "Entri in una partita con 2 tocchi", tone: "var(--accent)" },
  { icon: Users, text: "Ti avvisiamo quando manca un giocatore", tone: "var(--social)" },
  { icon: Trophy, text: "Sali in classifica nel tuo comune", tone: "var(--compete)" },
]

/** Landing for visitors: one promise, three reasons, one button. */
export function GuestLanding({
  todayOpen,
  tournament,
}: {
  todayOpen: number
  tournament: SpotlightTournament | null
}) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex min-h-[3rem] items-center gap-2.5">
        <Image src="/sander-logo.png" alt="" width={36} height={36} className="object-contain" priority />
        <span className="font-display text-[1.75rem] font-extrabold uppercase tracking-wide text-white">Sander</span>
        <Link
          href="/auth/signin"
          className="ml-auto flex min-h-[2.75rem] items-center rounded-full bg-white/10 px-4 text-base font-bold text-white"
        >
          Accedi
        </Link>
      </header>

      {/* Sunset over the sea: the moment people actually play. */}
      <div aria-hidden="true" className="relative -mx-4 h-44 overflow-hidden">
        <div
          className="sun-drift absolute bottom-[-4.5rem] left-1/2 -ml-[5.5rem] h-44 w-44 rounded-full"
          style={{ background: "radial-gradient(circle at 50% 35%, #ffd08a 0%, var(--sunset) 55%, var(--sunset-deep) 100%)" }}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-16"
          style={{ background: "var(--sea-deep)", borderTop: "1px solid color-mix(in srgb, var(--sunset) 50%, transparent)" }}
        />
        <div className="absolute inset-x-[23%] bottom-11 h-[3px] rounded-full" style={{ background: "color-mix(in srgb, var(--sunset) 55%, transparent)" }} />
        <div className="absolute inset-x-[33%] bottom-7 h-[3px] rounded-full" style={{ background: "color-mix(in srgb, var(--sunset) 35%, transparent)" }} />
        <div className="absolute inset-x-[42%] bottom-3.5 h-[3px] rounded-full" style={{ background: "color-mix(in srgb, var(--sunset) 20%, transparent)" }} />
      </div>

      <section className="rise-in flex flex-col gap-3" style={{ "--i": 0 } as React.CSSProperties}>
        <p className="eyebrow text-[var(--sunset)]">Beach volley in Riviera</p>
        <h1 className="font-display text-[2.9rem] font-extrabold uppercase leading-[0.95] text-white">
          Trova una partita.
          <br />
          Anche stasera.
        </h1>
        <p className="text-lg leading-snug text-white/80">
          Partite aperte nei bagni vicino a te, con gente del tuo livello.
        </p>
      </section>

      <ul className="rise-in flex flex-col gap-2.5" style={{ "--i": 1 } as React.CSSProperties}>
        {WHY.map(({ icon: Icon, text, tone }) => (
          <li key={text} className="flex items-center gap-3 text-base font-semibold text-white">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.65rem]"
              style={{ background: `color-mix(in srgb, ${tone} 14%, transparent)`, color: tone }}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            {text}
          </li>
        ))}
      </ul>

      <div className="rise-in flex flex-col gap-2" style={{ "--i": 2 } as React.CSSProperties}>
        <Link
          href="/auth/signin?mode=register"
          className="pressable flex min-h-[3.625rem] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-lg font-extrabold text-black"
        >
          Inizia gratis <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
        <Link href="/sessions" className="flex min-h-[3.25rem] items-center justify-center text-base font-semibold text-white">
          {todayOpen > 0
            ? `Prima guarda ${todayOpen === 1 ? "la partita" : `le ${todayOpen} partite`} di oggi`
            : "Prima guarda le partite in programma"}
        </Link>
        <p className="text-center text-sm text-[var(--muted-text)]">Gratis · Ti iscrivi con Google in 10 secondi</p>
      </div>

      {tournament && (
        <div className="rise-in" style={{ "--i": 3 } as React.CSSProperties}>
          <TournamentSpotlight t={tournament} />
        </div>
      )}
    </div>
  )
}
