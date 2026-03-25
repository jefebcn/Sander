import Link from "next/link"
import { Shield, Swords, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Player } from "@/generated/prisma/client"

interface SanderCardMiniProps {
  player: Player
}

export function SanderCardMini({ player }: SanderCardMiniProps) {
  const isBlocker = player.preferredRole === "BLOCKER"

  return (
    <Link
      href={`/players/${player.id}`}
      className="flex min-h-[4rem] items-center gap-4 rounded-2xl bg-[var(--surface-1)] px-4 transition-colors hover:bg-[var(--surface-2)] active:scale-[0.99] active:opacity-80"
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-black",
          isBlocker ? "bg-blue-800 text-blue-200" : "bg-orange-800 text-orange-200",
        )}
      >
        {player.name.slice(0, 2).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1">
        <p className="font-bold">{player.name}</p>
        <div className="flex items-center gap-3 text-xs text-[var(--muted-text)]">
          <span className="flex items-center gap-1">
            {isBlocker ? <Swords className="h-3 w-3" /> : <Shield className="h-3 w-3" />}
            {isBlocker ? "Attaccante" : "Difensore"}
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
