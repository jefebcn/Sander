"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Search, Crown, MapPin, Waves } from "lucide-react"
import { POPULAR_BAGNI, bagnoLabel } from "@/lib/bagni"
import type { Territory } from "@/actions/territories"

function KingAvatar({ name, url }: { name: string; url: string | null }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-1)] text-[0.65rem] font-black text-[var(--muted-text)]">
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        name.slice(0, 2).toUpperCase()
      )}
    </div>
  )
}

/** One row: a bagno/location with its king, or an empty "claim it" state. */
function TerritoryRow({ t, bagno }: { t?: Territory; bagno?: number }) {
  const label = t?.location ?? (bagno ? bagnoLabel(bagno) : "")
  const num = t?.bagno ?? bagno ?? null

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-3 py-2.5">
      {/* Number / icon badge */}
      <div
        className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl"
        style={{
          background: t?.king ? "rgba(255,215,0,0.12)" : "var(--surface-1)",
          border: `1px solid ${t?.king ? "rgba(255,215,0,0.25)" : "transparent"}`,
        }}
      >
        {num !== null ? (
          <>
            <span className="text-base font-black leading-none text-white">{num}</span>
            <span className="text-[0.5rem] font-bold uppercase tracking-wider text-[var(--muted-text)]">
              bagno
            </span>
          </>
        ) : (
          <MapPin className="h-5 w-5 text-[var(--muted-text)]" />
        )}
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-white">{label}</p>
        {t?.king ? (
          <Link href={`/players/${t.king.id}`} className="mt-0.5 flex items-center gap-1.5">
            <Crown className="h-3.5 w-3.5 shrink-0 text-[var(--gold)]" />
            <span className="truncate text-xs font-bold text-[var(--gold)]">{t.king.name}</span>
          </Link>
        ) : (
          <p className="mt-0.5 text-xs text-[var(--muted-text)]">Libero — gioca qui e conquistalo 👑</p>
        )}
      </div>

      {/* Wins */}
      {t?.king && (
        <div className="shrink-0 text-right">
          <p className="text-lg font-black text-[var(--gold)]">{t.king.wins}</p>
          <p className="text-[0.55rem] font-bold uppercase tracking-widest text-[var(--muted-text)]">
            vittorie
          </p>
        </div>
      )}
    </div>
  )
}

export function BagniView({ territories }: { territories: Territory[] }) {
  const [query, setQuery] = useState("")

  const byBagno = useMemo(() => {
    const m = new Map<number, Territory>()
    for (const t of territories) if (t.bagno !== null) m.set(t.bagno, t)
    return m
  }, [territories])

  const q = query.trim().toLowerCase()
  const matches = (t: Territory) =>
    !q || t.location.toLowerCase().includes(q) || String(t.bagno ?? "").includes(q)

  // Popular bagni (always shown, even if not yet played — a claim hook)
  const popular = POPULAR_BAGNI.map((n) => ({ n, t: byBagno.get(n) })).filter(({ n, t }) => {
    if (!q) return true
    if (String(n).includes(q)) return true
    return t ? matches(t) : false
  })

  // Everything else that has actual play, minus the popular ones
  const others = territories
    .filter((t) => !(t.bagno !== null && POPULAR_BAGNI.includes(t.bagno)))
    .filter(matches)

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative px-4">
        <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-text)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cerca un bagno o un campo…"
          inputMode="text"
          className="w-full rounded-2xl bg-[var(--surface-2)] py-3 pl-10 pr-4 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>

      {/* Popular bagni */}
      {popular.length > 0 && (
        <section className="px-4">
          <div className="mb-2 flex items-center gap-1.5">
            <Waves className="h-4 w-4 text-[var(--accent)]" />
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
              Bagni più gettonati
            </p>
          </div>
          <div className="space-y-2">
            {popular.map(({ n, t }) => (
              <TerritoryRow key={`pop-${n}`} t={t} bagno={n} />
            ))}
          </div>
        </section>
      )}

      {/* Other courts */}
      {others.length > 0 && (
        <section className="px-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
            Altri campi
          </p>
          <div className="space-y-2">
            {others.map((t) => (
              <TerritoryRow key={t.location} t={t} />
            ))}
          </div>
        </section>
      )}

      {popular.length === 0 && others.length === 0 && (
        <p className="px-4 text-center text-sm text-[var(--muted-text)]">Nessun campo trovato.</p>
      )}
    </div>
  )
}
