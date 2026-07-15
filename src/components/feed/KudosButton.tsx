"use client"

import { useState, useTransition } from "react"
import { Flame } from "lucide-react"
import { toggleReaction, type ReactionTargetType } from "@/actions/reactions"

interface Props {
  targetType: ReactionTargetType
  targetId: string
  initialCount: number
  initialReacted: boolean
  canReact: boolean
}

export function KudosButton({ targetType, targetId, initialCount, initialReacted, canReact }: Props) {
  const [count, setCount] = useState(initialCount)
  const [reacted, setReacted] = useState(initialReacted)
  const [pending, startTransition] = useTransition()

  function handle() {
    if (!canReact || pending) return
    // Optimistic
    const nextReacted = !reacted
    setReacted(nextReacted)
    setCount((c) => c + (nextReacted ? 1 : -1))
    startTransition(async () => {
      try {
        const res = await toggleReaction(targetType, targetId)
        setReacted(res.reacted)
        setCount(res.count)
      } catch {
        // revert on failure
        setReacted(!nextReacted)
        setCount((c) => c + (nextReacted ? -1 : 1))
      }
    })
  }

  return (
    <button
      onClick={handle}
      disabled={!canReact}
      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition-colors"
      style={{
        background: reacted ? "rgba(249,115,22,0.15)" : "var(--surface-3)",
        color: reacted ? "#f97316" : "var(--muted-text)",
        cursor: canReact ? "pointer" : "default",
      }}
      aria-pressed={reacted}
    >
      <Flame className="h-4 w-4" style={reacted ? { fill: "#f97316" } : undefined} />
      {count > 0 && <span>{count}</span>}
    </button>
  )
}
