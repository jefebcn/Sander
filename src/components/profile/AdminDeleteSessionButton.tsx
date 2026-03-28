"use client"

import { useState } from "react"
import { Trash2 } from "lucide-react"
import { adminDeleteSession } from "@/actions/sessions"

export function AdminDeleteSessionButton({ id }: { id: string }) {
  const [confirm, setConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    setLoading(true)
    try {
      await adminDeleteSession(id)
    } catch {
      setLoading(false)
      setConfirm(false)
    }
  }

  if (loading) {
    return <span className="shrink-0 text-xs text-[var(--muted-text)]">...</span>
  }

  if (confirm) {
    return (
      <button
        onClick={handleDelete}
        className="shrink-0 text-xs font-bold"
        style={{ color: "#ef4444" }}
      >
        Conferma
      </button>
    )
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); setConfirm(true) }}
      className="shrink-0 p-1 text-[var(--muted-text)]"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </button>
  )
}
