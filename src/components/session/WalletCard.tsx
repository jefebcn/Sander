"use client"

import { useEffect, useState, useTransition } from "react"
import Link from "next/link"
import { Coins, Copy, Check, ChevronDown, ExternalLink, ShieldCheck, UserPlus } from "lucide-react"
import { cn } from "@/lib/utils"
import { CREDIT_PACKS, packBonusPct } from "@/lib/pricing"
import { startCreditCheckout } from "@/actions/credits"
import { isNativeApp } from "@/lib/native"

const IBAN = "IE06 SUMU 9903 6511 9972 84"
const BIC = "SUMUIE22XXX"
const PAYPAL = "www.paypal.me/lilconti"
const INTESTATARIO = "Alex Conti"

interface WalletCardProps {
  credits: number
  playerName: string
}

export function WalletCard({ credits, playerName }: WalletCardProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [buying, setBuying] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  // In-app card purchases are web-only: inside the Android app, digital
  // credits bought outside Google Play billing can breach Play policy.
  const [native, setNative] = useState(false)
  useEffect(() => setNative(isNativeApp()), [])

  function copyIban() {
    navigator.clipboard.writeText(IBAN.replace(/\s/g, "")).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  function buy(packId: string) {
    setError(null)
    setBuying(packId)
    startTransition(async () => {
      const res = await startCreditCheckout({ packId })
      if (res.ok) {
        window.location.href = res.redirectUrl
      } else {
        setError(res.error)
        setBuying(null)
      }
    })
  }

  return (
    <div className="tone-play overflow-hidden rounded-[var(--radius-lg)] bg-[var(--surface-2)]">
      {/* Balance */}
      <div className="flex items-center gap-3 p-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--tone-soft)]">
          <Coins className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[var(--muted-text)]">SanderCredits</p>
          <p className="num text-3xl leading-none text-white">
            {credits} <span className="text-base text-[var(--accent)]">SC</span>
          </p>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex min-h-[2.75rem] items-center gap-1 rounded-full bg-[var(--accent)] px-4 text-sm font-extrabold text-black"
        >
          Ricarica
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
        </button>
      </div>

      {open && (
        <div className="flex flex-col gap-3 border-t border-[var(--border)] px-4 pb-4 pt-4">
          <p className="text-sm text-[var(--muted-text)]">
            Con i SC entri nelle partite a pagamento e crei tornei. 1 € = 10 SC.
          </p>

          {!native && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {CREDIT_PACKS.map((p) => {
                  const bonus = packBonusPct(p)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => buy(p.id)}
                      disabled={buying !== null}
                      className={cn(
                        "pressable relative flex min-h-[7rem] flex-col items-center justify-center gap-1 rounded-[var(--radius-md)] bg-[var(--surface-3)] px-2 pt-3 pb-2 disabled:opacity-50",
                        bonus > 0 && "ring-1 ring-[var(--accent-line)]",
                      )}
                    >
                      {bonus > 0 && (
                        <span className="absolute -top-2 rounded-full bg-[var(--accent)] px-2 py-0.5 text-xs font-extrabold text-black">
                          +{bonus}%
                        </span>
                      )}
                      <span className="num text-3xl leading-none text-white">{p.credits}</span>
                      <span className="text-xs font-bold text-[var(--muted-text)]">SC</span>
                      <span className="mt-1 rounded-full bg-black/30 px-3 py-1 text-sm font-extrabold text-[var(--accent)]">
                        {buying === p.id ? "…" : `${p.priceCents / 100} €`}
                      </span>
                    </button>
                  )
                })}
              </div>
              <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--muted-text)]">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Pagamento sicuro con Stripe · accredito immediato
              </p>
              {error && <p className="text-center text-sm text-[var(--danger)]">{error}</p>}
            </>
          )}

          <Link
            href="/profile?tab=invita"
            className="flex min-h-[3.5rem] items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-3)] px-4"
          >
            <UserPlus className="h-5 w-5 text-[var(--social)]" aria-hidden="true" />
            <span className="flex-1 text-sm font-bold text-white">Guadagna SC gratis invitando un amico</span>
          </Link>

          {/* Manual methods: kept for whoever prefers them; credited by the admin. */}
          <details className="group rounded-[var(--radius-md)] bg-[var(--surface-3)]">
            <summary className="flex min-h-[3.5rem] cursor-pointer list-none items-center justify-between px-4 text-sm font-bold text-white">
              Altri metodi: PayPal o bonifico
              <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="flex flex-col gap-3 px-4 pb-4">
              <a
                href={`https://${PAYPAL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[3rem] items-center justify-between rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-4"
              >
                <span className="text-sm font-bold text-white">PayPal</span>
                <span className="flex items-center gap-1.5 text-xs text-[var(--muted-text)]">
                  {PAYPAL} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </a>
              <div className="flex flex-col gap-2 rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-4 py-3">
                <div className="flex items-center justify-between">
                  <p className="eyebrow text-[var(--muted-text)]">Bonifico</p>
                  <button
                    onClick={copyIban}
                    className={cn(
                      "flex min-h-[2.25rem] items-center gap-1 rounded-full px-3 text-xs font-bold",
                      copied ? "bg-[var(--live)]/20 text-[var(--live)]" : "bg-[var(--surface-3)] text-[var(--accent)]",
                    )}
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copiato" : "Copia IBAN"}
                  </button>
                </div>
                <p className="text-sm font-black tracking-wider text-white">{IBAN}</p>
                <p className="text-xs text-[var(--muted-text)]">{INTESTATARIO} · BIC: {BIC}</p>
              </div>
              <p className="text-sm text-[var(--muted-text)]">
                Causale: <strong className="text-[var(--accent)]">SC - {playerName}</strong>. Poi scrivi all&apos;admin
                per l&apos;accredito.
              </p>
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
