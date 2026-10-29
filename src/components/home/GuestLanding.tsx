import Link from "next/link"
import { Sparkles, ChevronRight, Download, HeartHandshake, Heart, Users } from "lucide-react"
import { SanderCardFut, type PlayerCardData } from "@/components/player/SanderCardFut"
import { CountUp } from "@/components/ui/CountUp"
import { TournamentSpotlight, type SpotlightTournament } from "./TournamentSpotlight"
import { WhySander } from "./WhySander"
import { CrestHeading } from "./Crest"
import { GuestWelcome } from "./GuestWelcome"
import { proofStats } from "@/lib/proofStats"

/* Three empty frames, one per tier: the card is shown, not someone's numbers. */
const TIERS = [1000, 1600, 2100].map(
  (glicko2): PlayerCardData => ({
    name: "",
    glicko2,
    nationalityCode: "",
    role: "DEFENDER",
    stats: { att: 0, dif: 0, ric: 0, mur: 0, alz: 0, sta: 0 },
  }),
)

/**
 * Landing for visitors: the welcome screen first (crest, cards, one promise,
 * one button), then for whoever scrolls the proof, the four answers a
 * newcomer is looking for, and the button again at the end.
 */
export function GuestLanding({
  stats,
  tournament,
}: {
  stats: { players: number; matches: number; comuni: number }
  tournament: SpotlightTournament | null
}) {
  const proof = proofStats(stats)
  return (
    <div className="flex flex-col gap-9">
      <GuestWelcome />

      {/* Proof, on the bar of the crest — only the figures worth showing. */}
      {proof.length > 0 && (
        <div
          className="rise-in grid divide-x divide-[var(--crest-hair)] border-y border-[var(--crest-hair)] py-4"
          style={{ "--i": 3, gridTemplateColumns: `repeat(${proof.length}, minmax(0, 1fr))` } as React.CSSProperties}
        >
          {proof.map((s) => (
            <div key={s.label} className="text-center">
              <CountUp value={s.n} className="num block text-4xl leading-none text-white" />
              <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <WhySander variant="guest" />

      {/* Scopri: the new way in — find someone to play with by swiping. */}
      <section className="flex flex-col gap-3" aria-labelledby="scopri-title">
        <CrestHeading id="scopri-title" eyebrow="Novità" title="Trova con chi giocare" />
        <Link
          href="/scopri"
          className="pressable relative flex min-h-[26rem] flex-col justify-end overflow-hidden rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-card)]"
          style={{
            background:
              "linear-gradient(180deg, rgb(0 0 0 / 0) 10%, rgb(0 0 0 / 0.55) 45%, rgb(0 0 0 / 0.9) 100%), url(/demo/players/sara-1.webp) center 25% / cover",
          }}
        >
          <HeartHandshake className="h-8 w-8 text-white" aria-hidden="true" />
          <p className="font-hand mt-2 text-[2.3rem] leading-tight text-white">Swipe, match, e sabato si gioca.</p>
          <ul className="mt-3 flex flex-col gap-1.5 text-base text-white/90">
            <li className="flex items-center gap-2"><Heart className="h-4 w-4" aria-hidden="true" /> Like su una foto o su una risposta, con un commento</li>
            <li className="flex items-center gap-2"><Sparkles className="h-4 w-4" aria-hidden="true" /> Ogni giorno il giocatore più compatibile con te</li>
            <li className="flex items-center gap-2"><Users className="h-4 w-4" aria-hidden="true" /> In coppia per sfidare le altre coppie nel 2v2</li>
          </ul>
          <span className="btn btn-secondary mt-4 gap-1 self-start">
            Scopri come funziona <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </span>
        </Link>
      </section>

      {/* After every match: the card is what you come back to. */}
      <section className="flex flex-col gap-3" aria-labelledby="card-title">
        <CrestHeading id="card-title" eyebrow="Dopo ogni partita" title="La tua carta cresce" />
        <div className="relative flex items-center gap-4 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-5 shadow-[var(--shadow-card)]">
          {/* Bronze, silver, gold fanned out like a hand of cards. */}
          <div aria-hidden="true" className="float-y relative h-[9.5rem] w-[10.5rem] shrink-0" style={{ filter: "drop-shadow(0 18px 24px rgb(0 0 0 / 0.55))" }}>
            {TIERS.map((t, i) => (
              <div
                key={t.glicko2}
                className="absolute top-0 w-[7.5rem]"
                style={{ left: `${i * 1.5}rem`, transform: `rotate(${(i - 1) * 9}deg)`, transformOrigin: "50% 100%", zIndex: i }}
              >
                <SanderCardFut playerData={t} blank cutout frameLoading="lazy" />
              </div>
            ))}
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
        className="pressable btn btn-primary min-h-[3.75rem] gap-2 text-lg"
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
              className="btn btn-secondary justify-between px-5"
            >
              {l.label}
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          ))}
        </div>
        <Link
          href="/scarica"
          className="btn btn-secondary w-full gap-2"
        >
          <Download className="h-5 w-5" aria-hidden="true" /> Scarica l&apos;app
        </Link>
      </section>
    </div>
  )
}
