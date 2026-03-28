import Link from "next/link"
import { Shield, Hand, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Player } from "@/generated/prisma/client"

interface SanderCardMiniProps {
  player: Player
}

export function SanderCardMini({ player }: SanderCardMiniProps) {
  const isDif = player.difPct >= player.murPct

  return (
    <Link
      href={`/players/${player.id}`}
      className="flex min-h-[4rem] items-center gap-4 rounded-2xl bg-[var(--surface-1)] px-4 transition-colors hover:bg-[var(--surface-2)] active:scale-[0.99] active:opacity-80"
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black overflow-hidden",
          isDif ? "bg-blue-800 text-blue-200" : "bg-orange-800 text-orange-200",
        )}
      >
        {player.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={player.avatarUrl} alt={player.name} className="h-full w-full object-cover" />
        ) : (
          player.name.slice(0, 2).toUpperCase()
        )}
      </div>

      {/* Info */}
      <div className="flex-1">
        <div className="flex items-center gap-1.5">
          <p className="font-bold">{player.name}</p>
          <span className="rounded-full bg-[var(--surface-3)] px-1.5 py-0.5 text-[10px] font-black text-[var(--muted-text)]">
            Lv.{player.level}
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-[var(--muted-text)]">
          <span className="flex items-center gap-1">
            {isDif
              ? <Shield className="h-3 w-3" />
              : <span className="flex gap-px"><Hand className="h-3 w-3 -scale-x-100" /><Hand className="h-3 w-3" /></span>
            }
            {isDif ? "Difensore" : "Giocatore di muro"}
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {player.winRatePct}% win
          </span>
        </div>
      </div>

      {/* Win record */}
      <div className="text-right">
        <p className="text-sm font-bold">
          {player.matchesWon}
          <span className="font-normal text-[var(--muted-text)]">V</span>{" "}
          {player.matchesLost}
          <span className="font-normal text-[var(--muted-text)]">S</span>
        </p>
        {player.tournamentsWon > 0 && (
          <p className="text-xs text-[var(--accent)]">{player.tournamentsWon}x🏆</p>
        )}
      </div>
    </Link>
  )
}
