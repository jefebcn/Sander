export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { ChevronLeft, Wallet, Receipt, Coins, UserPlus, Repeat, Sun } from "lucide-react"
import type { ReactNode } from "react"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { isAdminEmail } from "@/lib/isAdmin"
import { getAdminMetrics, SC_PER_EURO } from "@/lib/adminMetrics"
import { formatDate } from "@/lib/utils"

const eur = new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" })
const euro = (cents: number | null) => (cents === null ? "—" : eur.format(cents / 100))
const pct = (value: number | null) => (value === null ? "—" : `${Math.round(value * 100)}%`)

const monthLabel = new Intl.DateTimeFormat("it-IT", { month: "short", year: "2-digit" })
/** "2026-08" → "ago 26". Mid-month noon UTC so no time zone can shift it. */
const month = (key: string) => monthLabel.format(new Date(`${key}-15T12:00:00Z`))

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-[var(--surface-1)] p-4">
      <div className="mb-3 flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--accent)]">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] p-3">
      <p className="text-2xl font-black text-white">{value}</p>
      <p className="text-sm text-[var(--muted-text)]">{label}</p>
      {hint && <p className="mt-1 text-xs text-[var(--muted-text)] opacity-70">{hint}</p>}
    </div>
  )
}

function Note({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-sm text-[var(--muted-text)]">{children}</p>
}

export default async function AdminMetricsPage() {
  const session = await getCurrentSession()
  if (!session?.user?.id) redirect("/auth/signin?callbackUrl=/admin/metriche")
  if (!isAdminEmail(session.user.email)) redirect("/")

  const m = await getAdminMetrics()
  const { revenue, averages, credits, acquisition, retention } = m

  return (
    <div className="min-h-dvh pb-10">
      <div
        className="flex items-center gap-3 px-4 pt-6 pb-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1.5rem)" }}
      >
        <Link
          href="/profile?tab=admin"
          aria-label="Indietro"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-2)] text-white active:bg-[var(--surface-3)]"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-xl font-black text-white">Metriche</h1>
      </div>

      <div className="space-y-4 px-4">
        {/* ── Ricavi ─────────────────────────────────────────────────── */}
        <Section icon={<Wallet className="h-4 w-4 text-[var(--accent)]" />} title="Incassi">
          <div className="overflow-x-auto">
            <table className="w-full text-base">
              <thead>
                <tr className="text-left text-sm text-[var(--muted-text)]">
                  <th className="pb-2 font-medium">Mese</th>
                  <th className="pb-2 text-right font-medium">Tornei</th>
                  <th className="pb-2 text-right font-medium">Ricariche</th>
                  <th className="pb-2 text-right font-medium">Totale</th>
                </tr>
              </thead>
              <tbody>
                {revenue.byMonth.map((r) => (
                  <tr key={r.month} className="border-t border-[var(--border)]">
                    <td className="py-2 text-white">{month(r.month)}</td>
                    <td className="py-2 text-right text-white">{euro(r.tournamentsCents)}</td>
                    <td className="py-2 text-right text-white">{euro(r.topUpsCents)}</td>
                    <td className="py-2 text-right font-bold text-[var(--accent)]">
                      {euro(r.tournamentsCents + r.topUpsCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Stat label="Tornei, da sempre" value={euro(revenue.tournamentTotalCents)} hint={`di cui Stripe ${euro(revenue.stripeTotalCents)}`} />
            <Stat label="Ricariche SC, da sempre" value={euro(revenue.topUpTotalCents)} />
          </div>

          {revenue.refundedCount > 0 && (
            <Note>Rimborsati: {revenue.refundedCount} iscrizioni, {euro(revenue.refundedCents)} (già esclusi dai totali).</Note>
          )}
          <Note>
            Importi <strong className="text-white">lordi</strong>: le quote dei tornei creati da organizzatori esterni
            arrivano sul tuo Stripe ma sono da girare a loro, quindi non sono tutte ricavo tuo.
          </Note>
          <Note>
            {revenue.topUpLedgerSince
              ? `Ricariche registrate in euro dal ${formatDate(revenue.topUpLedgerSince)}: quelle precedenti non sono conteggiate.`
              : "Nessuna ricarica registrata in euro finora: si contano da adesso, inserendo l'importo quando accrediti gli SC."}
          </Note>
        </Section>

        {/* ── Valori medi ────────────────────────────────────────────── */}
        <Section icon={<Receipt className="h-4 w-4 text-[var(--accent)]" />} title="Valori medi (AOV)">
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Iscrizione torneo media" value={euro(averages.tournamentEntryCents)} hint={`su ${averages.tournamentEntries} pagate`} />
            <Stat label="Ricarica media" value={euro(averages.topUpCents)} hint={`su ${averages.topUps} ricariche`} />
            <Stat label="Incasso per pagante" value={euro(averages.revenuePerPayingPlayerCents)} hint="tutto lo storico" />
            <Stat label="Giocatori paganti" value={String(averages.payingPlayers)} hint={`su ${acquisition.totalPlayers} iscritti`} />
          </div>
        </Section>

        {/* ── Crediti ────────────────────────────────────────────────── */}
        <Section icon={<Coins className="h-4 w-4 text-[var(--accent)]" />} title="SanderCredits">
          <div className="grid grid-cols-2 gap-2">
            <Stat
              label="SC in circolazione"
              value={credits.inCirculation.toLocaleString("it-IT")}
              hint={`≈ ${euro((credits.inCirculation / SC_PER_EURO) * 100)} che gli utenti possono ancora spendere`}
            />
            <Stat
              label="SC regalati con gli inviti"
              value={`fino a ${credits.referralCostMax.toLocaleString("it-IT")}`}
              hint={`${credits.referredSignups} iscritti da invito`}
            />
          </div>
          {credits.giftedViaTopUp > 0 && (
            <Note>Omaggi dall&apos;admin: {credits.giftedViaTopUp.toLocaleString("it-IT")} SC.</Note>
          )}
        </Section>

        {/* ── Acquisizione ───────────────────────────────────────────── */}
        <Section icon={<UserPlus className="h-4 w-4 text-[var(--accent)]" />} title="Nuovi iscritti">
          <table className="w-full text-base">
            <thead>
              <tr className="text-left text-sm text-[var(--muted-text)]">
                <th className="pb-2 font-medium">Mese</th>
                <th className="pb-2 text-right font-medium">Iscritti</th>
                <th className="pb-2 text-right font-medium">Da invito</th>
              </tr>
            </thead>
            <tbody>
              {acquisition.byMonth.map((a) => (
                <tr key={a.month} className="border-t border-[var(--border)]">
                  <td className="py-2 text-white">{month(a.month)}</td>
                  <td className="py-2 text-right text-white">{a.total}</td>
                  <td className="py-2 text-right text-white">{a.referred}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Note>
            Spesa pubblicitaria non registrata: il CAC per canale (TikTok, Instagram, inviti) si legge su Vercel
            Analytics dai link con <code className="text-white">?ref=</code>.
          </Note>
        </Section>

        {/* ── Retention ──────────────────────────────────────────────── */}
        <Section icon={<Repeat className="h-4 w-4 text-[var(--accent)]" />} title="Chi torna a giocare">
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
              {retention.byMonth.map((r) => (
                <tr key={r.month} className="border-t border-[var(--border)]">
                  <td className="py-2 text-white">{month(r.month)}</td>
                  <td className="py-2 text-right text-white">{r.active}</td>
                  <td className="py-2 text-right text-white">{r.newcomers}</td>
                  <td className="py-2 text-right font-bold text-[var(--accent)]">{pct(r.retainedPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Note>
            &quot;Tornati&quot; = quota dei giocatori del mese prima che hanno giocato di nuovo. Attivo = ha chiuso una
            partita o si è iscritto a un torneo nel mese.
          </Note>
        </Section>

        {/* ── Stagione ───────────────────────────────────────────────── */}
        <Section icon={<Sun className="h-4 w-4 text-[var(--accent)]" />} title="Ritorno stagione dopo stagione">
          {retention.bySeason.length === 0 ? (
            <p className="text-base text-[var(--muted-text)]">Nessuna partita registrata tra maggio e settembre.</p>
          ) : (
            <div className="space-y-2">
              {retention.bySeason.map((s) => (
                <div key={s.season} className="flex items-baseline justify-between rounded-xl bg-[var(--surface-2)] p-3">
                  <span className="text-base text-white">
                    Stagione {s.season} · <strong>{s.players}</strong> giocatori
                  </span>
                  <span className="text-base font-bold text-[var(--accent)]">
                    {s.returned === null ? `ritorno da misurare nel ${s.season + 1}` : `${pct(s.returnedPct)} tornati`}
                  </span>
                </div>
              ))}
            </div>
          )}
          <Note>
            È questo il vero churn: a novembre il calo mensile sembra un abbandono ma è solo la stagione. Conta quanti
            giocatori di agosto tornano a maggio.
          </Note>
        </Section>
      </div>
    </div>
  )
}
