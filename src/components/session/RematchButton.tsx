"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { RotateCcw } from "lucide-react"
import { createRematch } from "@/actions/sessions"

export function RematchButton({ sessionId }: { sessionId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleRematch() {
    startTransition(async () => {
      const newId = await createRematch(sessionId)
      router.push(`/sessions/${newId}`)
    })
  }

  return (
    <button
      onClick={handleRematch}
      disabled={isPending}
      className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-base transition-opacity disabled:opacity-60"
      style={{ background: "var(--surface-2)", color: "var(--accent)" }}
    >
      <RotateCcw className="h-5 w-5" />
      {isPending ? "Creazione..." : "Rivincita rapida"}
    </button>
  )
}
