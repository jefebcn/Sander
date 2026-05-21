"use client"

import { useState, useTransition } from "react"
import { UserPlus, Loader2, X } from "lucide-react"
import { addGuestToSession } from "@/actions/sessions"

interface Props {
  sessionId: string
}

export function AddGuestButton({ sessionId }: Props) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleAdd() {
    if (!name.trim()) return
    setError(null)
    startTransition(async () => {
      try {
        const res = await addGuestToSession(sessionId, name)
        if (res.ok) { setName(""); setOpen(false) }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Errore")
      }
    })
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold text-[var(--muted-text)] transition-colors hover:text-white"
      >
        <UserPlus className="h-4 w-4" />
        Aggiungi ospite
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-[var(--surface-2)] p-3">
      <div className="flex items-center gap-2">
        <input
          autoFocus
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Nome ospite"
          className="flex-1 rounded-xl bg-[var(--surface-3)] px-3 py-2 text-sm text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <button
          onClick={handleAdd}
          disabled={pending || !name.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-black disabled:opacity-50"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        </button>
        <button
          onClick={() => { setOpen(false); setName("") }}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-3)] text-[var(--muted-text)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
    </div>
  )
}
