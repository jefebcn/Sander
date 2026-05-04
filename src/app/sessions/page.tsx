export const dynamic = "force-dynamic"

import Link from "next/link"
import { Plus } from "lucide-react"
import { getSessions } from "@/actions/sessions"
import { FilterableSessionList } from "@/components/session/FilterableSessionList"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { SessionsInfoSheet } from "@/components/session/SessionsInfoSheet"

export default async function SessionsPage() {
  const currentPlayer = await getCurrentPlayer()
  const sessions = await getSessions(currentPlayer?.id)

  return (
    <div className="flex flex-col pb-6">

      {/* ── Page title ────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-4">
        <h1 className="text-2xl font-black text-white">Partite</h1>
        <SessionsInfoSheet />
      </div>

      {/* ── Session list with format filters ─────────────────── */}
      <FilterableSessionList
        sessions={sessions.map((s) => ({ ...s, status: s.status as "OPEN" | "FULL" | "COMPLETED" | "CANCELLED" }))}
      />

      {/* ── + Crea una partita CTA ────────────────────────────── */}
      {currentPlayer && (
        <div className="sticky bottom-[5rem] px-4 pt-6">
          <Link
            href="/sessions/new"
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-black text-base transition-opacity active:opacity-80"
            style={{ background: "var(--accent)" }}
          >
            <Plus className="h-5 w-5" />
            Crea una partita
          </Link>
        </div>
      )}
    </div>
  )
}
