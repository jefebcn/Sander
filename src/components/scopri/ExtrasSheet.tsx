"use client"

import { useState } from "react"
import Link from "next/link"
import { Heart, Crown, Eye, Loader2, type LucideIcon } from "lucide-react"
import { toast } from "sonner"
import { Sheet } from "@/components/ui/Sheet"
import { buyScopriExtra } from "@/actions/scopri"
import { SC_OFFERS, type ScOfferId } from "@/lib/scopri/rules"
import { useIsNativeApp } from "@/lib/native"
import type { Allowance } from "./types"

const ICONS: Record<ScOfferId, LucideIcon> = { likes: Heart, ace: Crown, reveal: Eye }

/** Extras paid with SanderCredits: more likes, an Ace, everyone who likes you. */
export function ExtrasSheet({
  open,
  onOpenChange,
  only,
  onBought,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Show just these offers (e.g. only likes when you run out). */
  only?: ScOfferId[]
  onBought?: (allowance: Allowance) => void
}) {
  const [busy, setBusy] = useState<ScOfferId | null>(null)
  // No SANDER+ upsell inside the Android app (Google Play billing rules).
  const native = useIsNativeApp()
  const offers = (Object.keys(SC_OFFERS) as ScOfferId[]).filter((k) => !only || only.includes(k))

  async function buy(id: ScOfferId) {
    setBusy(id)
    try {
      const res = await buyScopriExtra({ offer: id })
      toast.success(id === "reveal" ? "Per 24 ore vedi tutti quelli che ti vogliono" : "Fatto! Li trovi già nel tuo conto")
      onBought?.(res.allowance)
      onOpenChange(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Acquisto non riuscito")
    } finally {
      setBusy(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Extra con gli SC" description="Si pagano con i SanderCredits del tuo profilo.">
      {!native && (
      <Link
        href="/scopri/plus"
        onClick={() => onOpenChange(false)}
        className="pressable mb-3 flex min-h-[4rem] items-center gap-3 rounded-[var(--radius-md)] px-4 text-left"
        style={{ background: "linear-gradient(120deg, color-mix(in srgb, var(--ace) 26%, var(--surface-2)), var(--surface-2) 70%)" }}
      >
        <Crown className="h-6 w-6 shrink-0 text-[var(--ace)]" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-extrabold text-white">SANDER+</span>
          <span className="block text-sm text-[var(--muted-text)]">Like illimitati, vedi tutti, 3 Ace a settimana</span>
        </span>
      </Link>
      )}
      <ul className="flex flex-col gap-2">
        {offers.map((id) => {
          const o = SC_OFFERS[id]
          const Icon = ICONS[id]
          return (
            <li key={id}>
              <button
                type="button"
                disabled={busy !== null}
                onClick={() => buy(id)}
                className="pressable flex min-h-[4.5rem] w-full items-center gap-4 rounded-[var(--radius-md)] bg-[var(--surface-2)] px-4 text-left disabled:opacity-60"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-extrabold text-white">{o.title}</span>
                  <span className="block text-sm text-[var(--muted-text)]">{o.text}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-[var(--accent)] px-3 py-1.5 text-sm font-extrabold text-black">
                  {busy === id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : `${o.sc} SC`}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <Link href="/profile" className="mt-4 flex min-h-[3.5rem] items-center justify-center text-base font-bold text-[var(--accent)]">
        Ricarica gli SC
      </Link>
    </Sheet>
  )
}
