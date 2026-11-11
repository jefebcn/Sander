"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { FileSpreadsheet, Search } from "lucide-react"
import { filterRoster, type RosterFilter } from "@/lib/clubRoster"
import { resizedPhoto } from "@/lib/photo"
import { euro } from "@/lib/shop"
import { cn } from "@/lib/utils"

export interface ClubPlayerItem {
  playerId: string
  name: string
  avatarUrl: string | null
  tournaments: number
  checkins: number
  lastDate: string | null
  unpaidCount: number
  unpaidCents: number
  follower: boolean
  isNew: boolean
  firstSeen: string
}

const FILTERS: { id: RosterFilter; label: string }[] = [
  { id: "tutti", label: "Tutti" },
  { id: "da-pagare", label: "Da pagare" },
  { id: "follower", label: "Follower" },
  { id: "nuovi", label: "Nuovi" },
]
const MONTHS = ["gen", "feb", "mar", "apr", "mag", "giu", "lug", "ago", "set", "ott", "nov", "dic"]
const short = (iso: string) => {
  const d = new Date(iso)
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`
}

function line(p: ClubPlayerItem): string {
  if (p.tournaments === 0) return `Segue il club dal ${short(p.firstSeen)}`
  const parts = [`${p.tournaments} ${p.tournaments === 1 ? "torneo" : "tornei"}`]
  if (p.checkins > 0) parts.push(`${p.checkins} ${p.checkins === 1 ? "presenza" : "presenze"}`)
  if (p.lastDate) parts.push(short(p.lastDate))
  return parts.join(" · ")
}

/** "Giocatori" in club mode: everyone who passed through the club, searchable, with what they owe. */
export function ClubPlayersList({ players, exportHref }: { players: ClubPlayerItem[]; exportHref: string }) {
  const [filter, setFilter] = useState<RosterFilter>("tutti")
  const [query, setQuery] = useState("")
  const shown = useMemo(() => filterRoster(players, filter, query), [players, filter, query])
  const counts = useMemo(
    () => ({ "da-pagare": players.filter((p) => p.unpaidCount > 0).length, follower: players.filter((p) => p.follower).length, nuovi: players.filter((p) => p.isNew).length }),
    [players],
  )

  return (
    <div className="flex flex-col gap-3">
      <label className="flex min-h-[3.25rem] items-center gap-2.5 rounded-2xl bg-[var(--surface-2)] px-4">
        <Search className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
        <span className="sr-only">Cerca un giocatore</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Cerca tra ${players.length} giocatori`}
          className="min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none"
        />
      </label>
      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none]" role="group" aria-label="Filtra">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            aria-pressed={filter === f.id}
            className={cn("flex min-h-[2.75rem] shrink-0 items-center rounded-full px-4 text-sm font-extrabold", filter === f.id ? "sel-on" : "sel-off")}
          >
            {f.label}
            {f.id !== "tutti" && counts[f.id] > 0 && <span className="ml-1.5 opacity-70">{counts[f.id]}</span>}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="rounded-[1.25rem] bg-[var(--surface-2)] p-4 text-base text-[var(--muted-text)]">
          {players.length === 0 ? "Qui compariranno i giocatori che si iscrivono ai tuoi tornei o seguono il club." : "Nessun giocatore con questi filtri."}
        </p>
      ) : (
        <ul className="divide-y divide-[var(--border)] overflow-hidden rounded-[1.25rem] bg-[var(--surface-2)]">
          {shown.map((p) => (
            <li key={p.playerId}>
              <Link href={`/players/${p.playerId}`} className="flex min-h-[4rem] items-center gap-3 px-3.5 py-2.5 active:bg-[var(--surface-3)]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-3)] text-sm font-black text-white">
                  {p.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={resizedPhoto(p.avatarUrl, "thumb")} alt="" className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    p.name.slice(0, 2).toUpperCase()
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-bold text-white">{p.name}</span>
                  <span className="block truncate text-sm text-[var(--muted-text)]">{line(p)}</span>
                </span>
                {p.unpaidCount > 0 ? (
                  <span className="shrink-0 rounded-full bg-[var(--surface-3)] px-2.5 py-1 text-xs font-extrabold text-[var(--compete)]">{euro(p.unpaidCents)}</span>
                ) : p.isNew ? (
                  <span className="shrink-0 rounded-full bg-[var(--surface-3)] px-2.5 py-1 text-xs font-extrabold text-[var(--social)]">Nuovo</span>
                ) : p.follower ? (
                  <span className="shrink-0 rounded-full bg-[var(--surface-3)] px-2.5 py-1 text-xs font-extrabold text-[var(--accent)]">Follower</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <a href={exportHref} download className="btn btn-secondary w-full gap-2">
        <FileSpreadsheet className="h-5 w-5" aria-hidden="true" /> Esporta in Excel
      </a>
      <p className="px-1 text-sm text-[var(--muted-text)]">
        Nel file c&apos;è l&apos;email solo di chi si è iscritto a un tuo torneo: chi ti segue soltanto non ha condiviso i suoi contatti.
      </p>
    </div>
  )
}
