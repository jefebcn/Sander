"use client"

import { useState, useTransition } from "react"
import { adminSetRegistrationSkillLevel } from "@/actions/registration"

interface AdminSkillLevelSelectProps {
  registrationId: string
  current: number | null
  playerName: string
}

export function AdminSkillLevelSelect({
  registrationId,
  current,
  playerName,
}: AdminSkillLevelSelectProps) {
  const [value, setValue] = useState<number | "">(current ?? "")
  const [isPending, startTransition] = useTransition()

  return (
    <select
      value={value}
      disabled={isPending}
      onChange={(e) => {
        const lvl = Number(e.target.value)
        if (lvl !== 1 && lvl !== 2 && lvl !== 3) return
        const prev = value
        setValue(lvl)
        startTransition(async () => {
          try {
            await adminSetRegistrationSkillLevel({ registrationId, skillLevel: lvl })
          } catch {
            setValue(prev)
          }
        })
      }}
      className="shrink-0 rounded-lg bg-[var(--surface-2)] px-2 py-1 text-xs font-semibold text-[var(--foreground)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-60"
      aria-label={`Livello di ${playerName}`}
    >
      <option value="" disabled>
        Livello
      </option>
      <option value={1}>L1</option>
      <option value={2}>L2</option>
      <option value={3}>L3</option>
    </select>
  )
}
