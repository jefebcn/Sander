"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import { Plus, X, Search, Check } from "lucide-react"
import { listPlayers } from "@/actions/players"
import { createGroupThread } from "@/actions/messages"

type P = { id: string; name: string; firstName: string | null; avatarUrl: string | null }

export function NewGroupButton({ meId }: { meId: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Nuovo gruppo"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--accent)]"
      >
        <Plus className="h-5 w-5" />
      </button>
      {open && <NewGroupSheet meId={meId} onClose={() => setOpen(false)} />}
    </>
  )
}

function NewGroupSheet({ meId, onClose }: { meId: string; onClose: () => void }) {
  const router = useRouter()
  const [players, setPlayers] = useState<P[] | null>(null)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [name, setName] = useState("")
  const [creating, setCreating] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    listPlayers()
      .then((ps: P[]) =>
        setPlayers(
          ps
            .filter((p) => p.id !== meId)
            .map((p) => ({ id: p.id, name: p.name, firstName: p.firstName, avatarUrl: p.avatarUrl })),
        ),
      )
      .catch(() => setPlayers([]))
  }, [meId])

  useEffect(() => {
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [])

  const q = query.trim().toLowerCase()
  const filtered = (players ?? []).filter((p) => !q || p.name.toLowerCase().includes(q))

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  async function create() {
    if (selected.size < 2 || creating) return
    setCreating(true)
    try {
      const id = await createGroupThread({ playerIds: [...selected], name: name.trim() || undefined })
      router.push(`/messaggi/${id}`)
    } catch {
      setCreating(false)
    }
  }

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[300] flex flex-col justify-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative z-10 flex max-h-[85dvh] flex-col rounded-t-3xl bg-[var(--surface-1)]">
        <div className="flex flex-col items-center pt-3">
          <div className="h-1 w-10 rounded-full bg-[var(--surface-3)]" />
        </div>
        <div className="flex items-center justify-between px-5 pb-2 pt-3">
          <h3 className="text-lg font-black text-white">Nuovo gruppo</h3>
          <button
            onClick={onClose}
            aria-label="Chiudi"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-3)]"
          >
            <X className="h-4 w-4 text-[var(--muted-text)]" />
          </button>
        </div>

        {/* Group name (optional) */}
        <div className="px-4 pb-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome del gruppo (opzionale)"
            maxLength={60}
            className="w-full rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        {/* Search */}
        <div className="relative px-4 pb-2">
          <Search className="absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-text)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cerca giocatori…"
            className="w-full rounded-2xl bg-[var(--surface-2)] py-3 pl-10 pr-4 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </div>

        {/* Player list */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          {players === null ? (
            <p className="py-10 text-center text-sm text-[var(--muted-text)]">Carico…</p>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--muted-text)]">Nessun giocatore</p>
          ) : (
            <div className="space-y-1 pb-2">
              {filtered.map((p) => {
                const on = selected.has(p.id)
                return (
                  <button
                    key={p.id}
                    onClick={() => toggle(p.id)}
                    className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 active:bg-white/5"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-3)]">
                      {p.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.avatarUrl} alt={p.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs font-black text-[var(--muted-text)]">
                          {p.name.slice(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="min-w-0 flex-1 truncate text-left font-bold text-white">{p.name}</span>
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                        on ? "border-transparent bg-[var(--accent)]" : "border-[var(--surface-3)]"
                      }`}
                    >
                      {on && <Check className="h-4 w-4 text-black" />}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Create */}
        <div className="px-4 pb-6 pt-2" style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1.25rem)" }}>
          <button
            onClick={create}
            disabled={selected.size < 2 || creating}
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-black transition-opacity active:opacity-80 disabled:opacity-40"
            style={{ background: "var(--accent)" }}
          >
            {creating ? "Creo…" : `Crea gruppo${selected.size >= 2 ? ` (${selected.size})` : ""}`}
          </button>
          {selected.size < 2 && (
            <p className="mt-2 text-center text-xs text-[var(--muted-text)]">Seleziona almeno 2 giocatori</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
