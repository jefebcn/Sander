export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { CalendarCheck, CalendarX, BadgeCheck } from "lucide-react"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"
import { formatWhen } from "@/lib/datetime"
import { reliabilityPct, isVerified, LATE_CANCEL_MS, VERIFIED_MIN_GAMES, VERIFIED_MIN_RELIABILITY, DISPUTE_DAYS } from "@/lib/scopri/reliability"
import { PageHeader } from "@/components/layout/PageHeader"
import { DisputeAbsenceButton } from "@/components/profile/DisputeAbsenceButton"

export const metadata: Metadata = { title: "Le tue presenze — SANDER" }

/** Your attendance as others see it, every absence behind it, and "Ero presente". */
export default async function PresenzePage() {
  const player = await getCurrentPlayer()
  if (!player) redirect("/auth/signin?callbackUrl=/profile/presenze")
  const events = await db.attendanceEvent.findMany({
    where: { playerId: player.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, kind: true, createdAt: true, sessionId: true, disputedAt: true, resolvedAt: true },
  })
  const sessions = await db.session.findMany({
    where: { id: { in: events.map((e) => e.sessionId).filter((x): x is string => !!x) } },
    select: { id: true, title: true, date: true },
  })
  const byId = new Map(sessions.map((s) => [s.id, s]))
  const counted = events.filter((e) => !e.disputedAt || e.resolvedAt).length
  const pct = reliabilityPct(player.sessionsPlayed, counted)
  const verified = isVerified(player.sessionsPlayed, pct)
  const now = Date.now()

  return (
    <div className="pb-10">
      <PageHeader eyebrow="Profilo" tone="social" title="Le tue presenze" backHref="/profile" />
      <div className="flex flex-col gap-4 px-4">
        <section className="tone-social rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-5 shadow-[var(--shadow-card)] ring-1 ring-[var(--tone-line)]">
          <p className="eyebrow text-[var(--tone)]">Affidabilità</p>
          <p className="num mt-1 text-5xl leading-none text-white">{pct === null ? "—" : `${pct}%`}</p>
          <p className="mt-2 text-base text-[var(--muted-text)]">
            {player.sessionsPlayed} partite giocate · {counted} {counted === 1 ? "assenza" : "assenze"}
          </p>
          {verified ? (
            <p className="mt-3 flex items-center gap-2 text-base font-bold text-white">
              <BadgeCheck className="h-5 w-5 text-[var(--social)]" aria-hidden="true" /> Giocatore verificato
            </p>
          ) : (
            <p className="mt-3 text-sm text-[var(--muted-text)]">
              Il badge Verificato arriva con almeno {VERIFIED_MIN_GAMES} partite e il {VERIFIED_MIN_RELIABILITY}% di presenze.
            </p>
          )}
        </section>

        <p className="text-sm text-[var(--muted-text)]">
          Conta come assenza uscire da una partita a meno di {LATE_CANCEL_MS / 3600_000} ore dall&apos;inizio, o essere segnato
          &quot;non presentato&quot; dall&apos;organizzatore. Se c&apos;eri, entro {DISPUTE_DAYS} giorni puoi contestarlo.
        </p>

        {events.length === 0 ? (
          <p className="rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 text-base text-white">Nessuna assenza. Continua così!</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {events.map((e) => {
              const s = e.sessionId ? byId.get(e.sessionId) : undefined
              const title = s ? `${s.title} · ${formatWhen(s.date)}` : formatWhen(e.createdAt)
              const canDispute = e.kind === "NO_SHOW" && !e.disputedAt && now - e.createdAt.getTime() <= DISPUTE_DAYS * 86_400_000
              return (
                <li key={e.id} className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-4)] text-[var(--warning)]">
                    {e.kind === "NO_SHOW" ? <CalendarX className="h-5 w-5" aria-hidden="true" /> : <CalendarCheck className="h-5 w-5" aria-hidden="true" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-extrabold text-white">
                      {e.kind === "NO_SHOW" ? "Non presentato" : "Uscita all'ultimo momento"}
                    </span>
                    <span className="block truncate text-sm text-[var(--muted-text)]">{title}</span>
                    {e.disputedAt && (
                      <span className="block text-sm font-bold text-[var(--social)]">
                        {e.resolvedAt ? "Contestazione respinta: conta" : "Contestata: non conta finché un admin non decide"}
                      </span>
                    )}
                  </span>
                  {canDispute && <DisputeAbsenceButton eventId={e.id} title={s?.title ?? "La partita"} />}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
