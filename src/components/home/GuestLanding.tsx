import Link from "next/link"
import { Sparkles, ChevronRight, Download, HeartHandshake, Heart, Users } from "lucide-react"
import { SanderCardFut, type PlayerCardData } from "@/components/player/SanderCardFut"
import { CountUp } from "@/components/ui/CountUp"
import { CITY_NAMES } from "@/lib/cities"
import { TournamentSpotlight, type SpotlightTournament } from "./TournamentSpotlight"
import { WhySander } from "./WhySander"
import { CrestHeading } from "./Crest"
import { GuestWelcome } from "./GuestWelcome"

const DEMO_CARD: PlayerCardData = {
  name: "Il tuo nome",
  glicko2: 1620,
  nationalityCode: "IT",
  role: "DEFENDER",
  stats: { att: 78, dif: 84, ric: 81, mur: 62, alz: 74, sta: 80 },
}

/**
 * Landing for visitors: the welcome screen first (crest, cards, one promise,
 * one button), then for whoever scrolls the proof, the four answers a
 * newcomer is looking for, and the button again at the end.
 */
export function GuestLanding({
  stats,
  tournament,
}: {
  stats: { players: number; matches: number }
  tournament: SpotlightTournament | null
}) {
  return (
    <div className="flex flex-col gap-9">
      <GuestWelcome />

      {/* Proof, on the bar of the crest */}
      <div
        className="rise-in grid grid-cols-3 divide-x divide-[var(--crest-hair)] border-y border-[var(--crest-hair)] py-4"
        style={{ "--i": 3 } as React.CSSProperties}
      >
        {[
          { n: stats.players, label: "Giocatori" },
          { n: stats.matches, label: "Partite" },
          { n: CITY_NAMES.length, label: "Comuni" },
        ].map((s) => (
          <div key={s.label} className="text-center">
            <CountUp value={s.n} className="num block text-4xl leading-none text-white" />
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">{s.label}</p>
          </div>
        ))}
      </div>

      <WhySander variant="guest" />

      {/* Scopri: the new way in — find someone to play with by swiping. */}
      <section className="flex flex-col gap-3" aria-labelledby="scopri-title">
        <CrestHeading id="scopri-title" eyebrow="Novità" title="Trova con chi giocare" />
        <Link
          href="/scopri"
          className="pressable relative block overflow-hidden rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-card)]"
          style={{ background: "linear-gradient(140deg, color-mix(in srgb, var(--accent) 34%, var(--surface-2)), color-mix(in srgb, var(--love) 14%, var(--surface-2)) 75%)" }}
        >
          <HeartHandshake className="h-8 w-8 text-white" aria-hidden="true" />
          <p className="font-hand mt-2 text-[2.3rem] leading-tight text-white">Swipe, match, e sabato si gioca.</p>
          <ul className="mt-3 flex flex-col gap-1.5 text-base text-white/90">
            <li className="flex items-center gap-2"><Heart className="h-4 w-4" aria-hidden="true" /> Like su una foto o su una risposta, con un commento</li>
            <li className="flex items-center gap-2"><Sparkles className="h-4 w-4" aria-hidden="true" /> Ogni giorno il giocatore più compatibile con te</li>
            <li className="flex items-center gap-2"><Users className="h-4 w-4" aria-hidden="true" /> In coppia per sfidare le altre coppie nel 2v2</li>
          </ul>
          <span className="mt-4 flex min-h-[3.5rem] items-center justify-center gap-1 rounded-full bg-white text-base font-extrabold text-black">
            Scopri come funziona <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </span>
        </Link>
      </section>

      {/* After every match: the card is what you come back to. */}
      <section className="flex flex-col gap-3" aria-labelledby="card-title">
        <CrestHeading id="card-title" eyebrow="Dopo ogni partita" title="La tua carta cresce" />
        <div className="relative flex items-center gap-5 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-5 ring-1 ring-[var(--crest-hair)]">
          <div aria-hidden="true" className="relative w-[10rem] shrink-0">
            <div className="float-y" style={{ filter: "drop-shadow(0 18px 24px rgb(0 0 0 / 0.55))" }}>
              <SanderCardFut playerData={DEMO_CARD} frameLoading="lazy" />
            </div>
          </div>
          <div className="relative min-w-0">
            <p className="font-hand text-[1.9rem] leading-none text-white">
              Bronzo, argento, <span className="text-[var(--accent)]">oro.</span>
            </p>
            <p className="mt-2 text-sm text-[var(--muted-text)]">
              Ogni risultato muove il rating, e salendo cambi cornice. Vinci e condividila nelle storie.
            </p>
          </div>
        </div>
      </section>

      {tournament && <TournamentSpotlight t={tournament} />}

      <Link
        href="/auth/signin?mode=register"
        className="pressable flex min-h-[3.75rem] items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-lg font-extrabold text-black"
      >
        <Sparkles className="h-5 w-5" aria-hidden="true" /> Crea la tua carta gratis
      </Link>

      {/* Look around without an account */}
      <section className="flex flex-col gap-2" aria-labelledby="look-title">
        <p id="look-title" className="eyebrow text-[var(--muted-text)]">Dai un&apos;occhiata</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: "/players", label: "Classifica" },
            { href: "/bagni", label: "Re dei Bagni" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex min-h-[3.5rem] items-center justify-between rounded-[var(--radius-lg)] bg-[var(--surface-2)] px-4 text-base font-bold text-white ring-1 ring-[var(--crest-hair)]"
            >
              {l.label}
              <ChevronRight className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            </Link>
          ))}
        </div>
        <Link
          href="/scarica"
          className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-[var(--radius-lg)] text-base font-bold text-white ring-1 ring-[var(--crest-hair)]"
        >
          <Download className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" /> Scarica l&apos;app
        </Link>
      </section>
    </div>
  )
}
