"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"

interface PlayerSearchProps {
  onSearch: (query: string) => void
}

export function PlayerSearch({ onSearch }: PlayerSearchProps) {
  const [query, setQuery] = useState("")

  function handleChange(value: string) {
    setQuery(value)
    onSearch(value)
  }

  return (
    <div className="relative">
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-text)]" />
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Cerca giocatore..."
        className="w-full rounded-2xl bg-[var(--surface-2)] py-3 pl-10 pr-10 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      />
      {query && (
        <button
          onClick={() => handleChange("")}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted-text)]"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
