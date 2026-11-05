"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { createCircuit } from "@/actions/clubs"

/** "Nuovo circuito": a name, then the club's tournaments can join it as stages. */
export function CircuitCreateForm({ clubId }: { clubId: string }) {
  const [name, setName] = useState("")
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          const res = await createCircuit({ clubId, name })
          if (!res.ok) return void toast.error(res.error)
          setName("")
          toast.success("Circuito creato: aggiungi i tornei come tappe")
          router.refresh()
        })
      }}
      className="flex gap-2"
    >
      <label htmlFor="circuit-name" className="sr-only">Nome del circuito</label>
      <input
        id="circuit-name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Es. Deadly Tournaments 2026/27"
        maxLength={60}
        className="min-h-[3.5rem] min-w-0 flex-1 rounded-2xl bg-[var(--surface-2)] px-4 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      />
      <button type="submit" disabled={pending || name.trim().length < 3} aria-label="Crea circuito" className="btn btn-primary min-h-[3.5rem] px-4 disabled:opacity-50">
        <Plus className="h-5 w-5" aria-hidden="true" />
      </button>
    </form>
  )
}
