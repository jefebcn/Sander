"use client"

import { useState } from "react"
import { Coins, Copy, Check, ChevronDown, ChevronUp, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

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

  function copyIban() {
    navigator.clipboard.writeText(IBAN.replace(/\s/g, "")).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="rounded-2xl bg-[var(--surface-2)] overflow-hidden">
      {/* Header row — always visible */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-[var(--accent)]" />
          <span className="text-sm font-bold text-white">SanderCredits</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-black text-[var(--accent)]">{credits}</span>
            <span className="text-xs font-bold text-[var(--muted-text)]">SC</span>
          </div>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold"
            style={{ background: "var(--surface-3)", color: "var(--accent)" }}
          >
            Ricarica
            {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* Recharge panel */}
      {open && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3 flex flex-col gap-3">
          {/* What are SC */}
          <div className="rounded-xl bg-[var(--surface-3)] px-4 py-3 flex flex-col gap-1">
            <p className="text-xs font-bold text-white">Cosa sono i SanderCredits?</p>
            <p className="text-[0.65rem] text-[var(--muted-text)] leading-snug">
              I SC sono la valuta interna di Sander. Puoi usarli per partecipare alle sessioni
              a pagamento create da altri giocatori. Ricarichi mandando denaro all&apos;admin,
              che ti accredita i crediti manualmente.
            </p>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--muted-text)]">Tasso di conversione</p>
            <p className="text-sm font-black text-white">1 € = 10 SC</p>
          </div>

          {/* PayPal */}
          <a
            href={`https://${PAYPAL}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-xl px-4 py-3"
            style={{ background: "#003087" }}
          >
            <span className="text-sm font-bold text-white">PayPal</span>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white/80">{PAYPAL}</span>
              <ExternalLink className="h-3.5 w-3.5 text-white/60" />
            </div>
          </a>

          {/* IBAN */}
          <div className="rounded-xl bg-[var(--surface-3)] px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[var(--muted-text)] uppercase tracking-wider">Bonifico</p>
              <button
                onClick={copyIban}
                className={cn(
                  "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-colors",
                  copied
                    ? "bg-green-500/20 text-green-400"
                    : "bg-[var(--surface-2)] text-[var(--accent)]"
                )}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copiato" : "Copia IBAN"}
              </button>
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-black text-white tracking-wider">{IBAN}</p>
              <p className="text-xs text-[var(--muted-text)]">{INTESTATARIO} · BIC: {BIC}</p>
            </div>
          </div>

          {/* Causale */}
          <div className="rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-4 py-3">
            <p className="text-xs text-[var(--muted-text)] mb-1">Causale da usare</p>
            <p className="text-sm font-black text-[var(--accent)]">SC - {playerName}</p>
          </div>

          <p className="text-[0.65rem] text-[var(--muted-text)] leading-snug text-center">
            Dopo il pagamento contatta l&apos;admin per l&apos;accredito dei crediti.
          </p>
        </div>
      )}
    </div>
  )
}
