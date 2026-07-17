export const dynamic = "force-dynamic"

import { Coins } from "lucide-react"
import { listPlayers } from "@/actions/players"
import { PageHeader } from "@/components/layout/PageHeader"
import { CreateTournamentForm } from "@/components/tournament/CreateTournamentForm"
import { getCurrentPlayer, getCurrentSession } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"
import { isAdminEmail } from "@/lib/isAdmin"
import { TOURNAMENT_CREATION_SC } from "@/lib/pricing"

export default async function NewTournamentPage() {
  const [players, player, session] = await Promise.all([
    listPlayers(),
    getCurrentPlayer(),
    getCurrentSession(),
  ])

  const isAdmin = isAdminEmail(session?.user?.email)
  const credits =
    !isAdmin && player
      ? (await db.player.findUnique({ where: { id: player.id }, select: { sanderCredits: true } }))
          ?.sanderCredits ?? 0
      : 0
  const canAfford = credits >= TOURNAMENT_CREATION_SC

  return (
    <div>
      <PageHeader title="Nuovo Torneo" />

      {/* Cost banner for non-admins */}
      {!isAdmin && (
        <div className="mx-4 mb-3">
          <div
            className="flex items-center gap-3 rounded-2xl p-4"
            style={{
              background: canAfford ? "rgba(201,243,29,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${canAfford ? "rgba(201,243,29,0.25)" : "rgba(239,68,68,0.3)"}`,
            }}
          >
            <Coins
              className={`h-6 w-6 shrink-0 ${canAfford ? "text-[var(--accent)]" : "text-red-400"}`}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-white">
                Creare un torneo costa {TOURNAMENT_CREATION_SC} SC
              </p>
              <p className="text-xs text-[var(--muted-text)]">
                Saldo attuale:{" "}
                <span className={canAfford ? "font-bold text-[var(--accent)]" : "font-bold text-red-400"}>
                  {credits} SC
                </span>
                {!canAfford && " — ricarica dal profilo per continuare"}
              </p>
            </div>
          </div>
        </div>
      )}

      <CreateTournamentForm players={players} />
    </div>
  )
}
