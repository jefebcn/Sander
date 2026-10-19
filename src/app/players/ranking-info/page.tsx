import Link from "next/link"
import { ChevronLeft, TrendingUp, Swords, Shield, Trophy, AlertCircle, Hourglass, Layers } from "lucide-react"
import { START_LEVELS } from "@/lib/startLevel"
import { DIVISIONS } from "@/lib/divisions"
import { PROVISIONAL_GAMES } from "@/lib/rankingEligibility"

const startRatings = START_LEVELS.map((l) => l.rating).join(", ").replace(/, (\d+)$/, " o $1")

export default function RankingInfoPage() {
  return (
    <div className="pb-8">
      <header className="flex items-center gap-3 px-4 py-5">
        <Link
          href="/players"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--muted-text)]"
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
          style={{ background: "rgba(198,247,54,0.07)", border: "1px solid rgba(198,247,54,0.2)" }}
        >
          <div className="flex items-start gap-3">
            <TrendingUp className="h-5 w-5 shrink-0 text-[var(--accent)] mt-0.5" />
            <div>
              <p className="font-bold text-white mb-1">Glicko-2 — il sistema usato dagli scacchi</p>
              <p className="text-sm text-white/70 leading-relaxed">
                Si parte da <strong className="text-[var(--accent)]">{startRatings} punti</strong>, secondo il livello scelto all&apos;iscrizione ({START_LEVELS.map((l) => l.label.toLowerCase()).join(", ")}). I punti salgono quando vinci e scendono quando perdi, tenendo conto della forza degli avversari.
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
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: "color-mix(in srgb, var(--danger) 12%, transparent)" }}>
              <Shield className="h-4 w-4 text-[var(--danger)]" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Perdi contro un giocatore più forte</p>
              <p className="text-xs text-[var(--muted-text)]">Perdi pochi punti — era abbastanza atteso</p>
            </div>
            <span className="ml-auto shrink-0 text-sm font-black text-[var(--danger)]">-</span>
          </div>

          <div className="rounded-2xl bg-[var(--surface-2)] p-4 flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl" style={{ background: "color-mix(in srgb, var(--danger) 20%, transparent)" }}>
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

        {/* Entering the leaderboard */}
        <div className="rounded-2xl bg-[var(--surface-2)] p-4 slide-up stagger-2">
          <div className="flex items-start gap-3">
            <Hourglass className="h-5 w-5 shrink-0 text-[var(--warning)] mt-0.5" />
            <div>
              <p className="font-bold text-white text-sm mb-1">Quando entri in classifica</p>
              <p className="text-xs text-[var(--muted-text)] leading-relaxed">
                Dalla prima partita con risultato. Fino alla {PROVISIONAL_GAMES}ª il punteggio è <strong className="text-white">provvisorio</strong>: compari nella sezione &laquo;In valutazione&raquo;, dopo i giocatori con almeno {PROVISIONAL_GAMES} partite, così un paio di vittorie fortunate non valgono il podio.
              </p>
            </div>
          </div>
        </div>

        {/* Only tournament matches */}
        <div className="rounded-2xl bg-[var(--surface-2)] p-4 slide-up stagger-3">
          <div className="flex items-start gap-3">
            <Trophy className="h-5 w-5 shrink-0 text-[var(--accent)] mt-0.5" />
            <div>
              <p className="font-bold text-white text-sm mb-1">Tornei e partite libere</p>
              <p className="text-xs text-[var(--muted-text)] leading-relaxed">
                Contano le partite dei <strong className="text-white">tornei</strong> e anche le <strong className="text-white">partite libere</strong> chiuse con il risultato: in queste il punteggio si muove meno, circa il 40% di quanto farebbe in torneo. Una partita chiusa senza risultato non sposta i punti, ma dà comunque XP.
              </p>
            </div>
          </div>
        </div>

        {/* Scale: the divisions used everywhere else */}
        <div className="space-y-2 slide-up stagger-4">
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)] px-1">
            Divisioni
          </p>
          {[...DIVISIONS].reverse().map((d) => {
            const next = DIVISIONS.find((x) => x.order === d.order + 1)
            const range = next ? (d.min > 0 ? `${d.min}–${next.min - 1}` : `fino a ${next.min - 1}`) : `${d.min}+`
            return (
              <div
                key={d.key}
                className="flex min-h-[2.75rem] items-center justify-between rounded-xl px-4 py-3"
                style={{ background: "var(--surface-2)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                <span className="font-black text-sm" style={{ color: d.color }}>
                  {d.emoji} {d.name}
                </span>
                <span className="text-sm text-[var(--muted-text)]">{range} punti</span>
              </div>
            )
          })}
        </div>

        {/* Vocabulary: points vs level */}
        <div className="rounded-2xl bg-[var(--surface-2)] p-4 slide-up stagger-4">
          <div className="flex items-start gap-3">
            <Layers className="h-5 w-5 shrink-0 text-[var(--accent)] mt-0.5" />
            <div>
              <p className="font-bold text-white text-sm mb-1">Punti, divisione e livello</p>
              <p className="text-xs text-[var(--muted-text)] leading-relaxed">
                I <strong className="text-white">punti</strong> (es. 1378) dicono quanto sei forte: decidono classifiche, divisione e il colore della tua carta (bronzo, argento, oro). Il <strong className="text-white">livello</strong> (Liv. 3, con il suo titolo) dice quanto giochi: sale con l&apos;XP e non scende mai.
              </p>
              <Link
                href="/level-info"
                className="mt-2 inline-flex min-h-[2.75rem] items-center text-xs font-bold text-[var(--accent)]"
              >
                Come si sale di livello
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
