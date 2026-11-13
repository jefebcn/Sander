import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Search, ShieldCheck } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { fipavRowsFor, searchFipavAthletes } from "@/lib/fipav/queries"
import { linkFipavProfile, unlinkFipavProfile } from "@/actions/fipav"

export const metadata: Metadata = { title: "Collega il tuo profilo FIPAV | SANDER" }
export const dynamic = "force-dynamic"

const pts = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 2 })

export default async function FipavLinkPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const me = await getCurrentPlayer()
  if (!me) redirect("/auth/signin?callbackUrl=/fipav/collega")
  const { q: raw } = await searchParams
  // First visit: start from the player's own name.
  const q = (raw ?? [me.lastName, me.firstName].filter(Boolean).join(" ")).trim().slice(0, 40)
  const [linked, results] = await Promise.all([
    me.fipavPersonId ? fipavRowsFor(me.fipavPersonId) : Promise.resolve([]),
    q ? searchFipavAthletes(q) : Promise.resolve([]),
  ])

  return (
    <div className="tone-compete pb-6">
      <PageHeader eyebrow="Profilo" tone="compete" title="Profilo FIPAV" subtitle="Classifica e risultati sulla tua carta" backHref="/profile?tab=carta" />

      {linked.length > 0 && (
        <section className="mx-4 mb-4 overflow-hidden rounded-2xl bg-[var(--surface-1)]">
          <p className="px-4 pt-3 text-xs font-bold uppercase tracking-wide text-[var(--muted-text)]">Collegato</p>
          {linked.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3">
              <ShieldCheck className="h-6 w-6 shrink-0 text-[var(--tone)]" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-white">{r.name}</p>
                <p className="text-sm text-[var(--muted-text)]">{r.position}° Assoluto {r.gender === "F" ? "femminile" : "maschile"} · {pts(r.totalPoints)} punti</p>
              </div>
            </div>
          ))}
          <form action={unlinkFipavProfile} className="px-4 pb-3">
            <button type="submit" className="flex min-h-[3.5rem] w-full items-center justify-center rounded-2xl bg-[var(--surface-2)] text-base font-bold text-white">
              Scollega
            </button>
          </form>
        </section>
      )}

      <p className="mx-4 mb-3 text-base text-[var(--muted-text)]">
        Cerca il tuo nome nella classifica FIPAV Assoluto e tocca <span className="font-bold text-white">Sono io</span>: sulla tua carta compariranno posizione, punti e ultimi risultati. Collega solo il tuo profilo.
      </p>

      <form action="/fipav/collega" className="mx-4 mb-4 flex items-center gap-2 rounded-2xl bg-[var(--surface-1)] px-3 ring-1 ring-[var(--border)]">
        <Search className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Cognome e nome"
          aria-label="Cognome e nome"
          className="min-h-[3.5rem] min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none"
        />
      </form>

      {q && results.length === 0 && (
        <p className="mx-4 text-base text-[var(--muted-text)]">
          Nessun atleta trovato. Controlla come sei scritto su FIPAV, oppure non sei ancora nella classifica Assoluto.
        </p>
      )}

      {results.length > 0 && (
        <ul className="mx-4 overflow-hidden rounded-2xl bg-[var(--surface-1)]">
          {results.map((r) => (
            <li key={r.id} className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-2.5 last:border-b-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-base font-bold text-white">{r.name}</p>
                <p className="text-sm text-[var(--muted-text)]">{r.position}° {r.gender === "F" ? "femminile" : "maschile"} · {pts(r.totalPoints)} punti</p>
              </div>
              {me.fipavPersonId === r.personId ? (
                <span className="shrink-0 text-sm font-bold text-[var(--tone)]">Sei tu</span>
              ) : (
                <form action={linkFipavProfile}>
                  <input type="hidden" name="personId" value={r.personId} />
                  <button type="submit" className="min-h-[2.75rem] shrink-0 rounded-full bg-[var(--tone)] px-4 text-sm font-extrabold text-[var(--accent-fg)]">
                    Sono io
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
