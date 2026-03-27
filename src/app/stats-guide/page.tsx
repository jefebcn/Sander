import Link from "next/link"
import { ChevronLeft, Zap, Shield, Sparkles, Users, Star, BarChart2, Trophy, ClipboardList, TrendingUp } from "lucide-react"

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
            I tuoi parametri si aggiornano <strong className="text-[var(--accent)]">automaticamente</strong> dopo ogni sessione,
            torneo e votazione. Più giochi e ricevi valutazioni positive, più i tuoi stats crescono.
          </p>
        </div>

        {/* Section: Stats tecnici */}
        <SectionTitle>Statistiche di gioco</SectionTitle>

        <StatCard
          icon={Zap}
          abbr="ATT"
          fullName="Attacco"
          color="#f97316"
          description="Misura la tua capacità offensiva: quanto sei efficace nel segnare punti e vincere le partite."
          formula={[
            { pct: "70%", label: "Media voti ricevuti" },
            { pct: "30%", label: "Percentuale di vittorie" },
          ]}
          tip="Vinci partite e fatti votare bene per far crescere l'ATT."
        />

        <StatCard
          icon={Shield}
          abbr="DIF"
          fullName="Difesa"
          color="#3b82f6"
          description="Rappresenta la tua solidità e consistenza in campo. Pochi errori gravi (flop) = alta DIF."
          formula={[
            { pct: "50%", label: "Media voti ricevuti" },
            { pct: "30%", label: "Percentuale di vittorie" },
            { pct: "20%", label: "Bonus base, ridotto dai voti Flop" },
          ]}
          tip="Ogni voto Flop che ricevi riduce la tua DIF. Gioca pulito!"
          warning="I voti Flop possono abbassare questo parametro fino a -20 punti."
        />

        <StatCard
          icon={Sparkles}
          abbr="SKL"
          fullName="Tecnica"
          color="#a855f7"
          description="Il tuo livello tecnico reale, basato principalmente sul rating Glicko-2 che si aggiorna partita dopo partita in base alla forza degli avversari."
          formula={[
            { pct: "65%", label: "Rating Glicko-2 (sistema ELO avanzato)" },
            { pct: "35%", label: "Media voti ricevuti" },
          ]}
          tip="La SKL cresce battendo avversari più forti di te."
        />

        <StatCard
          icon={Users}
          abbr="SOC"
          fullName="Socialità"
          color="#22c55e"
          description="Quanto sei presente nella community: partecipazione alle sessioni e sessioni organizzate."
          formula={[
            { pct: "50%", label: "Media voti ricevuti" },
            { pct: "50%", label: "Presenze (max 50 pt) + sessioni organizzate (max 30 pt)" },
          ]}
          tip="Organizza sessioni e partecipa regolarmente per massimizzare la SOC."
        />

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
          howUpdated="I giocatori ti votano Super (10), Top (7) o Flop (3) dopo ogni sessione. La media è calcolata su tutti i voti ricevuti."
        />

        <SimpleStatCard
          icon={Trophy}
          abbr="MotM"
          fullName="Man of the Match"
          color="#facc15"
          description="Quante volte sei stato eletto MVP della partita dai tuoi compagni. È il riconoscimento più alto che puoi ricevere in una sessione."
          howUpdated="Assegnato automaticamente al termine di una sessione quando ricevi il maggior numero di voti Super."
        />

        <SimpleStatCard
          icon={ClipboardList}
          abbr="ORG"
          fullName="Organizzate"
          color="var(--accent)"
          description="Il numero di sessioni di beach volley che hai creato e organizzato per la community."
          howUpdated="Aumenta ogni volta che crei una sessione che viene poi completata."
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

        {/* Section: Overall */}
        <SectionTitle>Punteggio globale</SectionTitle>

        <div
          className="rounded-2xl p-4 space-y-3"
          style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between">
            <p className="font-black text-white text-base">OVERALL (40–99)</p>
            <span
              className="text-2xl font-black"
              style={{ color: "var(--accent)" }}
            >
              OVR
            </span>
          </div>
          <p className="text-sm text-[var(--muted-text)] leading-relaxed">
            Il numero grande in alto a sinistra della tua card è il tuo <strong className="text-white">punteggio globale</strong>.
            Riassume in un unico valore la tua bravura complessiva come giocatore.
          </p>
          <div className="space-y-2">
            {[
              { pct: "60%", label: "Media voti ricevuti (AVG)" },
              { pct: "30%", label: "Rating Glicko-2 (SKL)" },
              { pct: "10%", label: "Bonus livello (max +20 pt)" },
            ].map(({ pct, label }) => (
              <div key={label} className="flex items-center gap-3">
                <span
                  className="shrink-0 rounded-lg px-2 py-1 text-xs font-black"
                  style={{ background: "rgba(201,243,29,0.12)", color: "var(--accent)", minWidth: "3rem", textAlign: "center" }}
                >
                  {pct}
                </span>
                <span className="text-sm text-white">{label}</span>
              </div>
            ))}
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

function StatCard({
  icon: Icon,
  abbr,
  fullName,
  color,
  description,
  formula,
  tip,
  warning,
}: {
  icon: React.ElementType
  abbr: string
  fullName: string
  color: string
  description: string
  formula: { pct: string; label: string }[]
  tip: string
  warning?: string
}) {
  return (
    <div
      className="rounded-2xl p-4 space-y-3"
      style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0"
          style={{ background: `${color}22` }}
        >
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{abbr}</span>
            <span className="text-sm font-semibold" style={{ color }}>{fullName}</span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--muted-text)] leading-relaxed">{description}</p>

      {/* Formula */}
      <div className="space-y-1.5">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>
          Come si calcola
        </p>
        {formula.map(({ pct, label }) => (
          <div key={label} className="flex items-center gap-3">
            <span
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-black"
              style={{ background: `${color}22`, color, minWidth: "3rem", textAlign: "center" }}
            >
              {pct}
            </span>
            <span className="text-sm text-white">{label}</span>
          </div>
        ))}
      </div>

      {/* Warning */}
      {warning && (
        <div
          className="rounded-xl p-3 text-xs leading-relaxed"
          style={{ background: "rgba(239,68,68,0.08)", color: "#f87171", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          ⚠ {warning}
        </div>
      )}

      {/* Tip */}
      <div
        className="rounded-xl p-3 text-xs leading-relaxed"
        style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.55)" }}
      >
        <span className="text-white font-semibold">Consiglio:</span> {tip}
      </div>
    </div>
  )
}

function SimpleStatCard({
  icon: Icon,
  abbr,
  fullName,
  color,
  description,
  howUpdated,
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
