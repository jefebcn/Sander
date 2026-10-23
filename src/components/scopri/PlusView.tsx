"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Crown, Check, Loader2, Ticket } from "lucide-react"
import { toast } from "sonner"
import { startPlusCheckout, cancelPlus, resumePlus } from "@/actions/plus"
import { buyScopriExtra } from "@/actions/scopri"
import { PLUS_BENEFITS } from "@/lib/scopri/plusBenefits"
import { useIsNativeApp } from "@/lib/native"

/**
 * SANDER+: what you get, the price, and the one button. Above it, your own
 * month (games, likes, days the free likes ran out) so you can judge whether
 * it pays off; below it, a 7-day pass in SC for a busy week, no subscription.
 */
export function PlusView({
  priceLabel,
  active,
  until,
  cancelAtEnd,
  passUntil,
  pass,
  month,
}: {
  priceLabel: string
  /** A Stripe subscription is running. */
  active: boolean
  until: string | null
  cancelAtEnd: boolean
  /** A 7-day pass is running (and no subscription). */
  passUntil: string | null
  pass: { days: number; sc: number; credits: number }
  month: { games: number; likes: number; daysAtLimit: number }
}) {
  const router = useRouter()
  // Inside the Android app digital subscriptions must go through Google Play
  // billing: no purchase there (as for SC packs, see WalletCard). Members who
  // subscribed on the web keep every benefit in the app.
  const native = useIsNativeApp()
  const [busy, setBusy] = useState(false)
  // Express request to start now (needed to start a paid digital service at once).
  const [consent, setConsent] = useState(false)
  const fmt = (iso: string | null) =>
    iso ? new Date(iso).toLocaleDateString("it-IT", { day: "numeric", month: "long", timeZone: "Europe/Rome" }) : null
  const date = fmt(until)
  const plusNow = active || !!passUntil
  const advice = plusNow
    ? null
    : month.daysAtLimit >= 3
      ? `Hai finito gli 8 like gratis in ${month.daysAtLimit} giorni: con SANDER+ non ti fermi.`
      : month.daysAtLimit >= 1 || month.games >= 4
        ? "Giochi spesso: SANDER+ ti fa trovare compagni più in fretta. Per una settimana di tornei basta il pass."
        : "Per ora la versione gratis ti basta. Se ti serve per un weekend di tornei, c'è il pass di 7 giorni."

  async function go(fn: () => Promise<unknown>, ok?: string) {
    setBusy(true)
    try {
      await fn()
      if (ok) toast.success(ok)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Non riuscito")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <section
        className="rounded-[var(--radius-lg)] p-6 shadow-[var(--shadow-card)]"
        style={{ background: "linear-gradient(150deg, color-mix(in srgb, var(--ace) 30%, var(--surface-2)), color-mix(in srgb, var(--accent) 16%, var(--surface-2)) 70%)" }}
      >
        <p className="eyebrow flex items-center gap-1 text-[var(--ace)]">
          <Crown className="h-4 w-4" aria-hidden="true" /> SANDER+
        </p>
        <h2 className="font-hand mt-2 text-[2.75rem] leading-none text-white">
          {plusNow ? "Sei SANDER+" : "Trova compagni senza limiti."}
        </h2>
        <p className="mt-3 font-serif text-2xl text-white/90">
          {active
            ? cancelAtEnd
              ? `Attivo fino al ${date}, poi non si rinnova.`
              : `Si rinnova il ${date}.`
            : passUntil
              ? `Pass attivo fino al ${fmt(passUntil)}.`
              : native
              ? "Non disponibile nell'app."
              : `${priceLabel} al mese. Disdici quando vuoi.`}
        </p>
      </section>

      <section className="rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4">
        <p className="eyebrow text-[var(--muted-text)]">Il tuo mese</p>
        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            { n: month.games, label: month.games === 1 ? "partita giocata" : "partite giocate" },
            { n: month.likes, label: month.likes === 1 ? "like mandato" : "like mandati" },
            { n: month.daysAtLimit, label: month.daysAtLimit === 1 ? "giorno senza like" : "giorni senza like" },
          ].map((s) => (
            <div key={s.label} className="rounded-[var(--radius-sm)] bg-[var(--surface-3)] px-2 py-3">
              <dd className="text-2xl font-black tabular-nums text-white">{s.n}</dd>
              <dt className="text-xs text-[var(--muted-text)]">{s.label}</dt>
            </div>
          ))}
        </dl>
        {advice && !native && <p className="mt-3 text-sm text-white/85">{advice}</p>}
      </section>

      <ul className="flex flex-col gap-2">
        {PLUS_BENEFITS.map((b) => (
          <li key={b.title} className="flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--ace)] text-black">
              <Check className="h-4 w-4" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-base font-extrabold text-white">{b.title}</span>
              <span className="block text-sm text-[var(--muted-text)]">{b.text}</span>
            </span>
          </li>
        ))}
      </ul>

      {!active && !native && (
        <label className="flex items-start gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 text-sm text-white">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--ace)]"
          />
          <span>
            Chiedo di attivare SANDER+ subito e so che per il mese iniziato perdo il diritto di recesso.
            Si rinnova ogni mese finché non lo disdico.{" "}
            <a href="/terms" className="font-bold text-[var(--ace)] underline">Termini</a>
          </span>
        </label>
      )}

      {native && !active ? null : !active ? (
        <button
          type="button"
          disabled={busy || !consent}
          onClick={() =>
            go(async () => {
              const { url } = await startPlusCheckout()
              window.location.href = url
            })
          }
          className="pressable flex min-h-[3.75rem] items-center justify-center gap-2 rounded-full bg-[var(--ace)] text-lg font-extrabold text-black disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Crown className="h-5 w-5" aria-hidden="true" />}
          Attiva SANDER+ · {priceLabel}/mese
        </button>
      ) : cancelAtEnd ? (
        <button
          type="button"
          disabled={busy}
          onClick={() => go(() => resumePlus(), "SANDER+ si rinnoverà")}
          className="min-h-[3.5rem] rounded-full bg-[var(--surface-3)] text-base font-extrabold text-white disabled:opacity-60"
        >
          Riattiva il rinnovo
        </button>
      ) : native ? null : (
        <button
          type="button"
          disabled={busy}
          onClick={() => {
            if (window.confirm(`Disdire SANDER+? Resta attivo fino al ${date}.`)) go(() => cancelPlus(), "Disdetto: resta attivo fino a fine mese")
          }}
          className="min-h-[3.5rem] text-base font-bold text-[var(--muted-text)]"
        >
          Disdici il rinnovo
        </button>
      )}
      {!active && !native && (
        <section className="flex flex-col gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
              <Ticket className="h-5 w-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-base font-extrabold text-white">Pass {pass.days} giorni · {pass.sc} SC</span>
              <span className="block text-sm text-[var(--muted-text)]">
                Tutto SANDER+ per una settimana, senza abbonamento. Non si rinnova.
              </span>
            </span>
          </div>
          <button
            type="button"
            disabled={busy || pass.credits < pass.sc}
            onClick={() => go(() => buyScopriExtra({ offer: "pass" }), `SANDER+ attivo per ${pass.days} giorni`)}
            className="btn btn-secondary w-full gap-2 disabled:opacity-60"
          >
            <Ticket className="h-5 w-5" aria-hidden="true" />
            {passUntil ? `Aggiungi ${pass.days} giorni` : `Attiva per ${pass.days} giorni`} · {pass.sc} SC
          </button>
          <p className="text-center text-xs text-[var(--muted-text)]">
            Hai {pass.credits} SC.
            {pass.credits < pass.sc && (
              <>
                {" "}
                <Link href="/profile" className="font-bold text-[var(--accent)] underline">Ricarica dal profilo</Link>
              </>
            )}
          </p>
        </section>
      )}
      {!native && (
        <p className="text-center text-xs text-[var(--muted-text)]">Pagamento sicuro con Stripe. L&apos;abbonamento si rinnova ogni mese finché non lo disdici.</p>
      )}
    </div>
  )
}
