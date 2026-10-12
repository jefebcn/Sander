import Link from "next/link"
import { Users, BellRing, Crown, Sparkles, ChevronRight, Download } from "lucide-react"
import { SanderCardFut, type PlayerCardData } from "@/components/player/SanderCardFut"
import { CountUp } from "@/components/ui/CountUp"
import { CITY_NAMES } from "@/lib/cities"
import { TournamentSpotlight, type SpotlightTournament } from "./TournamentSpotlight"

const DEMO_CARD: PlayerCardData = {
  name: "Il tuo nome",
  glicko2: 1620,
  nationalityCode: "IT",
  role: "DEFENDER",
  stats: { att: 78, dif: 84, ric: 81, mur: 62, alz: 74, sta: 80 },
}

/**
 * The real competitor is the beach's WhatsApp group, so say what it can't do.
 */
const WHY = [
  { icon: Users, title: "Vedi chi c'è e quanti posti mancano", text: "Niente più \"chi viene?\" scritto 40 volte nel gruppo." },
  { icon: BellRing, title: "Se qualcuno dà buca, il posto si riempie", text: "Entra il primo in lista d'attesa e gli arriva la notifica." },
  { icon: Crown, title: "Ogni partita conta", text: "Il tuo rating sale, e c'è una classifica per ogni bagno e ogni comune." },
]

/** Landing for visitors: one promise, one proof, one button. */
export function GuestLanding({
  stats,
  tournament,
}: {
  stats: { players: number; matches: number }
  tournament: SpotlightTournament | null
}) {
  return (
    <div className="flex flex-col gap-8">
      {/* Hero */}
      <section className="relative">
        <div className="rise-in" style={{ "--i": 0 } as React.CSSProperties}>
          <p className="eyebrow text-[var(--accent)]">Rimini · Riccione · Cervia · Cesenatico</p>
          <h1 className="mt-2 font-display text-[3.4rem] font-black uppercase leading-[0.86] tracking-tight text-white">
            Il beach
            <br />
            volley della
            <br />
            <span className="text-[var(--accent)]">Riviera.</span>
          </h1>
          <p className="mt-4 max-w-[21rem] text-lg leading-snug text-white/80">
            Il gruppo WhatsApp del beach volley, ma che si organizza da solo: trovi la partita, ti unisci in un
            tocco, e ogni vittoria ti fa salire in classifica.
          </p>
        </div>
      </section>

      {/* CTAs */}
      <div className="rise-in flex flex-col gap-2.5" style={{ "--i": 1 } as React.CSSProperties}>
        <Link
          href="/auth/signin?mode=register"
          className="pressable flex min-h-[3.75rem] items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] text-lg font-extrabold text-black shadow-[var(--shadow-glow)]"
        >
          <Sparkles className="h-5 w-5" aria-hidden="true" /> Crea la tua carta gratis
        </Link>
        <Link
          href="/auth/signin"
          className="flex min-h-[3.5rem] items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-2)] text-base font-bold text-white"
        >
          Ho già un account
        </Link>
      </div>

      {/* The card is the hook: give it room instead of squeezing it beside the headline. */}
      <section
        className="rise-in relative flex items-center gap-5 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-5"
        style={{ "--i": 2 } as React.CSSProperties}
      >
        <div
          aria-hidden="true"
          className="sun-drift pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full"
          style={{ background: "radial-gradient(circle, color-mix(in srgb, var(--accent) 22%, transparent) 0%, transparent 65%)" }}
        />
        <div aria-hidden="true" className="relative w-[10.5rem] shrink-0">
          <div className="float-y" style={{ filter: "drop-shadow(0 18px 24px rgb(0 0 0 / 0.55))" }}>
            <SanderCardFut playerData={DEMO_CARD} />
          </div>
        </div>
        <div className="relative min-w-0">
          <p className="eyebrow text-[var(--accent)]">La tua carta</p>
          <p className="mt-1 font-display text-2xl font-extrabold uppercase leading-none text-white">Bronzo, argento, oro.</p>
          <p className="mt-2 text-sm text-[var(--muted-text)]">Ogni partita aggiorna il rating e la cornice. Condividila nelle storie.</p>
        </div>
      </section>

      {/* Proof */}
      <div className="rise-in grid grid-cols-3 gap-2" style={{ "--i": 3 } as React.CSSProperties}>
        {[
          { n: stats.players, label: "Giocatori" },
          { n: stats.matches, label: "Partite" },
          { n: CITY_NAMES.length, label: "Comuni" },
        ].map((s) => (
          <div key={s.label} className="rounded-[var(--radius-lg)] bg-[var(--surface-2)] px-2 py-4 text-center">
            <CountUp value={s.n} className="num block text-3xl leading-none text-[var(--accent)]" />
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Why not just the WhatsApp group? */}
      <section className="flex flex-col gap-3">
        <div>
          <p className="eyebrow text-[var(--accent)]">Perché SANDER</p>
          <h2 className="font-display text-2xl font-extrabold uppercase leading-none text-white">
            Più del solito gruppo WhatsApp
          </h2>
        </div>
        <ul className="flex flex-col gap-2">
          {WHY.map((w, i) => (
            <li
              key={w.title}
              className="rise-in flex items-start gap-4 rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-4"
              style={{ "--i": i + 4 } as React.CSSProperties}
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--accent-soft)]">
                <w.icon className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-base font-extrabold leading-snug text-white">{w.title}</span>
                <span className="block text-sm text-[var(--muted-text)]">{w.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {tournament && <TournamentSpotlight t={tournament} />}

      {/* Look around without an account */}
      <section className="flex flex-col gap-2">
        <p className="eyebrow text-[var(--muted-text)]">Dai un&apos;occhiata</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { href: "/players", label: "Classifica" },
            { href: "/bagni", label: "Re dei Bagni" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex min-h-[3.5rem] items-center justify-between rounded-[var(--radius-lg)] bg-[var(--surface-2)] px-4 text-base font-bold text-white"
            >
              {l.label}
              <ChevronRight className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            </Link>
          ))}
        </div>
        <Link
          href="/scarica"
          className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-[var(--border)] text-base font-bold text-white"
        >
          <Download className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" /> Scarica l&apos;app
        </Link>
      </section>
    </div>
  )
}
