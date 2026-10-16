import Link from "next/link"

export interface WeekStatsData {
  played: number
  won: number
  /** Place in the player's comune board, when they have one. */
  cityRank: { rank: number; city: string } | null
}

/** The week in three numbers: enough to feel progress, nothing to decode. */
export function WeekStats({ data }: { data: WeekStatsData }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h2 className="text-lg font-extrabold text-white">La tua settimana</h2>
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-[var(--radius-md)] bg-[var(--surface-2)] px-3 py-3.5">
          <p className="num text-[2.1rem] leading-none text-white">{data.played}</p>
          <p className="mt-1 text-sm text-[var(--muted-text)]">{data.played === 1 ? "partita" : "partite"}</p>
        </div>
        <div className="rounded-[var(--radius-md)] bg-[var(--surface-2)] px-3 py-3.5">
          <p className="num text-[2.1rem] leading-none text-[var(--accent)]">{data.won}</p>
          <p className="mt-1 text-sm text-[var(--muted-text)]">{data.won === 1 ? "vinta" : "vinte"}</p>
        </div>
        <Link href="/bagni" className="pressable rounded-[var(--radius-md)] bg-[var(--surface-2)] px-3 py-3.5">
          <p className="num text-[2.1rem] leading-none text-[var(--compete)]">{data.cityRank ? `${data.cityRank.rank}°` : "–"}</p>
          <p className="mt-1 truncate text-sm text-[var(--muted-text)]">
            {data.cityRank ? `a ${data.cityRank.city}` : "in classifica"}
          </p>
        </Link>
      </div>
    </section>
  )
}
