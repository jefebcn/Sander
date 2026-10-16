"use client"

import { useState } from "react"
import { deleteTournament } from "@/actions/tournaments"

export function AdminDeleteTournamentButton({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await deleteTournament(id)
    } catch {
      setLoading(false)
      setConfirm(false)
    }
  }

  if (loading) {
    return (
      <span className="flex min-h-[2.75rem] shrink-0 items-center px-3 text-sm text-[var(--muted-text)]">
        ...
      </span>
    )
  }

  if (confirm) {
    return (
      <button
        onClick={handleDelete}
        className="flex min-h-[2.75rem] shrink-0 items-center rounded-lg px-3 text-sm font-bold text-white"
        style={{ background: "var(--danger)" }}
      >
        Conferma
      </button>
    )
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); setConfirm(true) }}
      className="flex min-h-[2.75rem] shrink-0 items-center rounded-lg px-3 text-sm font-semibold"
      style={{ background: "color-mix(in srgb, var(--danger) 13%, transparent)", color: "var(--danger)" }}
    >
      Elimina
    </button>
  )
}
