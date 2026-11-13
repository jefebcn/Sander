import type { Metadata } from "next"
import Link from "next/link"
import { after } from "next/server"
import { Bell, BellRing, ChevronRight } from "lucide-react"
import { PageHeader } from "@/components/layout/PageHeader"
import { SectionTabs, PLAY_TABS } from "@/components/layout/SectionTabs"
import { FipavSourceToggle } from "@/components/fipav/FipavSourceToggle"
import { FipavChips } from "@/components/fipav/FipavChips"
import { Gabbo } from "@/components/ui/Gabbo"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { db } from "@/lib/db"
import { fipavRegions, fipavLastUpdate, listFipavEvents } from "@/lib/fipav/queries"
import { shortCategory, type CategoryGroup } from "@/lib/fipav/parse"
import { fipavIsStale, syncFipav } from "@/lib/fipav/sync"
import { toggleFipavAlert } from "@/actions/fipav"
import { dayKey, daysFromNow, formatDayShort, relativeDay } from "@/lib/datetime"

export const metadata: Metadata = {
  title: "Calendario tornei FIPAV di beach volley | SANDER",
  description: "Tutti i tornei FIPAV di beach volley in programma, regione per regione: date, luoghi, categorie e scadenze.",
}

export const dynamic = "force-dynamic"

const GROUPS: { key: CategoryGroup; label: string }[] = [
  { key: "societa", label: "Società" },
  { key: "serie", label: "Serie Beach" },
  { key: "assoluto", label: "Campionato Italiano" },
  { key: "giovanili", label: "Giovanili" },
]

type Search = { regione?: string; genere?: string; cat?: string; settimane?: string }

function href(base: Search, patch: Partial<Search>) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries({ ...base, ...patch })) if (v) q.set(k, v)
  const s = q.toString()
  return `/tournaments/fipav${s ? `?${s}` : ""}`
}

export default async function FipavCalendarPage({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams
  const [me, regions, updated] = await Promise.all([getCurrentPlayer(), fipavRegions(), fipavLastUpdate()])

  // Missed cron or first visit after deploy: refresh in the background.
  if (await fipavIsStale()) after(() => syncFipav().then(() => undefined, (e) => console.error("[fipav] sync", e)))

  const alerts = me ? await db.fipavAlert.findMany({ where: { playerId: me.id }, select: { region: true } }) : []
  const alertRegions = new Set(alerts.map((a) => a.region))
  // No region in the link: the one they follow, else all of Italy.
  const region = sp.regione === "tutte" ? null : (sp.regione && regions.some((r) => r.region === sp.regione) ? sp.regione : alerts[0]?.region ?? null)
  const gender = sp.genere === "M" || sp.genere === "F" ? sp.genere : null
  const group = GROUPS.some((g) => g.key === sp.cat) ? (sp.cat as CategoryGroup) : null
  const base: Search = { regione: region ?? (sp.regione === "tutte" ? "tutte" : undefined), genere: gender ?? undefined, cat: group ?? undefined }

  // Three weeks at a time: a whole season in one list is a wall of cards.
  const weeks = Math.min(12, Math.max(3, Number(sp.settimane) || 3))
  const events = await listFipavEvents({ region, gender, group }, weeks * 7)
  const more = await listFipavEvents({ region, gender, group }, (weeks + 3) * 7).then((l) => l.length > events.length)
  const byDay = new Map<string, typeof events>()
  for (const e of events) {
    const k = dayKey(e.startDate)
    byDay.set(k, [...(byDay.get(k) ?? []), e])
  }

  return (
    <div className="pb-6">
      <PageHeader
        eyebrow="Gioca"
        tone="compete"
        title="Tornei"
        subtitle={`${events.length} ${events.length === 1 ? "torneo FIPAV" : "tornei FIPAV"} nelle prossime ${weeks} settimane${region ? ` · ${region}` : ""}`}
      />
      <SectionTabs items={PLAY_TABS} active="tornei" className="pb-4" />
      <FipavSourceToggle active="fipav" />

      <div className="tone-compete space-y-2 pb-3">
        <FipavChips
          label="Regione"
          items={[
            { key: "tutte", label: "Tutta Italia", href: href(base, { regione: "tutte" }), on: !region },
            ...regions.map((r) => ({ key: r.region, label: r.region, count: r.count, href: href(base, { regione: r.region }), on: r.region === region })),
          ]}
        />
        <FipavChips
          label="Genere"
          items={[
            { key: "all", label: "Maschile e femminile", href: href(base, { genere: undefined }), on: !gender },
            { key: "M", label: "Maschile", href: href(base, { genere: "M" }), on: gender === "M" },
            { key: "F", label: "Femminile", href: href(base, { genere: "F" }), on: gender === "F" },
          ]}
        />
        <FipavChips
          label="Categoria"
          items={[
            { key: "all", label: "Tutte le categorie", href: href(base, { cat: undefined }), on: !group },
            ...GROUPS.map((g) => ({ key: g.key, label: g.label, href: href(base, { cat: g.key }), on: g.key === group })),
          ]}
        />
      </div>

      {region && (
        <form action={toggleFipavAlert} className="tone-compete mx-4 mb-4">
          <input type="hidden" name="region" value={region} />
          <button
            type="submit"
            className="flex min-h-[3.5rem] w-full items-center gap-3 rounded-2xl bg-[var(--surface-1)] px-4 text-left text-base text-white active:bg-[var(--surface-2)]"
          >
            {alertRegions.has(region) ? (
              <>
                <BellRing className="h-5 w-5 shrink-0 text-[var(--tone)]" aria-hidden="true" />
                <span className="min-w-0 flex-1">Avvisi attivi per {region} <span className="text-sm text-[var(--muted-text)]">· tocca per toglierli</span></span>
              </>
            ) : (
              <>
                <Bell className="h-5 w-5 shrink-0 text-[var(--tone)]" aria-hidden="true" />
                <span className="min-w-0 flex-1">Avvisami quando esce un torneo in {region}</span>
              </>
            )}
          </button>
        </form>
      )}

      {events.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
          <Gabbo pose="attesa" size={112} />
          <div>
            <p className="text-lg font-semibold">Nessun torneo in programma</p>
            <p className="text-base text-[var(--muted-text)]">
              {updated ? "Prova un'altra regione o togli un filtro." : "Stiamo caricando il calendario FIPAV: riprova tra un minuto."}
            </p>
          </div>
        </div>
      ) : (
        <div className="tone-compete space-y-5 px-4">
          {[...byDay.entries()].map(([k, list]) => (
            <section key={k} aria-label={formatDayShort(list[0].startDate)}>
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--tone)]">
                {formatDayShort(list[0].startDate)} · {relativeDay(list[0].startDate)} · {list.length} {list.length === 1 ? "torneo" : "tornei"}
              </h2>
              <ul className="space-y-2">
                {list.map((e) => (
                  <li key={e.code}>
                    <Link
                      href={`/tournaments/fipav/${e.code}`}
                      className="flex min-h-[4rem] items-center gap-3 rounded-2xl bg-[var(--surface-1)] px-3 py-3 active:bg-[var(--surface-2)]"
                    >
                      <span
                        aria-label={e.gender === "F" ? "Femminile" : e.gender === "M" ? "Maschile" : "Misto"}
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-3)] text-sm font-black ${
                          e.gender === "F" ? "text-[var(--love)]" : e.gender === "M" ? "text-[var(--sky)]" : "text-white"
                        }`}
                      >
                        {e.gender === "X" ? "MX" : e.gender}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-base font-bold text-white">{shortCategory(e.category)}</p>
                        <p className="truncate text-sm text-[var(--muted-text)]">
                          {e.city}{e.clubName ? ` · ${e.clubName}` : ""}
                        </p>
                      </div>
                      {e.prizeEuro > 0 && (
                        <span className="shrink-0 rounded-full bg-[var(--surface-3)] px-2 py-0.5 text-xs font-bold text-[var(--tone)]">
                          {e.prizeEuro.toLocaleString("it-IT")} €
                        </span>
                      )}
                      <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted-text)]" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {more && (
            <Link
              href={href(base, { settimane: String(weeks + 3) })}
              scroll={false}
              className="flex min-h-[3.5rem] items-center justify-center rounded-2xl bg-[var(--surface-2)] text-base font-bold text-white"
            >
              Mostra le settimane successive
            </Link>
          )}
        </div>
      )}

      <p className="px-4 pt-6 text-xs text-[var(--muted-text)]">
        Fonte: calendari ufficiali FIPAV{updated ? `, aggiornati ${daysFromNow(updated) === 0 ? "oggi" : `il ${formatDayShort(updated)}`}` : ""}. Le iscrizioni si fanno sul portale FIPAV.
      </p>
    </div>
  )
}
