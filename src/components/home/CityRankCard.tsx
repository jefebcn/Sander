import Link from "next/link"
import { Crown, ChevronRight } from "lucide-react"

export interface CityRank {
  city: string
  rank: number
  total: number
  wins: number
  /** Wins still needed to reach the podium (0 when already on it). */
  winsToPodium: number
  king: string | null
}

/** "Sei 4° a Rimini" — local rank motivates far more than a global one. */
export function CityRankCard({ data }: { data: CityRank | null }) {
  if (!data) {
    return (
      <Link
        href="/bagni"
        className="pressable tone-sand flex min-h-[3.5rem] items-center gap-4 rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-4"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--tone-soft)] text-[var(--tone)]">
          <Crown className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="eyebrow block text-[var(--tone)]">Re dei Bagni</span>
          <span className="block text-base font-extrabold text-white">Conquista il tuo bagno</span>
          <span className="block text-sm text-[var(--muted-text)]">Vinci partite e sali nella classifica del tuo comune</span>
        </span>
        <ChevronRight className="h-5 w-5 text-[var(--tone)]" aria-hidden="true" />
      </Link>
    )
  }
  const onPodium = data.rank <= 3
  return (
    <Link
      href="/bagni"
      className="pressable tone-sand relative flex items-center gap-4 overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-4"
    >
      <div className="flex w-16 shrink-0 flex-col items-center">
        <span className="num text-5xl leading-none text-[var(--tone)]">{data.rank}°</span>
        <span className="text-xs font-bold text-[var(--muted-text)]">su {data.total}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="eyebrow text-[var(--tone)]">Classifica di {data.city}</p>
        <p className="text-base font-extrabold leading-snug text-white">
          {data.rank === 1
            ? "Sei il Re del comune. Difendi il trono."
            : onPodium
              ? "Sei sul podio. Il trono è a un passo."
              : `${data.winsToPodium} ${data.winsToPodium === 1 ? "vittoria" : "vittorie"} e sei sul podio`}
        </p>
        {data.king && data.rank !== 1 && (
          <p className="truncate text-sm text-[var(--muted-text)]">Re attuale: {data.king}</p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-[var(--tone)]" aria-hidden="true" />
    </Link>
  )
}
