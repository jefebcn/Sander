import Link from "next/link"
import { Plus, Users } from "lucide-react"
import { listPlayers } from "@/actions/players"
import { PageHeader } from "@/components/layout/PageHeader"
import { SanderCardMini } from "@/components/player/SanderCardMini"

export const dynamic = "force-dynamic"

export default async function PlayersPage() {
  const players = await listPlayers()

  return (
    <div>
      <PageHeader
        title="Giocatori"
        subtitle={`${players.length} atleti`}
        action={
          <Link
            href="/players/new"
            className="flex h-11 items-center gap-2 rounded-xl bg-[var(--accent)] px-4 text-sm font-bold text-black"
          >
            <Plus className="h-5 w-5" />
            Nuovo
          </Link>
        }
      />

      {players.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-6 py-20 text-center">
          <Users className="h-16 w-16 text-[var(--muted)]" />
          <div>
            <p className="text-lg font-semibold">Nessun giocatore ancora</p>
            <p className="text-sm text-[var(--muted-text)]">
              Aggiungi il primo giocatore per iniziare
            </p>
          </div>
          <Link
            href="/players/new"
            className="flex h-14 items-center gap-2 rounded-2xl bg-[var(--accent)] px-6 font-bold text-black"
          >
            <Plus className="h-5 w-5" />
            Aggiungi Giocatore
          </Link>
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
