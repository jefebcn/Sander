export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { Plus, Gauge } from "lucide-react"
import { getSessions } from "@/actions/sessions"
import { FilterableSessionList } from "@/components/session/FilterableSessionList"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { SessionsInfoSheet } from "@/components/session/SessionsInfoSheet"
import { PageHeader } from "@/components/layout/PageHeader"
import { QuickActionsButton } from "@/components/layout/QuickActionsButton"
import { SectionTabs, PLAY_TABS } from "@/components/layout/SectionTabs"
import { db } from "@/lib/db"

export const metadata: Metadata = {
  title: "Partite di beach volley vicino a te | SANDER",
  description:
    "Trova una partita di beach volley con un posto libero vicino a te, o creane una: 2v2, 3v3, 4v4.",
}

export default async function SessionsPage() {
  const currentPlayer = await getCurrentPlayer()
  const [sessions, recent] = await Promise.all([
    getSessions(currentPlayer?.id),
    // Shown only when nothing is open: proof that people play here.
    db.session.findMany({
      where: { status: "COMPLETED", date: { gte: new Date(Date.now() - 60 * 86_400_000) } },
      orderBy: { date: "desc" },
      take: 5,
      select: { id: true, title: true, location: true, city: true, date: true, _count: { select: { participants: true } } },
    }),
  ])
  const recentPlayed = recent.map((r) => ({
    id: r.id,
    title: r.title,
    place: r.city ?? r.location,
    date: r.date.toISOString(),
    players: r._count.participants,
  }))

  return (
    <div className="flex flex-col pb-6">

      <PageHeader eyebrow="Gioca" title="Partite" tone="play" action={<div className="flex items-center gap-2"><SessionsInfoSheet /><QuickActionsButton /></div>} />
      <SectionTabs items={PLAY_TABS} active="partite" className="pb-4" />

      {/* ── CTA ───────────────────────────────────────────────── */}
      {currentPlayer ? (
        <div className="flex gap-2 px-4 pb-4">
          <Link
            href="/sessions/new"
            className="btn btn-primary flex-1"
          >
            <Plus className="h-5 w-5" />
            Crea una partita
          </Link>
          <Link
            href="/segna"
            title="Tabellone libero: conta i punti senza registrare il risultato"
            className="btn btn-secondary px-5"
          >
            <Gauge className="h-5 w-5" />
            Tabellone
          </Link>
        </div>
      ) : (
        /* Logged-out newcomer: one clear primary action, not the power-user "Segna" */
        <div className="px-4 pb-4">
          <Link
            href="/auth/signin?callbackUrl=%2Fsessions%2Fnew&mode=register"
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-full font-black text-black text-base transition-opacity active:opacity-80"
            style={{ background: "var(--accent)" }}
          >
            <Plus className="h-5 w-5" />
            Accedi per creare una partita
          </Link>
        </div>
      )}

      {/* ── Session list with format filters ─────────────────── */}
      <FilterableSessionList
        sessions={sessions.map((s) => ({ ...s, status: s.status as "OPEN" | "FULL" | "COMPLETED" | "CANCELLED" }))}
        isLoggedIn={!!currentPlayer}
        recentPlayed={recentPlayed}
      />
    </div>
  )
}
