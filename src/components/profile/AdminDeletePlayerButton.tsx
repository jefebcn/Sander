"use client"

import { useState } from "react"
import { deletePlayer } from "@/actions/players"

export function AdminDeletePlayerButton({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await deletePlayer(id)
    } catch {
      setLoading(false)
      setConfirm(false)
    }
  }

  if (loading) {
    return (
      <span className="shrink-0 rounded-lg px-2 py-1 text-xs text-[var(--muted-text)]">
        ...
      </span>
    )
  }

  if (confirm) {
    return (
      <button
        onClick={handleDelete}
        className="shrink-0 rounded-lg px-2 py-1 text-xs font-bold text-white"
        style={{ background: "#ef4444" }}
      >
        Conferma
      </button>
    )
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); setConfirm(true) }}
      className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold"
      style={{ background: "#ef444420", color: "#ef4444" }}
    >
      Elimina
    </button>
  )
}
