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
  /** What the kudos is for, read by screen readers: "Dai un fuoco a {label}". */
  label: string
}

export function KudosButton({ targetType, targetId, initialCount, initialReacted, canReact, label }: Props) {
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
      type="button"
      onClick={handle}
      disabled={!canReact}
      className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center gap-1.5 rounded-full px-3 text-base font-bold transition-colors"
      style={{
        background: reacted ? "color-mix(in srgb, var(--defender) 15%, transparent)" : "var(--surface-3)",
        color: reacted ? "var(--defender)" : "var(--muted-text)",
        cursor: canReact ? "pointer" : "default",
      }}
      aria-pressed={reacted}
      aria-label={
        canReact
          ? `Dai un fuoco a ${label}${count > 0 ? ` (${count})` : ""}`
          : `${count} fuochi per ${label}. Accedi per darne uno`
      }
    >
      <Flame className="h-5 w-5" style={reacted ? { fill: "var(--defender)" } : undefined} aria-hidden="true" />
      {count > 0 && <span aria-hidden="true">{count}</span>}
    </button>
  )
}
