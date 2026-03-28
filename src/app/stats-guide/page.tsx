import Link from "next/link"
import {
  ChevronLeft,
  Zap, Shield, Square, ArrowUp, Radio, Activity,
  Star, BarChart2, Trophy, ClipboardList, TrendingUp,
} from "lucide-react"

export default function StatsGuidePage() {
  return (
    <div className="flex flex-col min-h-dvh pb-10" style={{ background: "var(--background)" }}>

      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pt-5 pb-4"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.25rem)" }}
      >
        <Link
          href="/profile"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-white"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white leading-tight">Guida ai parametri</h1>
          <p className="text-xs text-[var(--muted-text)]">Come vengono calcolati i tuoi stats</p>
        </div>
      </div>

      <div className="px-4 space-y-4">

        {/* Intro */}
        <div
          className="rounded-2xl p-4"
          style={{ background: "rgba(201,243,29,0.06)", border: "1px solid rgba(201,243,29,0.15)" }}
        >
          <p className="text-sm text-white leading-relaxed">
            La tua card si basa su <strong className="text-[var(--accent)]">due elementi</strong>:
            il rating <strong className="text-[var(--accent)]">Glicko-2</strong> (oggettivo, calcolato automaticamente)
            e la <strong className="text-[var(--accent)]">distribuzione percentuale</strong> che scegli tu per le 6 statistiche.
          </p>
        </div>

        {/* Section: Glicko-2 overall */}
        <SectionTitle>Overall — Glicko-2</SectionTitle>

        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between">
            <p className="font-black text-white text-base">GLICKO-2</p>
            <span className="text-2xl font-black" style={{ color: "var(--accent)" }}>OVR</span>
          </div>
          <p className="text-sm text-[var(--muted-text)] leading-relaxed">
            Il numero grande in alto a sinistra della tua card è il tuo <strong className="text-white">rating Glicko-2</strong>.
            È l&apos;unico valore completamente oggettivo — non lo puoi impostare, viene calcolato automaticamente
            in base alle tue vittorie e sconfitte nei tornei.
          </p>
          <div className="space-y-2">
            {[
              { label: "Partenza", value: "1500" },
              { label: "Principiante", value: "< 1200" },
              { label: "Medio", value: "1200 – 1800" },
              { label: "Avanzato", value: "1800 – 2200" },
              { label: "Élite", value: "2200+" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted-text)]">{label}</span>
                <span className="text-sm font-black text-white">{value}</span>
              </div>
            ))}
          </div>
          <div
            className="rounded-xl p-3 text-xs leading-relaxed"
            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)" }}
          >
            <span className="text-white font-semibold">Come cresce:</span> Batti avversari con Glicko-2 più alto del tuo
            per guadagnare più punti. Perdere contro giocatori più deboli ti penalizza di più.
          </div>
        </div>

        {/* Section: Formula */}
        <SectionTitle>Formula delle statistiche</SectionTitle>

        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="font-black text-white text-base">Come si calcola ogni stat</p>
          <div
            className="rounded-xl p-4 text-center"
            style={{ background: "rgba(201,243,29,0.08)", border: "1px solid rgba(201,243,29,0.2)" }}
          >
            <p className="text-xs text-[var(--muted-text)] mb-1 uppercase tracking-wider">Formula</p>
            <p className="text-lg font-black text-white">
              Glicko-2 ÷ 40 + %
            </p>
          </div>
          <p className="text-sm text-[var(--muted-text)] leading-relaxed">
            Ogni statistica dipende dal tuo Glicko-2 (base fissa) più la percentuale che hai assegnato a quella stat.
            Le 6 percentuali devono sempre sommare a <strong className="text-white">100</strong>.
          </p>

          {/* Examples table */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
              Esempi pratici
            </p>
            <div className="overflow-hidden rounded-xl" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
              {[
                { glicko: "1500", pct: "0%",  result: "38", note: "base minima" },
                { glicko: "1500", pct: "17%", result: "55", note: "bilanciato" },
                { glicko: "1500", pct: "30%", result: "68", note: "specializzato" },
                { glicko: "2000", pct: "17%", result: "67", note: "bilanciato avanzato" },
                { glicko: "2400", pct: "30%", result: "90", note: "élite specializzato" },
                { glicko: "2400", pct: "39%", result: "99", note: "massimo raggiungibile" },
              ].map(({ glicko, pct, result, note }, i) => (
                <div
                  key={i}
                  className="grid grid-cols-4 items-center px-3 py-2.5 text-sm"
                  style={{
                    borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.06)" : undefined,
                    background: i % 2 === 0 ? "rgba(255,255,255,0.02)" : undefined,
                  }}
                >
                  <span className="font-bold text-[var(--accent)]">{glicko}</span>
                  <span className="text-[var(--muted-text)]">{pct}</span>
                  <span className="font-black text-white">{result}</span>
                  <span className="text-xs text-[var(--muted-text)]">{note}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--muted-text)]">Glicko · % assegnata · Valore · Nota</p>
          </div>
        </div>

        {/* Section: Distribution */}
        <SectionTitle>Distribuzione percentuale</SectionTitle>

        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="font-black text-white text-base">Come distribuire le % tra le 6 stat</p>
          <p className="text-sm text-[var(--muted-text)] leading-relaxed">
            Dal tuo <strong className="text-white">Profilo</strong> puoi spostare liberamente le percentuali tra le
            statistiche con slider e campi numerici. La somma deve essere esattamente 100.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div
              className="rounded-xl p-3 space-y-1"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <p className="text-xs font-bold text-white">Giocatore bilanciato</p>
              <p className="text-[0.65rem] text-[var(--muted-text)]">17–17–17–17–16–16</p>
              <p className="text-xs text-[var(--muted-text)]">Tutte le stat uguali. Nessun punto debole evidente.</p>
            </div>
            <div
              className="rounded-xl p-3 space-y-1"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <p className="text-xs font-bold text-white">Specialista attacco</p>
              <p className="text-[0.65rem] text-[var(--muted-text)]">35–10–15–15–15–10</p>
              <p className="text-xs text-[var(--muted-text)]">ATT molto alto, DIF e STA sacrificate.</p>
            </div>
          </div>

          <div
            className="rounded-xl p-3 text-xs leading-relaxed"
            style={{ background: "rgba(201,243,29,0.06)", color: "rgba(255,255,255,0.55)" }}
          >
            <span className="text-[var(--accent)] font-semibold">Nota:</span> Le percentuali servono
            anche a trovare compagni e avversari compatibili. Mostra i tuoi punti di forza reali.
          </div>
        </div>

        {/* Section: Stats di gioco */}
        <SectionTitle>Le 6 statistiche</SectionTitle>

        {[
          { icon: Zap,      abbr: "ATT", fullName: "Attacco",    color: "#f97316", desc: "La tua capacità offensiva. Quanto sei efficace nel fare punti e creare occasioni per la squadra." },
          { icon: Shield,   abbr: "DIF", fullName: "Difesa",     color: "#3b82f6", desc: "La tua solidità difensiva. Capacità di coprire il campo e limitare i punti degli avversari." },
          { icon: Square,   abbr: "MUR", fullName: "Muro",       color: "#a855f7", desc: "La tua abilità a muro. Blocco a rete e lettura degli attacchi avversari." },
          { icon: ArrowUp,  abbr: "ALZ", fullName: "Alzata",     color: "#06b6d4", desc: "La qualità della tua alzata. Visione di gioco e precisione nel servire l'attaccante." },
          { icon: Radio,    abbr: "RIC", fullName: "Ricezione",  color: "#22c55e", desc: "La tua efficacia in ricezione. Qualità nella presa del servizio avversario." },
          { icon: Activity, abbr: "STA", fullName: "Stamina",    color: "#f59e0b", desc: "La tua resistenza fisica. Capacità di mantenere il rendimento lungo tutta la partita." },
        ].map(({ icon: Icon, abbr, fullName, color, desc }) => (
          <div
            key={abbr}
            className="flex items-center gap-4 rounded-2xl p-4"
            style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div
              className="flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: `${color}22` }}
            >
              <Icon className="h-5 w-5" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 mb-0.5">
                <span className="text-xl font-black text-white">{abbr}</span>
                <span className="text-sm font-semibold" style={{ color }}>{fullName}</span>
              </div>
              <p className="text-xs text-[var(--muted-text)] leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}

        {/* Section: Stats personali */}
        <SectionTitle>Statistiche personali</SectionTitle>

        <SimpleStatCard
          icon={Star}
          abbr="PLA"
          fullName="Partite Giocate"
          color="var(--accent)"
          description="Il numero totale di sessioni di beach volley a cui hai partecipato su Sander."
          howUpdated="Aumenta automaticamente ogni volta che partecipi a una sessione completata."
        />

        <SimpleStatCard
          icon={BarChart2}
          abbr="AVG"
          fullName="Media Voti"
          color="var(--accent)"
          description='La media dei voti che hai ricevuto dagli altri giocatori, su scala da 1.0 a 10.0. "—" significa che non hai ancora ricevuto voti.'
          howUpdated="I giocatori ti votano Super (10), Top (7) o Flop (3) dopo ogni sessione. La media è calcolata su tutti i voti ricevuti nel tempo."
        />

        <SimpleStatCard
          icon={Trophy}
          abbr="MotM"
          fullName="Man of the Match"
          color="#facc15"
          description="Quante volte sei stato eletto MVP della partita dai tuoi compagni. È il riconoscimento più alto che puoi ricevere in una sessione."
          howUpdated="Assegnato automaticamente al termine di una sessione a chi riceve il maggior numero di voti Super."
        />

        <SimpleStatCard
          icon={ClipboardList}
          abbr="ORG"
          fullName="Organizzate"
          color="var(--accent)"
          description="Il numero di sessioni di beach volley che hai creato e organizzato per la community."
          howUpdated="Aumenta ogni volta che organizzi una sessione che viene poi completata."
        />

        {/* Section: Streak */}
        <SectionTitle>Streak e forma</SectionTitle>

        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
              style={{ background: "rgba(239,68,68,0.15)" }}
            >
              <TrendingUp className="h-5 w-5" style={{ color: "#ef4444" }} />
            </div>
            <div>
              <p className="font-black text-white text-base">STREAK</p>
              <p className="text-xs text-[var(--muted-text)]">Forma recente</p>
            </div>
          </div>
          <p className="text-sm text-[var(--muted-text)] leading-relaxed">
            La barra Streak mostra quante sessioni hai giocato nelle <strong className="text-white">ultime 4 settimane</strong> (massimo 10).
            Va dal rosso (inattivo) al verde (in forma), con il numero a destra che indica le sessioni recenti.
          </p>
          <div
            className="rounded-xl p-3 text-xs text-[var(--muted-text)]"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <span className="text-white font-semibold">Come mantenerla alta:</span> gioca almeno 2–3 sessioni al mese per restare nella zona verde.
          </div>
        </div>

      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="pt-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
      {children}
    </p>
  )
}

function SimpleStatCard({
  icon: Icon, abbr, fullName, color, description, howUpdated,
}: {
  icon: React.ElementType
  abbr: string
  fullName: string
  color: string
  description: string
  howUpdated: string
}) {
  return (
    <div
      className="rounded-2xl p-4 space-y-2"
      style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0"
          style={{ background: "rgba(201,243,29,0.1)" }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-xl font-black text-white">{abbr}</span>
          <span className="text-sm font-semibold text-[var(--muted-text)]">{fullName}</span>
        </div>
      </div>
      <p className="text-sm text-[var(--muted-text)] leading-relaxed">{description}</p>
      <div
        className="rounded-xl p-3 text-xs leading-relaxed"
        style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)" }}
      >
        <span className="text-white font-semibold">Aggiornamento:</span> {howUpdated}
      </div>
    </div>
  )
}
