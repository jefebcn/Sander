import type { Metadata } from "next"
import Link from "next/link"
import { after } from "next/server"
import { ChevronLeft, ChevronRight, Link2, Search } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { SectionTabs, rankTabs } from "@/components/layout/SectionTabs"
import { fipavAvailable } from "@/lib/fipav/queries"
import { FipavChips } from "@/components/fipav/FipavChips"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { fipavRanking, RANKING_PAGE } from "@/lib/fipav/queries"
import { syncFipavIfStale } from "@/lib/fipav/sync"
import { db } from "@/lib/db"
import { daysFromNow, formatDayShort } from "@/lib/datetime"

export const metadata: Metadata = {
  title: "Classifica FIPAV beach volley | SANDER",
  description: "La classifica FIPAV di beach volley, maschile e femminile: posizioni e punti degli atleti.",
}

export const dynamic = "force-dynamic"

type Search = { genere?: string; q?: string; pagina?: string }

const pts = (n: number) => n.toLocaleString("it-IT", { maximumFractionDigits: 2 })

export default async function FipavRankingPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const gender = sp.genere === "F" ? "F" : "M"
  const q = (sp.q ?? "").trim().slice(0, 40)
  const page = Math.max(1, Math.min(500, Number(sp.pagina) || 1))
  const [me, { rows, total }, newest] = await Promise.all([
    getCurrentPlayer(),
    fipavRanking(gender, page, q || undefined),
    db.fipavRanking.findFirst({ where: { gender }, orderBy: { updatedAt: "desc" }, select: { updatedAt: true, year: true } }),
  ])
  after(() => syncFipavIfStale().catch((e) => console.error("[fipav] sync", e)))

  const pages = Math.max(1, Math.ceil(total / RANKING_PAGE))
  const link = (patch: Partial<Search>) => {
    const p = new URLSearchParams()
    for (const [k, v] of Object.entries({ genere: gender, q: q || undefined, pagina: undefined, ...patch })) if (v) p.set(k, String(v))
    return `/fipav?${p.toString()}`
  }

  return (
    <div className="pb-6">
      <PageHeader
        eyebrow="Classifiche"
        tone="compete"
        title="FIPAV"
        subtitle={`Assoluto ${gender === "F" ? "femminile" : "maschile"} · ${total.toLocaleString("it-IT")} atleti`}
      />
      <SectionTabs items={rankTabs(await fipavAvailable())} active="fipav" tone="compete" className="pb-4" />

      <div className="tone-compete space-y-3 pb-3">
        <FipavChips
          label="Genere"
          items={[
            { key: "M", label: "Maschile", href: link({ genere: "M" }), on: gender === "M" },
            { key: "F", label: "Femminile", href: link({ genere: "F" }), on: gender === "F" },
          ]}
        />
        <form action="/fipav" className="mx-4 flex items-center gap-2 rounded-2xl bg-[var(--surface-1)] px-3 ring-1 ring-[var(--border)]">
          <input type="hidden" name="genere" value={gender} />
          <Search className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Cerca un atleta"
            aria-label="Cerca un atleta"
            className="min-h-[3.5rem] min-w-0 flex-1 bg-transparent text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none"
          />
        </form>
      </div>

      {me && !me.fipavPersonId && (
        <Link href="/fipav/collega" className="tone-compete mx-4 mb-3 flex min-h-[3.5rem] items-center gap-3 rounded-2xl bg-[var(--surface-2)] px-4 text-base font-bold text-white">
          <Link2 className="h-5 w-5 shrink-0 text-[var(--tone)]" aria-hidden="true" />
          <span className="min-w-0 flex-1">Sei in classifica? Collega il tuo profilo FIPAV</span>
          <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
        </Link>
      )}

      {rows.length === 0 ? (
        <p className="px-6 py-12 text-center text-base text-[var(--muted-text)]">
          {q ? `Nessun atleta trovato per "${q}".` : "Stiamo caricando la classifica FIPAV: riprova tra un minuto."}
        </p>
      ) : (
        <ol className="tone-compete mx-4 overflow-hidden rounded-2xl bg-[var(--surface-1)]">
          {rows.map((r) => {
            const mine = me?.fipavPersonId === r.personId
            return (
              <li
                key={r.id}
                aria-current={mine ? "true" : undefined}
                className={`flex items-center gap-3 border-b border-[var(--border)] px-4 py-2.5 last:border-b-0 ${mine ? "bg-[var(--surface-3)]" : ""}`}
              >
                <span className={`w-10 shrink-0 text-base font-black tabular-nums ${r.position <= 3 ? "text-[var(--gold)]" : "text-[var(--muted-text)]"}`}>{r.position}</span>
                <p className="min-w-0 flex-1 truncate text-base font-bold text-white">{r.name}{mine && <span className="ml-2 text-xs font-bold text-[var(--tone)]">TU</span>}</p>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums text-white">{pts(r.totalPoints)}</p>
                  <p className="text-xs text-[var(--muted-text)]">entry {pts(r.entryPoints)}</p>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {pages > 1 && (
        <nav aria-label="Pagine" className="tone-compete mx-4 mt-3 flex items-center justify-between">
          {page > 1 ? (
            <Link href={link({ pagina: String(page - 1) })} className="flex min-h-[3.5rem] items-center gap-1 px-2 text-base font-bold text-[var(--tone)]">
              <ChevronLeft className="h-5 w-5" aria-hidden="true" /> Precedenti
            </Link>
          ) : <span />}
          <span className="text-sm text-[var(--muted-text)]">Pagina {page} di {pages}</span>
          {page < pages ? (
            <Link href={link({ pagina: String(page + 1) })} className="flex min-h-[3.5rem] items-center gap-1 px-2 text-base font-bold text-[var(--tone)]">
              Successivi <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          ) : <span />}
        </nav>
      )}

      <p className="px-4 pt-6 text-xs text-[var(--muted-text)]">
        Fonte: classifica FIPAV Assoluto{newest ? ` ${newest.year}, aggiornata ${daysFromNow(newest.updatedAt) === 0 ? "oggi" : `il ${formatDayShort(newest.updatedAt)}`}` : ""}.
        Ordinata per punti totali; i punti entry list decidono l&apos;ammissione ai tornei. Le classifiche giovanili non sono mostrate.
      </p>
    </div>
  )
}
