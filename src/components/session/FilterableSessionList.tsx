"use client"

import { useState } from "react"
import { Volleyball } from "lucide-react"
import { SessionCard } from "@/components/session/SessionCard"
import { cn } from "@/lib/utils"

const FORMAT_LABEL: Record<string, string> = {
  TWO_VS_TWO: "2v2",
  THREE_VS_THREE: "3v3",
  FOUR_VS_FOUR: "4v4",
}

type Session = Parameters<typeof SessionCard>[0]["session"]

interface FilterableSessionListProps {
  sessions: Session[]
}

export function FilterableSessionList({ sessions }: FilterableSessionListProps) {
  const [format, setFormat] = useState("")

  const filterFn = (s: Session) => !format || s.format === format

  const open = sessions.filter((s) => (s.status === "OPEN" || s.status === "FULL") && filterFn(s))
  const completed = sessions.filter((s) => s.status === "COMPLETED" && filterFn(s))

  return (
    <>
      {/* Format filter pills */}
      <div
        className="flex gap-2 px-4 pb-3 overflow-x-auto"
        style={{ scrollbarWidth: "none" }}
      >
        {["", "TWO_VS_TWO", "THREE_VS_THREE", "FOUR_VS_FOUR"].map((f) => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-bold shrink-0 transition-colors",
              format === f
                ? "bg-[var(--accent)] text-black"
                : "bg-[var(--surface-2)] text-[var(--muted-text)]",
            )}
          >
            {f === "" ? "Tutti" : FORMAT_LABEL[f]}
          </button>
        ))}
      </div>

      {/* Session list */}
      <div className="space-y-5 px-4 flex-1">
        {open.length > 0 && (
          <section aria-label="Sessioni aperte">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              Aperte
            </p>
            <div className="space-y-2">
              {open.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section aria-label="Sessioni completate">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
              Recenti
            </p>
            <div className="space-y-2">
              {completed.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>
          </section>
        )}

        {open.length === 0 && completed.length === 0 && (
          <div className="flex flex-col items-center gap-3 pt-16 text-center">
            <Volleyball className="h-12 w-12 opacity-20" />
            <p className="text-[var(--muted-text)]">
              {format ? "Nessuna sessione per questo formato" : "Nessuna sessione ancora"}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
