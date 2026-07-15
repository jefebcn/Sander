export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { TrendingUp, Flame, Trophy, ArrowUpRight, Medal } from "lucide-react"
import { getWeeklyRecap } from "@/actions/recap"
import { ShareButton } from "@/components/ui/ShareButton"

export const metadata: Metadata = {
  title: "La settimana su SANDER — Classifica Beach Volley",
  description:
    "Chi è salito di più questa settimana su SANDER? Movers, giocatore della settimana e i più attivi della community beach volley.",
  openGraph: {
    title: "La settimana su SANDER 🏐",
    description: "Movers, giocatore della settimana e i più attivi.",
    images: [{ url: "/api/story/weekly", width: 1080, height: 1920 }],
  },
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("it-IT", { day: "2-digit", month: "short" })
}

function Avatar({ name, url, size = 44 }: { name: string; url: string | null; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-[var(--surface-1)] text-sm font-black text-[var(--muted-text)] overflow-hidden"
      style={{ width: size, height: size }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        name.slice(0, 2).toUpperCase()
      )}
    </div>
  )
}

export default async function WeeklyPage() {
  const recap = await getWeeklyRecap()
  const potw = recap.playerOfWeek

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
          {fmt(recap.weekStart)} – {fmt(recap.weekEnd)}
        </p>
        <h1 className="mt-1 text-3xl font-black text-white">La settimana</h1>
        <p className="mt-1 text-sm text-[var(--muted-text)]">
          {recap.totalEvents} {recap.totalEvents === 1 ? "partita" : "partite"} ·{" "}
          {recap.activePlayers} {recap.activePlayers === 1 ? "giocatore attivo" : "giocatori attivi"}
        </p>
      </div>

      {recap.activePlayers === 0 ? (
        <div className="mx-4 rounded-2xl bg-[var(--surface-2)] p-8 text-center">
          <Flame className="mx-auto mb-3 h-10 w-10 text-[var(--muted-text)] opacity-40" />
          <p className="font-bold text-white">Nessuna partita questa settimana</p>
          <p className="mt-1 text-sm text-[var(--muted-text)]">
            Organizza una partita e comincia a scalare la classifica.
          </p>
          <Link
            href="/sessions/new"
            className="mt-4 inline-flex min-h-[3rem] items-center justify-center rounded-2xl px-6 font-black text-black"
            style={{ background: "var(--accent)" }}
          >
            Crea una partita
          </Link>
        </div>
      ) : (
        <div className="space-y-5 px-4">
          {/* Player of the week */}
          {potw && (
            <div
              className="rounded-3xl p-5"
              style={{
                background: "linear-gradient(145deg, rgba(201,243,29,0.14), rgba(201,243,29,0.03))",
                border: "1px solid rgba(201,243,29,0.25)",
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-[var(--accent)]" />
                <p className="text-xs font-black uppercase tracking-widest text-[var(--accent)]">
                  Giocatore della settimana
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Avatar name={potw.name} url={potw.avatarUrl} size={64} />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/players/${potw.id}`}
                    className="block truncate text-xl font-black text-white"
                  >
                    {potw.name}
                  </Link>
                  <p className="text-sm text-[var(--muted-text)]">
                    Lv.{potw.level} · {potw.matches}{" "}
                    {potw.matches === 1 ? "partita" : "partite"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-[var(--live)]">+{potw.ratingDelta}</p>
                  <p className="text-[0.6rem] font-bold uppercase tracking-widest text-[var(--muted-text)]">
                    rating
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Movers */}
          <section>
            <div className="mb-2 flex items-center gap-1.5">
              <TrendingUp className="h-4 w-4 text-[var(--accent)]" />
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
                In salita
              </p>
            </div>
            <div className="space-y-2">
              {recap.movers
                .filter((m) => m.ratingDelta > 0)
                .map((m, i) => (
                  <Link
                    key={m.id}
                    href={`/players/${m.id}`}
                    className="flex items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3 active:opacity-80"
                  >
                    <span className="w-5 text-center text-sm font-bold text-[var(--muted-text)]">
                      {i + 1}
                    </span>
                    <Avatar name={m.name} url={m.avatarUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-white">{m.name}</p>
                      <p className="text-xs text-[var(--muted-text)]">
                        {m.matches} {m.matches === 1 ? "partita" : "partite"} · {Math.round(m.glickoRating)} rating
                      </p>
                    </div>
                    <span className="text-lg font-black text-[var(--live)]">+{m.ratingDelta}</span>
                  </Link>
                ))}
            </div>
          </section>

          {/* Most active */}
          <section>
            <div className="mb-2 flex items-center gap-1.5">
              <Flame className="h-4 w-4 text-[var(--accent)]" />
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--muted-text)]">
                I più attivi
              </p>
            </div>
            <div className="space-y-2">
              {recap.mostActive.map((m, i) => (
                <Link
                  key={m.id}
                  href={`/players/${m.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 py-3 active:opacity-80"
                >
                  <span className="w-5 text-center">
                    {i === 0 ? (
                      <Medal className="mx-auto h-4 w-4 text-[var(--gold)]" />
                    ) : (
                      <span className="text-sm font-bold text-[var(--muted-text)]">{i + 1}</span>
                    )}
                  </span>
                  <Avatar name={m.name} url={m.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-white">{m.name}</p>
                    <p className="text-xs text-[var(--muted-text)]">Lv.{m.level}</p>
                  </div>
                  <span className="text-lg font-black text-white">{m.matches}</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Share + CTA */}
          <div className="space-y-2 pt-2">
            <ShareButton
              path="/settimana"
              title="La settimana su SANDER"
              text="Guarda la classifica della settimana su SANDER 🏐"
              fullWidth
              label="Condividi la classifica"
            />
            <Link
              href="/players"
              className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] font-bold text-white active:opacity-80"
            >
              Classifica completa
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
