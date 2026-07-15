export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import Link from "next/link"
import { Crown, MapPin, Volleyball } from "lucide-react"
import { getLocationLeaderboards } from "@/actions/territories"

export const metadata: Metadata = {
  title: "Re dei Bagni — SANDER Beach Volley",
  description:
    "Chi comanda su ogni campo? Le classifiche territoriali dei bagni: conquista il tuo spot e diventa il Re del Bagno.",
  openGraph: {
    title: "Re dei Bagni 👑🏐",
    description: "Conquista il tuo campo. Diventa il Re del Bagno su SANDER.",
  },
}

function Avatar({ name, url, size = 40 }: { name: string; url: string | null; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-1)] text-xs font-black text-[var(--muted-text)]"
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

export default async function TerritoriesPage() {
  const territories = await getLocationLeaderboards()

  return (
    <div className="pb-10">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center gap-2">
          <Crown className="h-6 w-6 text-[var(--accent)]" />
          <h1 className="text-3xl font-black text-white">Re dei Bagni</h1>
        </div>
        <p className="mt-1 text-sm text-[var(--muted-text)]">
          Chi vince di più su un campo lo conquista. Difendi il tuo spot 👑
        </p>
      </div>

      {territories.length === 0 ? (
        <div className="mx-4 rounded-2xl bg-[var(--surface-2)] p-8 text-center">
          <Volleyball className="mx-auto mb-3 h-10 w-10 text-[var(--muted-text)] opacity-40" />
          <p className="font-bold text-white">Nessun campo conquistato ancora</p>
          <p className="mt-1 text-sm text-[var(--muted-text)]">
            Gioca una partita con risultato registrato e reclama il primo trono.
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
        <div className="space-y-4 px-4">
          {territories.map((t) => (
            <div key={t.location} className="overflow-hidden rounded-3xl bg-[var(--surface-2)]">
              {/* King banner */}
              <div
                className="flex items-center gap-3 p-4"
                style={{
                  background:
                    "linear-gradient(120deg, rgba(255,215,0,0.14), rgba(201,243,29,0.05))",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 text-[var(--muted-text)]">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate text-xs font-bold uppercase tracking-wider">
                      {t.location}
                    </span>
                  </div>
                  {t.king && (
                    <Link
                      href={`/players/${t.king.id}`}
                      className="mt-1 flex items-center gap-2"
                    >
                      <Crown className="h-4 w-4 text-[var(--gold)]" />
                      <span className="truncate text-lg font-black text-white">
                        {t.king.name}
                      </span>
                    </Link>
                  )}
                </div>
                {t.king && (
                  <div className="text-right">
                    <p className="text-xl font-black text-[var(--gold)]">{t.king.wins}</p>
                    <p className="text-[0.6rem] font-bold uppercase tracking-widest text-[var(--muted-text)]">
                      vittorie
                    </p>
                  </div>
                )}
              </div>

              {/* Challengers */}
              <div className="divide-y divide-white/5">
                {t.standings.slice(1, 5).map((p, i) => (
                  <Link
                    key={p.id}
                    href={`/players/${p.id}`}
                    className="flex items-center gap-3 px-4 py-2.5 active:opacity-80"
                  >
                    <span className="w-4 text-center text-xs font-bold text-[var(--muted-text)]">
                      {i + 2}
                    </span>
                    <Avatar name={p.name} url={p.avatarUrl} size={32} />
                    <span className="flex-1 truncate text-sm font-medium text-white">{p.name}</span>
                    <span className="text-xs text-[var(--muted-text)]">
                      {p.wins}V · {p.winRate}%
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
