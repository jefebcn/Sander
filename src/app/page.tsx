import Link from "next/link"
import { Trophy, Users, Sun } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-10 px-6 py-12">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-[var(--accent)] shadow-lg shadow-[var(--accent)]/30">
          <Sun className="h-10 w-10 text-black" />
        </div>
        <h1 className="text-4xl font-black tracking-tight text-[var(--foreground)]">
          SANDER
        </h1>
        <p className="text-center text-base text-[var(--muted-text)]">
          Beach Volleyball Tournament Manager
        </p>
      </div>

      {/* Quick actions */}
      <div className="w-full max-w-sm space-y-3">
        <Link
          href="/tournaments"
          className="flex min-h-[4rem] w-full items-center gap-4 rounded-2xl bg-[var(--accent)] px-5 font-bold text-black transition-opacity active:opacity-80"
        >
          <Trophy className="h-6 w-6 shrink-0" />
          <div>
            <div className="text-lg font-black">Tornei</div>
            <div className="text-xs font-medium opacity-70">Crea e gestisci tornei</div>
          </div>
        </Link>

        <Link
          href="/players"
          className="flex min-h-[4rem] w-full items-center gap-4 rounded-2xl bg-[var(--surface-2)] px-5 font-bold text-[var(--foreground)] transition-opacity active:opacity-80"
        >
          <Users className="h-6 w-6 shrink-0 text-[var(--sky)]" />
          <div>
            <div className="text-lg font-bold">Giocatori</div>
            <div className="text-xs text-[var(--muted-text)]">SanderCard & statistiche</div>
          </div>
        </Link>
      </div>
    </div>
  )
}
