import type { Metadata } from "next"
import Link from "next/link"
import { after } from "next/server"
import { notFound } from "next/navigation"
import { CalendarDays, ChevronRight, ExternalLink, Gauge, MapPin, Medal, Search, Trophy, Users } from "lucide-react"
import { db } from "@/lib/db"
import { BackButton } from "@/components/layout/PageHeader"
import { ShareButton } from "@/components/ui/ShareButton"
import { TournamentProgress } from "@/components/tournament/TournamentProgress"
import { detailIsStale, refreshFipavEvent } from "@/lib/fipav/sync"
import { fipavEventStatus, fipavEventUrl, showsEntryList } from "@/lib/fipav/queries"
import { shortCategory, type FipavDetail, type FipavEntry, type FipavStanding } from "@/lib/fipav/parse"

export const dynamic = "force-dynamic"

const GENDER: Record<string, string> = { M: "Maschile", F: "Femminile", X: "Misto" }

const isFuture = (iso: string) => new Date(iso).getTime() > Date.now()

async function load(code: string) {
  if (!/^BVL[A-Z]\d{1,9}$/.test(code)) return null
  return db.fipavEvent.findUnique({ where: { code } })
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params
  const e = await load(code).catch(() => null)
  if (!e) return { title: "Torneo FIPAV | SANDER" }
  const title = `${shortCategory(e.category)} ${GENDER[e.gender] ?? ""} · ${e.city} | SANDER`
  return { title, description: `Torneo FIPAV di beach volley a ${e.city}: date, scadenze, formula ed entry list.` }
}

function dayRange(a: Date, b: Date) {
  const f = (d: Date, withYear: boolean) =>
    d.toLocaleDateString("it-IT", { timeZone: "UTC", weekday: "long", day: "numeric", month: "long", ...(withYear ? { year: "numeric" } : {}) })
  return a.getTime() === b.getTime() ? f(a, true) : `da ${f(a, false)} a ${f(b, true)}`
}

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-[var(--border)] px-4 py-3 last:border-b-0">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-[var(--tone)]" aria-hidden="true">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-[var(--muted-text)]">{label}</p>
        <div className="mt-0.5 break-words text-base text-white">{children}</div>
      </div>
    </div>
  )
}

export default async function FipavEventPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  let e = await load(code)
  if (!e) notFound()

  // Details load on first visit; later visits refresh them after the response.
  if (!e.detailAt) e = await refreshFipavEvent(e, 6_000)
  else if (detailIsStale(e)) {
    const current = e
    after(() => refreshFipavEvent(current).then(() => undefined, () => undefined))
  }

  const detail = (e.detail as FipavDetail | null) ?? null
  const entries = showsEntryList(e.category) ? ((e.entryList as FipavEntry[] | null) ?? []) : []
  const standings = showsEntryList(e.category) ? ((e.standings as FipavStanding[] | null) ?? []) : []
  const status = fipavEventStatus(e)
  const signup = detail?.deadlines.find((d) => d.key === "iscrizioni")
  const signupOpen = status === "DRAFT" && (!signup || isFuture(signup.at))
  const title = `${shortCategory(e.category)} – ${e.city}`
  const mapsQuery = [detail?.venue, detail?.address, e.city].filter(Boolean).join(", ")

  return (
    <div className="pb-6">
      <div className="tone-compete px-4 pt-4 pb-4">
        <div className="flex items-center justify-between">
          <BackButton href="/tournaments/fipav" />
          <ShareButton path={`/tournaments/fipav/${e.code}`} title={title} text={`${title}: date, scadenze ed entry list su SANDER 🏐`} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[var(--surface-3)] px-2 py-0.5 text-xs font-black tracking-wide text-white">FIPAV</span>
          <p className="eyebrow text-[var(--tone)]">{GENDER[e.gender] ?? "Beach volley"}</p>
        </div>
        <h1 className="font-hand mt-1 text-[2.4rem] leading-[0.95] text-white">{title}</h1>
        <p className="mt-1 text-sm text-[var(--muted-text)]">
          {e.category}{entries.length ? ` · ${entries.length} coppie in entry list` : ""}
        </p>
      </div>

      {status !== "COMPLETED" && (
        <TournamentProgress
          tournament={{
            status,
            isOpenForRegistration: true,
            registrationDeadline: signup?.at ?? null,
            date: e.startDate,
            listLabel: "Lista d'ingresso",
            extraDeadlines: (detail?.deadlines ?? []).filter((d) => d.key !== "iscrizioni"),
          }}
        />
      )}

      <section aria-label="Informazioni torneo" className="tone-compete mx-4 mb-4 overflow-hidden rounded-2xl bg-[var(--surface-1)]">
        <Row icon={<CalendarDays className="h-5 w-5" />} label="Quando">
          <span className="capitalize">{dayRange(e.startDate, e.endDate)}</span>
        </Row>
        <Row icon={<MapPin className="h-5 w-5" />} label="Dove">
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapsQuery)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-[var(--border)] underline-offset-4"
          >
            {[detail?.venue, detail?.address].filter(Boolean).join(" · ") || e.city}
          </a>
          <p className="text-sm text-[var(--muted-text)]">{e.city}{e.province && e.province !== e.city ? ` (${e.province})` : ""} · {e.region}</p>
        </Row>
        {e.clubName && (
          <Row icon={<Users className="h-5 w-5" />} label="Organizza">{e.clubName}</Row>
        )}
        {!!detail?.formula.length && (
          <Row icon={<Gauge className="h-5 w-5" />} label="Formula">
            <ul className="space-y-0.5">{detail.formula.map((l) => <li key={l}>{l}</li>)}</ul>
          </Row>
        )}
        {e.prizeEuro > 0 && (
          <Row icon={<Trophy className="h-5 w-5" />} label="Montepremi">{e.prizeEuro.toLocaleString("it-IT")} €</Row>
        )}
      </section>

      {standings.length > 0 && (
        <section aria-label="Classifica finale" className="tone-compete mx-4 mb-4 overflow-hidden rounded-2xl bg-[var(--surface-1)]">
          <p className="flex items-center gap-1.5 px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wide text-[var(--muted-text)]">
            <Medal className="h-4 w-4" aria-hidden="true" /> Classifica finale
          </p>
          <ol>
            {standings.map((s) => (
              <li key={`${s.pos}-${s.team}`} className="flex items-center gap-3 px-4 py-2">
                <span className={`w-7 shrink-0 text-base font-black ${s.pos === 1 ? "text-[var(--gold)]" : s.pos === 2 ? "text-[var(--silver)]" : s.pos === 3 ? "text-[var(--bronze)]" : "text-[var(--muted-text)]"}`}>{s.pos}°</span>
                <span className="min-w-0 flex-1 truncate text-base text-white">{s.team}</span>
                {s.points > 0 && <span className="shrink-0 text-sm tabular-nums text-[var(--muted-text)]">{s.points.toLocaleString("it-IT")} pt</span>}
              </li>
            ))}
          </ol>
        </section>
      )}

      {entries.length > 0 && standings.length === 0 && (
        <section aria-label="Entry list" className="tone-compete mx-4 mb-4 overflow-hidden rounded-2xl bg-[var(--surface-1)]">
          <p className="px-4 pt-3 pb-1 text-xs font-bold uppercase tracking-wide text-[var(--muted-text)]">
            Entry list · {entries.length} {entries.length === 1 ? "coppia" : "coppie"} · ordine di ammissione
          </p>
          <ol>
            {entries.map((t) => (
              <li key={`${t.pos}-${t.team}`} className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-2.5 last:border-b-0">
                <span className="w-6 shrink-0 text-sm font-bold tabular-nums text-[var(--muted-text)]">{t.pos}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base font-bold text-white">{t.team}</p>
                  <p className="truncate text-xs text-[var(--muted-text)]">{[t.club, t.note].filter(Boolean).join(" · ")}</p>
                </div>
                <span className="shrink-0 text-sm font-bold tabular-nums text-white">{t.points.toLocaleString("it-IT")}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {!showsEntryList(e.category) && (
        <p className="mx-4 mb-4 rounded-2xl bg-[var(--surface-1)] px-4 py-3 text-sm text-[var(--muted-text)]">
          Torneo giovanile: per tutelare gli atleti minorenni, SANDER non mostra entry list e classifiche.
        </p>
      )}

      {status !== "COMPLETED" && (
        <Link
          href="/trova"
          className="mx-4 mb-3 flex min-h-[3.5rem] items-center gap-3 rounded-2xl bg-[var(--accent)] px-4 py-3 text-[var(--accent-fg)]"
        >
          <Search className="h-6 w-6 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-base font-black">Ti manca il compagno?</p>
            <p className="text-sm font-semibold">Trova chi gioca al tuo livello su SANDER</p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0" aria-hidden="true" />
        </Link>
      )}

      <a
        href={fipavEventUrl(e)}
        target="_blank"
        rel="noopener noreferrer"
        className="mx-4 mb-4 flex min-h-[3.5rem] items-center justify-center gap-2 rounded-2xl bg-[var(--surface-2)] text-base font-bold text-white"
      >
        {signupOpen ? "Iscriviti sul portale FIPAV" : "Vedi su federvolley.it"} <ExternalLink className="h-4 w-4" aria-hidden="true" />
      </a>

      <p className="px-4 text-xs text-[var(--muted-text)]">
        Fonte: FIPAV ({e.code}). In caso di differenze fanno fede le pubblicazioni ufficiali. SANDER non è affiliato a FIPAV.
      </p>
    </div>
  )
}
