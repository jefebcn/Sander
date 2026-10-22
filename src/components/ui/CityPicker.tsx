"use client"

import { useEffect, useMemo, useState } from "react"
import { MapPin, Search, ChevronDown } from "lucide-react"
import { CITY_NAMES } from "@/lib/cities"
import type { ComuniData } from "@/lib/comuni"
import { cn } from "@/lib/utils"

/* The full list (~45 KB gzipped) is fetched once, the first time someone
   looks outside the Riviera, and shared by every picker on the page. */
let comuniPromise: Promise<ComuniData> | null = null
function loadComuni(): Promise<ComuniData> {
  comuniPromise ??= fetch("/api/comuni").then((r) => {
    if (!r.ok) throw new Error("comuni")
    return r.json() as Promise<ComuniData>
  })
  comuniPromise.catch(() => { comuniPromise = null })
  return comuniPromise
}

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()

/**
 * Pick a comune: the Riviera towns one tap away, and any comune in Italy for
 * everyone else ("SANDER cresce con te"): choose the region, type a few
 * letters, tap the result.
 */
export function CityPicker({
  value,
  onChange,
  allowClear = true,
  className,
}: {
  value: string
  onChange: (city: string) => void
  /** Tapping the selected town again clears it. */
  allowClear?: boolean
  className?: string
}) {
  const outside = !!value && !CITY_NAMES.includes(value)
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<ComuniData | null>(null)
  const [failed, setFailed] = useState(false)
  const [region, setRegion] = useState("Emilia-Romagna")
  const [query, setQuery] = useState("")

  useEffect(() => {
    if (!open || data) return
    let alive = true
    loadComuni()
      .then((d) => {
        if (!alive) return
        setData(d)
        // Start from the region of the comune already chosen.
        const hit = value ? d.comuni.find(([n]) => n === value) : undefined
        if (hit) setRegion(d.regions[hit[1]])
      })
      .catch(() => alive && setFailed(true))
    return () => { alive = false }
  }, [open, data, value])

  const results = useMemo(() => {
    if (!data) return []
    const r = data.regions.indexOf(region)
    const q = fold(query.trim())
    const inRegion = data.comuni.filter(([, ri]) => ri === r)
    if (!q) return inRegion.slice(0, 8).map(([n]) => n)
    const starts = inRegion.filter(([n]) => fold(n).startsWith(q))
    const contains = inRegion.filter(([n]) => !fold(n).startsWith(q) && fold(n).includes(q))
    return [...starts, ...contains].slice(0, 8).map(([n]) => n)
  }, [data, region, query])

  const pick = (city: string) => onChange(allowClear && city === value ? "" : city)

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex flex-wrap gap-2">
        {CITY_NAMES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => pick(c)}
            aria-pressed={value === c}
            className={cn("min-h-[2.75rem] rounded-full px-4 text-sm font-bold transition-colors", value === c ? "sel-on" : "sel-off")}
          >
            {c}
          </button>
        ))}
        {outside && (
          <button
            type="button"
            onClick={() => pick(value)}
            aria-pressed="true"
            className="sel-on flex min-h-[2.75rem] items-center gap-1.5 rounded-full px-4 text-sm font-bold"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" /> {value}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-[2.75rem] items-center gap-1.5 self-start text-left text-sm font-bold text-[var(--accent)]"
      >
        Sei di un altro comune o regione? Nessun problema
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open && (
        <div className="flex flex-col gap-2 rounded-[var(--radius-md)] bg-[var(--surface-3)] p-3">
          {failed ? (
            <p className="text-sm text-[var(--muted-text)]">Non riesco a caricare i comuni. Riprova tra poco.</p>
          ) : !data ? (
            <p className="text-sm text-[var(--muted-text)]">Carico i comuni…</p>
          ) : (
            <>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">Regione</span>
                <select
                  value={region}
                  onChange={(e) => { setRegion(e.target.value); setQuery("") }}
                  className="min-h-[3rem] rounded-xl bg-[var(--surface-1)] px-3 text-base text-white outline-none ring-1 ring-[var(--border)] focus:ring-[var(--accent)]"
                >
                  {data.regions.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </label>
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-text)]" aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cerca il tuo comune"
                  aria-label="Cerca il tuo comune"
                  className="min-h-[3rem] w-full rounded-xl bg-[var(--surface-1)] pl-9 pr-3 text-base text-white placeholder:text-[var(--muted-text)] outline-none ring-1 ring-[var(--border)] focus:ring-[var(--accent)]"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {results.length === 0 ? (
                  <p className="text-sm text-[var(--muted-text)]">Nessun comune con questo nome in {region}.</p>
                ) : (
                  results.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => { onChange(c); setOpen(false); setQuery("") }}
                      aria-pressed={value === c}
                      className={cn("min-h-[2.75rem] rounded-full px-4 text-sm font-bold", value === c ? "sel-on" : "sel-off")}
                    >
                      {c}
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
