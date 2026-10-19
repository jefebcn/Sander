import Link from "next/link"
import { Crown, ChevronRight, Flame, Waves } from "lucide-react"
import type { CityPreview, CityRank } from "@/lib/home"
import type { WeeklyStreak } from "@/lib/weeklyStreak"
import { CrestBadge, CrestHeading } from "./Crest"

export interface DivisionStatus {
  name: string
  next: string | null
  pointsToNext: number | null
  /** 0–100 through the current division. */
  progress: number
}

/**
 * "Perché dovrei tornarci?" — three things that move every week: your place
 * in your comune, your division, and your run of weeks on the sand.
 */
export function YourRace({
  city,
  division,
  streak,
}: {
  city: { rank: CityRank | null; preview: CityPreview | null }
  division: DivisionStatus
  streak: WeeklyStreak
}) {
  return (
    <section className="tone-compete flex flex-col gap-3" aria-labelledby="race-title">
      <CrestHeading id="race-title" eyebrow="Ogni settimana si muove" title="La tua corsa" />
      {/* No overflow-hidden: it would clip the keyboard focus ring of the rows. */}
      <div className="divide-y divide-[var(--crest-hair)] rounded-[var(--radius-lg)] bg-[var(--surface-2)] ring-1 ring-[var(--crest-hair)]">
        <CityRow rank={city.rank} preview={city.preview} />

        <Row
          href="/stagione"
          badge={<Waves className="h-6 w-6 text-[var(--tone)]" aria-hidden="true" />}
          eyebrow={`Divisione ${division.name}`}
          title={
            division.next && division.pointsToNext !== null
              ? `${division.pointsToNext} punti per salire in ${division.next}`
              : "Sei in cima: difendi la Leggenda"
          }
        >
          <span className="mt-2 block h-2 overflow-hidden rounded-full bg-[var(--surface-4)]" aria-hidden="true">
            <span className="xp-bar-fill block h-full rounded-full bg-[var(--tone)]" style={{ width: `${Math.max(4, division.progress)}%` }} />
          </span>
        </Row>

        <Row
          href="/sessions"
          badge={<Flame className="h-6 w-6 text-[var(--tone)]" aria-hidden="true" />}
          eyebrow="Serie settimanale"
          title={
            streak.weeks === 0
              ? "Inizia una serie questa settimana"
              : `${streak.weeks} ${streak.weeks === 1 ? "settimana" : "settimane"} di fila in campo`
          }
          text={
            streak.weeks === 0
              ? "Una partita a settimana e la serie cresce."
              : streak.playedThisWeek
                ? "Questa settimana ci sei. Torna la prossima per allungarla."
                : "Gioca entro domenica o la serie si azzera."
          }
        />
      </div>
    </section>
  )
}

function CityRow({ rank, preview }: { rank: CityRank | null; preview: CityPreview | null }) {
  if (rank) {
    return (
      <Row
        href="/bagni"
        badge={<CrestBadge className="h-12 w-11 text-xl">{rank.rank}°</CrestBadge>}
        eyebrow={`Classifica di ${rank.city}`}
        title={
          rank.rank === 1
            ? "Sei il Re del comune. Difendi il trono."
            : rank.rank <= 3
              ? "Sei sul podio. Il trono è a un passo."
              : `${rank.winsToPodium} ${rank.winsToPodium === 1 ? "vittoria" : "vittorie"} e sei sul podio`
        }
        text={
          rank.king && rank.rank !== 1
            ? `Re attuale: ${rank.king} · ${rank.total} in classifica`
            : `${rank.total} in classifica`
        }
      />
    )
  }
  if (preview) {
    return (
      <Row
        href="/bagni"
        badge={<Crown className="h-6 w-6 text-[var(--tone)]" aria-hidden="true" />}
        eyebrow={`Il tuo comune · ${preview.city}`}
        title={preview.king ? `Il Re è ${preview.king}` : "Il trono è libero"}
        text={`${preview.players} ${preview.players === 1 ? "giocatore" : "giocatori"} in classifica. Gioca una partita col punteggio e ci sei anche tu.`}
      />
    )
  }
  return (
    <Row
      href="/bagni"
      badge={<Crown className="h-6 w-6 text-[var(--tone)]" aria-hidden="true" />}
      eyebrow="Re dei Bagni"
      title="Conquista il tuo comune"
      text="Ogni vittoria ti fa salire nella classifica del comune e del bagno."
    />
  )
}

function Row({
  href,
  badge,
  eyebrow,
  title,
  text,
  children,
}: {
  href: string
  badge: React.ReactNode
  eyebrow: string
  title: string
  text?: string
  children?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="pressable flex min-h-[4.5rem] items-center gap-4 p-4 first:rounded-t-[var(--radius-lg)] last:rounded-b-[var(--radius-lg)] active:bg-[var(--surface-3)]"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center">{badge}</span>
      <span className="min-w-0 flex-1">
        <span className="eyebrow block text-[var(--muted-text)]">{eyebrow}</span>
        <span className="block text-base font-extrabold leading-snug text-white">{title}</span>
        {text && <span className="block text-base leading-snug text-[var(--muted-text)]">{text}</span>}
        {children}
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-[var(--tone)]" aria-hidden="true" />
    </Link>
  )
}
