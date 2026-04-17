import Link from "next/link"
import { ChevronLeft, TrendingUp, Swords, Shield, Trophy, AlertCircle } from "lucide-react"

export default function RankingInfoPage() {
  return (
    <div className="pb-8">
      <header className="flex items-center gap-3 px-4 py-5">
        <Link
          href="/players"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--muted-text)]"
          aria-label="Indietro"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-white">Come funziona il Ranking</h1>
          <p className="text-sm text-[var(--muted-text)]">Sistema di valutazione Glicko-2</p>
        </div>
      </header>

      <div className="px-4 space-y-4">

        {/* Overview */}
        <div
          className="rounded-2xl p-4 slide-up"
          style={{ background: "rgba(201,243,29,0.07)", border: "1px solid rgba(201,243,29,0.2)" }}
        >
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 shrink-0 text-[var(--accent)] mt-0.5" />
            <div>
              <p className="font-bold text-white mb-1">Glicko-2 — il sistema usato dagli scacchi</p>
              <p className="text-sm text-white/70 leading-relaxed">
                Ogni giocatore parte da <strong className="text-[var(--accent)]">1500 punti</strong>. Il punteggio sale vincendo partite di torneo e scende perdendole, tenendo conto della forza dell&apos;avversario.
              </p>
            </div>
          </div>
        </div>

        {/* How points change */}
        <div className="space-y-2 slide-up stagger-1">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)] px-1">
            Come cambia il punteggio
          </p>

          <div className="rounded-2xl bg-[var(--surface-2)] p-4 flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(34,197,94,0.15)" }}>
              <Swords className="h-4 w-4 text-[var(--live)]" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Vinci contro un giocatore più forte</p>
              <p className="text-xs text-[var(--muted-text)]">Guadagni molti punti — era inaspettato</p>
            </div>
            <span className="ml-auto shrink-0 text-sm font-black text-[var(--live)]">+++</span>
          </div>

          <div className="rounded-2xl bg-[var(--surface-2)] p-4 flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(34,197,94,0.1)" }}>
              <Swords className="h-4 w-4 text-[var(--live)]" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Vinci contro un giocatore più debole</p>
              <p className="text-xs text-[var(--muted-text)]">Guadagni pochi punti — era atteso</p>
            </div>
            <span className="ml-auto shrink-0 text-sm font-black text-[var(--live)]">+</span>
          </div>

          <div className="rounded-2xl bg-[var(--surface-2)] p-4 flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(239,68,68,0.12)" }}>
              <Shield className="h-4 w-4 text-[var(--danger)]" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Perdi contro un giocatore più forte</p>
              <p className="text-xs text-[var(--muted-text)]">Perdi pochi punti — era abbastanza atteso</p>
            </div>
            <span className="ml-auto shrink-0 text-sm font-black text-[var(--danger)]">-</span>
          </div>

          <div className="rounded-2xl bg-[var(--surface-2)] p-4 flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(239,68,68,0.2)" }}>
              <Shield className="h-4 w-4 text-[var(--danger)]" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Perdi contro un giocatore più debole</p>
              <p className="text-xs text-[var(--muted-text)]">Perdi molti punti — era inaspettato</p>
            </div>
            <span className="ml-auto shrink-0 text-sm font-black text-[var(--danger)]">---</span>
          </div>
        </div>

        {/* RD explanation */}
        <div className="rounded-2xl bg-[var(--surface-2)] p-4 slide-up stagger-2">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-[var(--warning)] mt-0.5" />
            <div>
              <p className="font-bold text-white text-sm mb-1">Deviazione del rating (RD)</p>
              <p className="text-xs text-[var(--muted-text)] leading-relaxed">
                Ogni giocatore ha anche un&apos; <strong className="text-white">incertezza</strong> sul proprio punteggio. Chi ha giocato poche partite ha un&apos;incertezza alta — il punteggio cambierà di più ad ogni risultato. Con più partite l&apos;incertezza scende e il rating diventa stabile.
              </p>
            </div>
          </div>
        </div>

        {/* Only tournament matches */}
        <div className="rounded-2xl bg-[var(--surface-2)] p-4 slide-up stagger-3">
          <div className="flex items-start gap-3">
            <Trophy className="h-5 w-5 shrink-0 text-[var(--accent)] mt-0.5" />
            <div>
              <p className="font-bold text-white text-sm mb-1">Solo partite di torneo</p>
              <p className="text-xs text-[var(--muted-text)] leading-relaxed">
                Il ranking Glicko-2 si aggiorna solo al termine delle partite dei <strong className="text-white">tornei ufficiali</strong>. Le sessioni libere non influenzano il punteggio, ma contribuiscono all&apos;XP.
              </p>
            </div>
          </div>
        </div>

        {/* Scale */}
        <div className="space-y-2 slide-up stagger-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)] px-1">
            Fasce di punteggio
          </p>
          {[
            { range: "2400+",      label: "Élite",         color: "text-[var(--gold)]",      bg: "rgba(255,215,0,0.1)" },
            { range: "2000–2399",  label: "Avanzato",      color: "text-[var(--accent)]",    bg: "rgba(201,243,29,0.1)" },
            { range: "1700–1999",  label: "Intermedio+",   color: "text-[var(--sky)]",       bg: "rgba(0,180,240,0.1)" },
            { range: "1500–1699",  label: "Intermedio",    color: "text-white",              bg: "rgba(255,255,255,0.05)" },
            { range: "1200–1499",  label: "Base",          color: "text-[var(--muted-text)]",bg: "transparent" },
          ].map(({ range, label, color, bg }) => (
            <div
              key={range}
              className="flex items-center justify-between rounded-xl px-4 py-3"
              style={{ background: bg, border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className={`font-black text-sm ${color}`}>{range}</span>
              <span className="text-sm text-[var(--muted-text)]">{label}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
