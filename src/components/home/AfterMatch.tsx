import Link from "next/link"
import { ClipboardPen, Hourglass, Users, TrendingUp, TrendingDown, Crown, RotateCcw, ChevronRight, MapPin } from "lucide-react"
import { formatWhen } from "@/lib/datetime"
import type { FreshRecap, UnscoredMatchCard } from "@/lib/home"
import type { ResultEntry } from "@/lib/afterMatch"
import type { PlayerCardData } from "@/components/player/SanderCardFut"
import { ShareStoryButton } from "@/components/share/ShareStoryButton"
import { cn } from "@/lib/utils"
import { Crest } from "./Crest"

const ENTRY_COPY: Record<ResultEntry["kind"], { text: string; cta: string }> = {
  organizer: {
    text: "Scrivi i set: in 10 secondi si aggiornano rating, classifica del comune e la carta di tutti.",
    cta: "Segna il risultato",
  },
  teams: {
    text: "Prima dividi le squadre, poi scrivi i set: senza squadre il risultato non muove il rating.",
    cta: "Fai le squadre",
  },
  board: {
    text: "Il tabellone dal vivo è ancora aperto: chiudilo e salva il risultato.",
    cta: "Apri il tabellone",
  },
  wait: { text: "", cta: "Apri la partita" },
}

/**
 * "Com'è andata?" — a match that's over and still open. The reason to reopen
 * the app right after playing: nothing counts until the result is in.
 */
export function UnscoredMatch({ match }: { match: UnscoredMatchCard }) {
  const { entry } = match
  const waiting = entry.kind === "wait"
  const copy = ENTRY_COPY[entry.kind]
  const Icon = waiting ? Hourglass : entry.kind === "teams" ? Users : ClipboardPen
  return (
    <section aria-labelledby="unscored-title">
      <Crest line="accent" innerClassName="p-5">
        <p className="eyebrow text-[var(--accent)]">Partita finita</p>
        <h2 id="unscored-title" className="mt-1 font-display text-4xl font-black leading-none text-white">
          Com&apos;è andata?
        </h2>
        <p className="mt-2 flex items-center gap-1.5 truncate text-sm text-[var(--muted-text)]">
          <MapPin className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
          <span className="truncate">{match.title} · {formatWhen(match.date)}</span>
        </p>
        <p className="mt-3 text-base leading-snug text-white/85">
          {waiting
            ? `Il risultato lo segna ${match.organizerName}. Appena c'è, qui vedi quanto è cambiato il tuo rating.`
            : copy.text}
        </p>
        <Link
          href={entry.href}
          className={cn(
            "pressable mt-4 flex min-h-[3.5rem] items-center justify-center gap-2 rounded-[var(--radius-md)] text-base font-extrabold",
            waiting ? "bg-[var(--surface-3)] text-white ring-1 ring-[var(--crest-hair)]" : "bg-[var(--accent)] text-black",
          )}
        >
          <Icon className={cn("h-5 w-5", waiting && "text-[var(--accent)]")} aria-hidden="true" />
          {copy.cta}
        </Link>
      </Crest>
    </section>
  )
}

const OUTCOME = {
  win: "Vittoria",
  loss: "Sconfitta",
  draw: "Pareggio",
} as const

/**
 * The match just played, while it's still news: what it meant (result, rating,
 * town rank), something to show off, and the quickest way to play again
 * ("Rigioca" opens a new match pre-filled from this one).
 */
export function AfterMatchRecap({
  recap,
  cardData,
  primary,
}: {
  recap: FreshRecap
  cardData: PlayerCardData
  /** Lime share button; off when another card above already holds the main action. */
  primary: boolean
}) {
  const won = recap.outcome === "win"
  const delta = recap.delta
  return (
    <section aria-labelledby="recap-title">
      <Crest innerClassName="p-5">
        {won && (
          <div aria-hidden="true" className="crest-sun pointer-events-none absolute inset-x-0 top-0 h-40 opacity-80" />
        )}
        <div className="relative flex items-center justify-between gap-3">
          <p className="eyebrow text-[var(--accent)]">La tua ultima partita</p>
          <Link href={`/sessions/${recap.id}`} className="-my-2 flex min-h-[2.75rem] items-center gap-0.5 text-sm font-bold text-[var(--muted-text)]">
            Dettagli <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <h2 id="recap-title" className={cn("relative font-display text-5xl font-black leading-none", won ? "text-[var(--accent)]" : "text-white")}>
          {recap.outcome ? OUTCOME[recap.outcome] : "Partita chiusa"}
        </h2>
        {recap.score && <p className="num relative mt-1 text-xl text-white/90">{recap.score}</p>}
        <p className="relative mt-1 truncate text-sm text-[var(--muted-text)]">{recap.title} · {formatWhen(recap.date)}</p>

        <div className="relative mt-4 flex flex-wrap gap-2">
          {delta !== null && delta !== 0 && (
            <span className="flex min-h-[2.75rem] items-center gap-1.5 rounded-full bg-black/40 px-3 text-sm font-extrabold text-white ring-1 ring-[var(--crest-hair)]">
              {delta > 0 ? (
                <TrendingUp className="h-4 w-4 text-[var(--success)]" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-4 w-4" aria-hidden="true" />
              )}
              <span className={cn(delta > 0 && "text-[var(--success)]")}>
                {delta > 0 ? "+" : "−"}{Math.abs(delta)}
              </span>{" "}
              punti
            </span>
          )}
          {recap.city && (
            <Link
              href="/bagni"
              className="flex min-h-[2.75rem] items-center gap-1.5 rounded-full bg-black/40 px-3 text-sm font-bold text-white ring-1 ring-[var(--crest-hair)]"
            >
              <Crown className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
              {recap.city.rank}° su {recap.city.total} a {recap.city.name}
            </Link>
          )}
        </div>
        {recap.outcome === "loss" && (
          <p className="relative mt-3 text-base text-[var(--muted-text)]">
            Capita. Una vittoria contro avversari più forti vale di più: rimettiti in campo.
          </p>
        )}

        <div className="relative mt-4 grid grid-cols-[1fr_auto] gap-2">
          <ShareStoryButton
            playerData={cardData}
            variant={won ? "win" : "card"}
            subline={won ? `Vittoria · ${recap.location}` : undefined}
            label={won ? "Condividi la vittoria" : "Condividi la carta"}
            tone={won && primary ? "primary" : "ghost"}
            lazy
          />
          <Link
            href={`/sessions/new?from=${recap.id}`}
            className="pressable flex min-h-[3.5rem] items-center justify-center gap-2 rounded-2xl bg-[var(--surface-3)] px-4 text-base font-extrabold text-white ring-1 ring-[var(--crest-hair)]"
          >
            <RotateCcw className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" /> Rigioca
          </Link>
        </div>
      </Crest>
    </section>
  )
}
