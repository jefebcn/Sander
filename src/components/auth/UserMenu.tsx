"use client"

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import Link from "next/link"
import type { Session } from "next-auth"

interface UserMenuProps {
  session: Session | null
  playerName?: string | null
}

export function UserMenu({ session, playerName }: UserMenuProps) {
  if (!session) return null

  const initials = (playerName ?? session.user?.name ?? "?")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/players"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-black text-black"
        aria-label="Profilo giocatore"
      >
        {initials}
      </Link>
      <button
        onClick={() => signOut()}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface-2)] text-[var(--muted-text)] transition-colors hover:bg-[var(--surface-3)]"
        aria-label="Esci"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
