"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Sun, Loader2, Check } from "lucide-react"
import { toast } from "sonner"
import { Sheet } from "@/components/ui/Sheet"
import { setFreeToday } from "@/actions/scopri"
import { FREE_SLOTS, freeSlotLabel, type FreeSlot } from "@/lib/scopri/reliability"
import { cn } from "@/lib/utils"

/**
 * "Libero oggi": one tap to go to the front of today's decks, in a slot.
 * Lime, the logo's colour, because it means "live, now".
 */
export function FreeTodayButton({ initial, className }: { initial: FreeSlot | null; className?: string }) {
  const router = useRouter()
  const [slot, setSlot] = useState<FreeSlot | null>(initial)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<FreeSlot | "off" | null>(null)

  async function choose(next: FreeSlot | null) {
    setBusy(next ?? "off")
    try {
      const res = await setFreeToday({ slot: next })
      setSlot(next)
      setOpen(false)
      toast.success(
        next
          ? res.notified > 0
            ? `Sei in cima ai mazzi di oggi. Avvisati ${res.notified} match.`
            : "Sei in cima ai mazzi di oggi."
          : "Non sei più segnato libero oggi",
      )
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Non riuscito")
    } finally {
      setBusy(null)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={cn(
          "flex min-h-[2.75rem] items-center gap-1.5 rounded-full px-4 text-sm font-extrabold",
          slot
            ? "bg-[var(--lime)] text-black"
            : "bg-[color-mix(in_srgb,var(--lime)_14%,transparent)] text-[var(--lime)] ring-1 ring-[color-mix(in_srgb,var(--lime)_35%,transparent)]",
          className,
        )}
      >
        <Sun className="h-4 w-4" aria-hidden="true" />
        {slot ? `Libero · ${freeSlotLabel(slot).toLowerCase()}` : "Sono libero oggi"}
      </button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        title="Sei libero oggi?"
        description="Per oggi passi davanti nei mazzi di chi gioca vicino, e i tuoi match ricevono un avviso."
      >
        <ul className="grid grid-cols-2 gap-2">
          {FREE_SLOTS.map((s) => (
            <li key={s.key}>
              <button
                type="button"
                disabled={busy !== null}
                aria-pressed={slot === s.key}
                onClick={() => choose(s.key)}
                className={cn(
                  "flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-[var(--radius-md)] text-base font-extrabold",
                  slot === s.key ? "bg-[var(--lime)] text-black" : "bg-[var(--surface-2)] text-white",
                )}
              >
                {busy === s.key ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : slot === s.key && <Check className="h-5 w-5" aria-hidden="true" />}
                {s.label}
              </button>
            </li>
          ))}
        </ul>
        {slot && (
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => choose(null)}
            className="mt-3 flex min-h-[3.5rem] w-full items-center justify-center gap-2 text-base font-bold text-[var(--muted-text)]"
          >
            {busy === "off" && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />} Non sono più libero
          </button>
        )}
        <p className="mt-2 text-center text-sm text-[var(--muted-text)]">Vale fino a mezzanotte.</p>
      </Sheet>
    </>
  )
}
