"use client"

import { useState, useTransition } from "react"
import { BellRing } from "lucide-react"
import { setNudgesOptOut } from "@/actions/profile"
import { cn } from "@/lib/utils"

/** On/off for "manca un giocatore" pushes. */
export function NudgeToggle({ initialOptOut }: { initialOptOut: boolean }) {
  const [on, setOn] = useState(!initialOptOut)
  const [pending, startTransition] = useTransition()

  function toggle() {
    const next = !on
    setOn(next)
    startTransition(async () => {
      try {
        await setNudgesOptOut({ optOut: !next })
      } catch {
        setOn(!next) // revert on failure
      }
    })
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      disabled={pending}
      className="flex min-h-[3.5rem] w-full items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 py-3 text-left"
    >
      <BellRing className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
      <span className="min-w-0 flex-1">
        <span className="block text-base font-bold text-white">Avvisami se manca un giocatore</span>
        <span className="block text-sm text-[var(--muted-text)]">
          Solo partite nel tuo comune o quando sei libero, al massimo una volta al giorno.
        </span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors",
          on ? "bg-[var(--accent)]" : "bg-[var(--surface-4)]",
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-[left] duration-200",
            on ? "left-6" : "left-1",
          )}
        />
      </span>
    </button>
  )
}
