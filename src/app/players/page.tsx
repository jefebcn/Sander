import { Users } from "lucide-react"
import { listPlayers } from "@/actions/players"
import { PageHeader } from "@/components/layout/PageHeader"
import { SanderCardMini } from "@/components/player/SanderCardMini"

export const dynamic = "force-dynamic"

export default async function PlayersPage() {
  const players = await listPlayers()

  return (
    <div className="pb-6">
      <PageHeader
        title="Giocatori"
        subtitle={`${players.length} atleti`}
      />

      {players.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
          <Users className="h-16 w-16 text-[var(--muted)]" />
          <p className="text-lg font-semibold">Nessun giocatore ancora</p>
          <p className="text-sm text-[var(--muted-text)]">
            Registrati e crea il tuo profilo per apparire qui
          </p>
        </div>
      ) : (
        <div className="space-y-3 px-4">
          {players.map((player) => (
            <SanderCardMini key={player.id} player={player} />
          ))}
        </div>
      )}
    </div>
  )
}
