"use client"

import { useState } from "react"
import { Copy, Check, Share2, Info } from "lucide-react"

interface InviteTabProps {
  promoCode: string
  playerName: string
}

export function InviteTab({ promoCode, playerName }: InviteTabProps) {
  const [copied, setCopied] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  async function copyCode() {
    await navigator.clipboard.writeText(promoCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function shareCode() {
    const text = `Unisciti a SANDER, la piattaforma per il beach volleyball! Usa il mio codice ${promoCode} per eliminare la Sander fee. 🏐`
    if (navigator.share) {
      await navigator.share({ title: "SANDER — il tuo codice promo", text })
    } else {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="px-4 space-y-5 pt-2">

      {/* Hero */}
      <div className="flex items-start gap-4">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
          style={{ background: "var(--accent)" }}
        >
          <span className="text-2xl">%</span>
        </div>
        <div>
          <h2 className="text-xl font-black text-white leading-snug">
            Invita gli amici e taglia la Sander fee!
          </h2>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--muted-text)] leading-relaxed">
        Sander applica una commissione di gestione solo quando ti iscrivi a una partita che richiede il pagamento anticipato della quota campo tramite l&apos;app. Condividi il tuo codice promo con gli amici ed elimina la Sander fee!
      </p>

      {/* Promo code box */}
      <div
        className="rounded-2xl px-4 py-4"
        style={{ border: "1px solid rgba(255,255,255,0.15)", background: "var(--surface-2)" }}
      >
        <p className="text-xs text-[var(--muted-text)] mb-1">Il tuo codice promo</p>
        <div className="flex items-center justify-between">
          <span className="text-2xl font-black tracking-widest text-white">{promoCode}</span>
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 text-sm font-bold text-[var(--accent)] transition-opacity active:opacity-60"
          >
            {copied
              ? <><Check className="h-4 w-4" /> Copiato!</>
              : <><Copy className="h-4 w-4" /> Copia</>
            }
          </button>
        </div>
      </div>

      {/* Share CTA */}
      <button
        onClick={shareCode}
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl font-black text-black text-base transition-opacity active:opacity-80"
        style={{ background: "var(--accent)" }}
      >
        <Share2 className="h-4 w-4" />
        Condividi il tuo codice promo con gli amici
      </button>

      {/* Come funziona toggle */}
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="flex items-center gap-2 text-sm font-semibold text-[var(--accent)]"
      >
        <Info className="h-4 w-4" />
        Come funziona
      </button>

      {showInfo && (
        <div
          className="rounded-2xl p-4 space-y-2 text-sm text-[var(--muted-text)] leading-relaxed"
          style={{ background: "var(--surface-2)" }}
        >
          <p>1. Condividi il tuo codice promo con un amico.</p>
          <p>2. Il tuo amico si registra su SANDER usando il tuo codice.</p>
          <p>3. Entrambi ottenete l&apos;esenzione dalla Sander fee per le partite con pagamento in-app.</p>
          <p>4. Per ogni amico invitato accumuli crediti nel tuo saldo bonus.</p>
        </div>
      )}

      {/* Saldo section */}
      <div
        className="rounded-2xl"
        style={{ border: "1px solid rgba(255,255,255,0.08)", background: "var(--surface-2)" }}
      >
        <div className="flex items-center justify-between px-4 py-4">
          <span className="text-base font-black text-white">Il tuo saldo</span>
          <span className="text-base font-black text-[var(--accent)]">0</span>
        </div>
        <div
          className="px-4 py-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-sm text-[var(--muted-text)]">Cronologia bonus</p>
          <p className="text-xs text-[var(--muted-text)] mt-2 opacity-60">Nessun bonus ancora</p>
        </div>
      </div>
    </div>
  )
}
