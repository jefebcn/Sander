"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Crown, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { startPlusCheckout, cancelPlus, resumePlus } from "@/actions/plus"
import { PLUS_BENEFITS } from "@/lib/scopri/plusBenefits"

/** SANDER+: what you get, the price, and the one button. */
export function PlusView({
  priceLabel,
  active,
  until,
  cancelAtEnd,
}: {
  priceLabel: string
  active: boolean
  until: string | null
  cancelAtEnd: boolean
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  // Express request to start now (needed to start a paid digital service at once).
  const [consent, setConsent] = useState(false)
  const date = until ? new Date(until).toLocaleDateString("it-IT", { day: "numeric", month: "long", timeZone: "Europe/Rome" }) : null

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
        <h2 className="mt-2 font-display text-4xl font-extrabold leading-none text-white">
          {active ? "Sei SANDER+" : "Trova compagni senza limiti."}
        </h2>
        <p className="mt-3 font-serif text-2xl text-white/90">
          {active
            ? cancelAtEnd
              ? `Attivo fino al ${date}, poi non si rinnova.`
              : `Si rinnova il ${date}.`
            : `${priceLabel} al mese. Disdici quando vuoi.`}
        </p>
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

      {!active && (
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

      {!active ? (
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
      ) : (
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
      <p className="text-center text-xs text-[var(--muted-text)]">Pagamento sicuro con Stripe. L&apos;abbonamento si rinnova ogni mese finché non lo disdici.</p>
    </div>
  )
}
