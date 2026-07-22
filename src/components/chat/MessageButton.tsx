"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { MessageCircle } from "lucide-react"
import { getOrCreateDmThread } from "@/actions/messages"

/**
 * "Scrivi" button that opens (or creates) a 1:1 chat with another player.
 * `compact` = icon-only pill (for the /trova cards); otherwise a full labeled button.
 */
export function MessageButton({
  playerId,
  compact = false,
  label = "Scrivi",
}: {
  playerId: string
  compact?: boolean
  label?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function go(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    setLoading(true)
    try {
      const id = await getOrCreateDmThread(playerId)
      router.push(`/messaggi/${id}`)
    } catch {
      setLoading(false)
    }
  }

  if (compact) {
    return (
      <button
        onClick={go}
        disabled={loading}
        aria-label="Scrivi"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-3)] text-[var(--accent)] active:opacity-80 disabled:opacity-50"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
    )
  }

  return (
    <button
      onClick={go}
      disabled={loading}
      className="flex min-h-[3.25rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-black active:opacity-80 disabled:opacity-50"
      style={{ background: "var(--accent)" }}
    >
      <MessageCircle className="h-5 w-5" />
      {loading ? "Apro…" : label}
    </button>
  )
}
