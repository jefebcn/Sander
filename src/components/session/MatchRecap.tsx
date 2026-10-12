import Link from "next/link"
import { TrendingUp, TrendingDown, Crown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MatchRecapData {
  won: boolean
  /** Rating points gained (+) or lost (−) in this match; null if unknown. */
  delta: number | null
  city: { name: string; rank: number; total: number } | null
}

/**
 * The moment right after a match is when people care most: say what it meant
 * for them — result, rating, where they now stand in their town.
 */
export function MatchRecap({ data }: { data: MatchRecapData }) {
  const up = (data.delta ?? 0) >= 0
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)] p-5",
        data.won ? "tone-play bg-[var(--surface-2)] shadow-[var(--shadow-glow)]" : "tone-sand bg-[var(--surface-2)] shadow-[var(--shadow-card)]",
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full opacity-25"
        style={{ background: "radial-gradient(circle, var(--tone) 0%, transparent 65%)" }}
      />
      <p className="eyebrow relative text-[var(--tone)]">La tua partita</p>
      <p className="relative font-display text-5xl font-black uppercase leading-none text-white">
        {data.won ? "Vittoria" : "Sconfitta"}
      </p>
      <div className="relative mt-4 flex flex-wrap gap-2">
        {data.delta !== null && (
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-extrabold",
              up ? "bg-[var(--accent)] text-black" : "bg-black/30 text-white",
            )}
          >
            {up ? <TrendingUp className="h-4 w-4" aria-hidden="true" /> : <TrendingDown className="h-4 w-4" aria-hidden="true" />}
            {up ? "+" : ""}{data.delta} punti rating
          </span>
        )}
        {data.city && (
          <Link
            href="/bagni"
            className="flex items-center gap-1.5 rounded-full bg-black/30 px-3 py-1.5 text-sm font-bold text-white"
          >
            <Crown className="h-4 w-4 text-[var(--sand)]" aria-hidden="true" />
            {data.city.rank}° a {data.city.name} su {data.city.total}
          </Link>
        )}
      </div>
      {!data.won && (
        <p className="relative mt-3 text-sm text-[var(--muted-text)]">
          Capita. La prossima vittoria contro avversari forti vale di più.
        </p>
      )}
    </section>
  )
}
