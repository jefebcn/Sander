"use client"

import { useState } from "react"
import { Volleyball, Calendar } from "lucide-react"
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
  const now = new Date()

  const upcoming = sessions.filter(
    (s) => (s.status === "OPEN" || s.status === "FULL") && new Date(s.date) > now && filterFn(s),
  )
  const open = sessions.filter(
    (s) => (s.status === "OPEN" || s.status === "FULL") && new Date(s.date) <= now && filterFn(s),
  )
  const completed = sessions.filter((s) => s.status === "COMPLETED" && filterFn(s))

  const anyVisible = upcoming.length > 0 || open.length > 0 || completed.length > 0

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
        {upcoming.length > 0 && (
          <section aria-label="Sessioni in programma">
            <div className="mb-2 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-[var(--accent)]" />
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
                In programma
              </p>
            </div>
            <div className="space-y-2">
              {upcoming.map((s) => (
                <SessionCard key={s.id} session={s} />
              ))}
            </div>
          </section>
        )}

        {open.length > 0 && (
          <section aria-label="Sessioni aperte">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
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

        {!anyVisible && (
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
