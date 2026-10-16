"use client"

import { useId, useMemo, useState } from "react"
import { Search } from "lucide-react"

export interface AdminSearchItem {
  id: string
  /** Lower-cased text the filter matches against (name, email, place…). */
  text: string
  node: React.ReactNode
}

/**
 * Client-side filter for the long admin lists. Rows are rendered on the
 * server and passed in as nodes; this only decides which ones to show.
 */
export function AdminSearchList({
  items,
  label,
  placeholder,
}: {
  items: AdminSearchItem[]
  label: string
  placeholder: string
}) {
  const [query, setQuery] = useState("")
  const id = useId()
  const q = query.trim().toLowerCase()
  const visible = useMemo(() => (q ? items.filter((it) => it.text.includes(q)) : items), [items, q])

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="sr-only">{label}</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--muted-text)]" aria-hidden="true" />
        <input
          id={id}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="min-h-[2.75rem] w-full rounded-xl bg-[var(--surface-2)] py-2.5 pl-10 pr-3 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </div>
      {q && (
        <p className="px-1 text-sm text-[var(--muted-text)]" role="status">
          {visible.length} di {items.length}
        </p>
      )}
      {visible.length === 0 ? (
        <p className="px-1 py-4 text-center text-base text-[var(--muted-text)]">Nessun risultato</p>
      ) : (
        visible.map((it) => <div key={it.id}>{it.node}</div>)
      )}
    </div>
  )
}
