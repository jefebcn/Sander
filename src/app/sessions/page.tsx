export const dynamic = "force-dynamic"

import Link from "next/link"
import { Plus, Volleyball } from "lucide-react"
import { getSessions } from "@/actions/sessions"
import { SessionCard } from "@/components/session/SessionCard"
import { PageHeader } from "@/components/layout/PageHeader"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"

export default async function SessionsPage() {
  const [sessions, currentPlayer] = await Promise.all([getSessions(), getCurrentPlayer()])

  const open = sessions.filter((s) => s.status === "OPEN" || s.status === "FULL")
  const completed = sessions.filter((s) => s.status === "COMPLETED")

  return (
    <div className="pb-6">
      <PageHeader
        title="Partite"
        subtitle={`${open.length} ${open.length === 1 ? "aperta" : "aperte"}`}
        action={
          currentPlayer ? (
            <Link
              href="/sessions/new"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent)]"
              aria-label="Crea sessione"
            >
              <Plus className="h-5 w-5 text-black" aria-hidden="true" />
            </Link>
          ) : null
        }
      />

      <div className="space-y-5 px-4">
        {open.length > 0 && (
          <section aria-label="Sessioni aperte">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-[var(--accent)]">
              Aperte
            </p>
            <div className="space-y-2">
              {open.map((s) => (
                <SessionCard
                  key={s.id}
                  session={{
                    ...s,
                    status: s.status as "OPEN" | "FULL" | "COMPLETED" | "CANCELLED",
                  }}
                />
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
                <SessionCard
                  key={s.id}
                  session={{
                    ...s,
                    status: s.status as "OPEN" | "FULL" | "COMPLETED" | "CANCELLED",
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {sessions.length === 0 && (
          <div className="flex flex-col items-center gap-3 pt-16 text-center">
            <Volleyball className="h-12 w-12 opacity-20" aria-hidden="true" />
            <p className="text-[var(--muted-text)]">Nessuna sessione ancora</p>
            {currentPlayer && (
              <Link
                href="/sessions/new"
                className="flex min-h-[3.5rem] items-center gap-2 rounded-2xl bg-[var(--accent)] px-6 font-bold text-black"
              >
                <Plus className="h-5 w-5" />
                Crea la prima sessione
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
