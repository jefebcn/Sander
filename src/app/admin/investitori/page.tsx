export const dynamic = "force-dynamic"

import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { Coins, HeartHandshake, MapPin, Repeat, TrendingUp, Users } from "lucide-react"
import type { ReactNode } from "react"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { getAdminMetrics } from "@/lib/adminMetrics"
import { getInvestorMetrics, INVESTOR_MONTHS } from "@/lib/investorMetrics"
import { getScopriMetrics } from "@/lib/scopri/metrics"
import { PLUS_MONTHLY_CENTS } from "@/lib/pricing"
import { PageHeader } from "@/components/layout/PageHeader"
import { KpiTile } from "@/components/admin/KpiTile"
import { LineChart } from "@/components/admin/LineChart"
import { ColumnChart } from "@/components/admin/ColumnChart"
import { BarList } from "@/components/admin/BarList"
import { PrintButton } from "@/components/admin/PrintButton"

export const metadata: Metadata = { title: "Investitori — SANDER Admin" }

const num = new Intl.NumberFormat("it-IT")
const eur = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 })
const euro = (cents: number | null) => (cents === null ? "—" : eur.format(cents / 100))
const pct = (value: number | null) => (value === null ? "—" : `${Math.round(value * 100)}%`)
const share = (part: number, whole: number) => (whole > 0 ? part / whole : null)

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("it-IT", { timeZone: "Europe/Rome", ...opts })
const monthShort = fmt({ month: "short" })
const monthLong = fmt({ month: "long", year: "numeric" })
const dayMonth = fmt({ day: "numeric", month: "short" })
const dayMonthNum = fmt({ day: "numeric", month: "numeric" })
const today = fmt({ day: "numeric", month: "long", year: "numeric" })
/** Mid-month / mid-day UTC, so no time zone can move the label. */
const ofMonth = (key: string) => new Date(`${key}-15T12:00:00Z`)
const ofDay = (key: string) => new Date(`${key}T12:00:00Z`)

function Panel({ icon, title, subtitle, children, className = "" }: { icon: ReactNode; title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 break-inside-avoid rounded-2xl bg-[var(--surface-1)] p-4 lg:p-5 ${className}`}>
      <div className="mb-4 flex items-start gap-2">
        <span className="mt-0.5 text-[var(--accent)]">{icon}</span>
        <div>
          <h2 className="font-display text-lg font-extrabold text-white">{title}</h2>
          {subtitle && <p className="text-sm text-[var(--muted-text)]">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function Footnote({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-sm text-[var(--muted-text)]">{children}</p>
}

/** The numbers someone deciding whether to back SANDER asks first, from live data. */
export default async function InvestorPage() {
  const session = await getCurrentSession()
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/admin/investitori")
  if (!isAdminEmail(session.user.email)) redirect("/admin/accesso")

  const now = new Date()
  const [inv, m, sc] = await Promise.all([getInvestorMetrics(now), getAdminMetrics(now, INVESTOR_MONTHS), getScopriMetrics(now)])
  const { growth, engagement, games, reach, funnel } = inv
  const { revenue, averages, retention } = m

  const revenueByMonth = revenue.byMonth.map((r) => ({
    label: monthShort.format(ofMonth(r.month)),
    full: monthLong.format(ofMonth(r.month)),
    value: (r.tournamentsCents + r.topUpsCents) / 100,
  }))
  const revenue12Cents = revenue.byMonth.reduce((s, r) => s + r.tournamentsCents + r.topUpsCents, 0)
  const [prevMonthRev, thisMonthRev] = revenueByMonth.slice(-2).map((r) => r.value)
  // Retention: the last six months with a previous month to compare with.
  const retentionRows = retention.byMonth.slice(-6)

  return (
    <div className="min-h-dvh pb-10">
      <PageHeader
        eyebrow="Admin · investitori"
        title="I numeri di SANDER"
        subtitle={`Dati reali dell'app al ${today.format(now)}`}
        backHref="/admin"
        action={<span className="hidden lg:block"><PrintButton /></span>}
      />

      <div className="flex flex-col gap-4 px-4">
        {/* ── Headline ─────────────────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <Panel icon={<Users className="h-5 w-5" />} title="Giocatori iscritti" subtitle={`Totale a fine settimana, ultime ${inv.weeks.length} settimane`}>
            <p className="text-[3.5rem] font-black leading-none tabular-nums text-white">{num.format(growth.totalPlayers)}</p>
            <p className="mb-4 mt-2 text-sm text-[var(--muted-text)]">
              <strong className="text-white">+{num.format(growth.new30)}</strong> negli ultimi 30 giorni
              {growth.base30 !== null && <> · base cresciuta del <strong className="text-white">{pct(growth.base30)}</strong></>}
            </p>
            <LineChart
              valueLabel="Iscritti"
              data={inv.weeks.map((w, i) => ({
                label: dayMonth.format(ofDay(w)),
                full: `Settimana del ${dayMonth.format(ofDay(w))}`,
                value: growth.cumulativeByWeek[i],
              }))}
            />
          </Panel>

          <div className="grid grid-cols-2 gap-3 self-start">
            <KpiTile label="Attivi nel mese (MAU)" value={num.format(engagement.mau)} change={engagement.mau30} />
            <KpiTile label="Attivi nella settimana (WAU)" value={num.format(engagement.wau)} hint={`${pct(engagement.stickiness)} dei mensili torna ogni settimana`} />
            <KpiTile label="Partite giocate, 30 giorni" value={num.format(games.games30)} change={games.games30Change} />
            <KpiTile label="Nuovi iscritti, 30 giorni" value={num.format(growth.new30)} change={growth.signups30} />
            <KpiTile label={`Incassi, ${INVESTOR_MONTHS} mesi`} value={euro(revenue12Cents)} hint="lordi: tornei + ricariche SC" />
            <KpiTile label="SANDER+ al mese (MRR)" value={euro(sc.plusMrrCents)} hint={`${num.format(sc.plusActive)} abbonati attivi`} />
            <KpiTile label="Comuni con giocatori" value={num.format(reach.comuni)} hint={`in ${num.format(reach.regions)} ${reach.regions === 1 ? "regione" : "regioni"}`} />
            <KpiTile label="Partite giocate, da sempre" value={num.format(games.completedTotal)} hint={`più ${num.format(games.tournaments)} ${games.tournaments === 1 ? "torneo" : "tornei"}`} />
          </div>
        </div>

        {/* ── Engagement ───────────────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel icon={<TrendingUp className="h-5 w-5" />} title="Giocatori attivi a settimana" subtitle="Hanno giocato, scritto in chat o usato Scopri">
            <ColumnChart
              valueLabel="Attivi"
              data={engagement.activeWeeks.map((w, i) => ({
                label: dayMonthNum.format(ofDay(w)),
                full: `Settimana del ${dayMonth.format(ofDay(w))}`,
                value: engagement.activeByWeek[i],
              }))}
            />
          </Panel>
          <Panel icon={<TrendingUp className="h-5 w-5" />} title="Partite giocate al mese" subtitle="Partite chiuse con risultato, senza i tornei">
            <ColumnChart
              valueLabel="Partite"
              data={games.byMonth.map((g) => ({
                label: monthShort.format(ofMonth(g.month)),
                full: monthLong.format(ofMonth(g.month)),
                value: g.games,
              }))}
            />
            <Footnote>
              {num.format(games.byMonth.reduce((s, g) => s + g.seats, 0))} posti occupati in {INVESTOR_MONTHS} mesi: in media{" "}
              {(() => {
                const played = games.byMonth.reduce((s, g) => s + g.games, 0)
                return played > 0 ? (games.byMonth.reduce((s, g) => s + g.seats, 0) / played).toLocaleString("it-IT", { maximumFractionDigits: 1 }) : "—"
              })()}{" "}
              giocatori a partita.
            </Footnote>
          </Panel>
        </div>

        {/* ── Revenue & unit economics ─────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel icon={<Coins className="h-5 w-5" />} title="Incassi al mese" subtitle="Quote tornei + ricariche SanderCredits, lordi">
            <ColumnChart valueLabel="Incassi" unit="euro" data={revenueByMonth} />
            {prevMonthRev !== undefined && thisMonthRev !== undefined && (
              <Footnote>Mese in corso: {eur.format(thisMonthRev)} (mese scorso {eur.format(prevMonthRev)}).</Footnote>
            )}
          </Panel>
          <Panel icon={<Coins className="h-5 w-5" />} title="Chi paga e quanto" subtitle="Da tutto lo storico">
            <div className="grid grid-cols-2 gap-3">
              <KpiTile label="Giocatori paganti" value={num.format(averages.payingPlayers)} hint={`${pct(share(averages.payingPlayers, growth.totalPlayers))} degli iscritti`} />
              <KpiTile label="Incasso per pagante" value={euro(averages.revenuePerPayingPlayerCents)} hint="ARPPU, storico" />
              <KpiTile label="Iscrizione torneo media" value={euro(averages.tournamentEntryCents)} hint={`${num.format(averages.tournamentEntries)} iscrizioni pagate`} />
              <KpiTile label="Ricarica SC media" value={euro(averages.topUpCents)} hint={`${num.format(averages.topUps)} ricariche`} />
            </div>
            <Footnote>
              Tre fonti di ricavo: quote dei tornei (Stripe o contanti), ricariche SanderCredits per i servizi extra e
              l&apos;abbonamento SANDER+ a {euro(PLUS_MONTHLY_CENTS)} al mese.
            </Footnote>
          </Panel>
        </div>

        {/* ── Funnel, reach, retention ─────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel icon={<Users className="h-5 w-5" />} title="Dall'iscrizione al campo" subtitle="Quanti fanno il passo successivo">
            <BarList
              max={funnel.signedUp}
              items={[
                { label: "Iscritti", value: funnel.signedUp },
                { label: "Comune scelto", value: funnel.withCity, note: pct(share(funnel.withCity, funnel.signedUp)) },
                { label: "Hanno giocato", value: funnel.played, note: pct(share(funnel.played, funnel.signedUp)) },
                { label: "Hanno pagato", value: averages.payingPlayers, note: pct(share(averages.payingPlayers, funnel.signedUp)) },
              ]}
            />
          </Panel>
          <Panel icon={<MapPin className="h-5 w-5" />} title="Dove giocano" subtitle={`${num.format(reach.comuni)} comuni, ${num.format(reach.regions)} ${reach.regions === 1 ? "regione" : "regioni"}`}>
            {reach.topComuni.length === 0 ? (
              <p className="text-base text-[var(--muted-text)]">Nessun giocatore ha ancora scelto il comune.</p>
            ) : (
              <BarList items={reach.topComuni.map((c) => ({ label: c.name, value: c.count }))} />
            )}
          </Panel>
          <Panel icon={<Repeat className="h-5 w-5" />} title="Chi torna a giocare" subtitle="Giocatori del mese prima che hanno rigiocato">
            <table className="w-full text-base">
              <thead>
                <tr className="text-left text-sm text-[var(--muted-text)]">
                  <th className="pb-2 font-medium">Mese</th>
                  <th className="pb-2 text-right font-medium">Attivi</th>
                  <th className="pb-2 text-right font-medium">Nuovi</th>
                  <th className="pb-2 text-right font-medium">Tornati</th>
                </tr>
              </thead>
              <tbody>
                {retentionRows.map((r) => (
                  <tr key={r.month} className="border-t border-[var(--border)]">
                    <td className="py-2 text-white">{monthShort.format(ofMonth(r.month))}</td>
                    <td className="py-2 text-right tabular-nums text-white">{r.active}</td>
                    <td className="py-2 text-right tabular-nums text-white">{r.newcomers}</td>
                    <td className="py-2 text-right font-bold tabular-nums text-white">{pct(r.retainedPct)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {retention.bySeason.length > 0 && (
              <Footnote>
                {retention.bySeason
                  .map((s) => `Stagione ${s.season}: ${s.players} giocatori${s.returnedPct !== null ? `, ${pct(s.returnedPct)} tornati l'anno dopo` : ""}`)
                  .join(" · ")}
              </Footnote>
            )}
          </Panel>
        </div>

        {/* ── Scopri ───────────────────────────────────────────────────── */}
        <Panel icon={<HeartHandshake className="h-5 w-5" />} title="Scopri: trovare con chi giocare" subtitle="Like e match tra giocatori, coppie fisse, sfide 2v2">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiTile label="Profili Scopri attivi" value={num.format(sc.profiles)} hint={`${pct(share(sc.profiles, growth.totalPlayers))} degli iscritti`} />
            <KpiTile label="Match, da sempre" value={num.format(sc.matchesTotal)} hint={`${num.format(sc.matches7)} negli ultimi 7 giorni`} />
            <KpiTile label="Match con chat avviata" value={pct(sc.chatRate)} hint="si scrivono dopo il match" />
            <KpiTile label="Coppie fisse attive" value={num.format(sc.duosActive)} hint={`${num.format(sc.duoMatches)} ${sc.duoMatches === 1 ? "sfida 2v2 accettata" : "sfide 2v2 accettate"}`} />
          </div>
        </Panel>

        <p className="text-sm text-[var(--muted-text)]">
          <strong className="text-white">Come si leggono.</strong> Attivo = ha giocato una partita o un torneo, scritto in
          chat o usato Scopri nel periodo. MAU e WAU: ultimi 30 e 7 giorni. Le variazioni confrontano gli ultimi 30 giorni
          con i 30 precedenti. Incassi lordi: le quote dei tornei di organizzatori esterni vanno girate a loro.
        </p>
      </div>
    </div>
  )
}
