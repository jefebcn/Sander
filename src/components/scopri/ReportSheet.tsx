"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Sheet } from "@/components/ui/Sheet"
import { blockPlayer } from "@/actions/scopri"
import { cn } from "@/lib/utils"

const REASONS = [
  { id: "FINTO", label: "Profilo finto o foto non sue" },
  { id: "FOTO", label: "Foto non adatta" },
  { id: "OFFENSIVO", label: "Messaggi offensivi" },
  { id: "MOLESTIE", label: "Molestie o insistenza" },
  { id: "MINORENNE", label: "Sembra minorenne" },
  { id: "ALTRO", label: "Altro" },
] as const

/**
 * Report (anonymous) or just block. Either way you never see each other again,
 * and the chat between you closes.
 */
export function ReportSheet({
  open,
  onOpenChange,
  playerId,
  name,
  onDone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  playerId: string
  name: string
  /** Called after a block or report (e.g. to drop the card from the deck). */
  onDone?: () => void
}) {
  const router = useRouter()
  const [reason, setReason] = useState<(typeof REASONS)[number]["id"] | null>(null)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState<"report" | "block" | null>(null)

  async function go(report: boolean) {
    if (report && !reason) return toast.error("Scegli un motivo")
    setBusy(report ? "report" : "block")
    try {
      await blockPlayer({
        playerId,
        report: report && reason ? { reason, note: note.trim() || undefined } : undefined,
      })
      toast.success(report ? "Segnalazione inviata. Grazie." : `${name} è bloccato`)
      onOpenChange(false)
      onDone?.()
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Non riuscito")
    } finally {
      setBusy(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={`Segnala ${name}`} description="La segnalazione è anonima. Non vi vedrete più su SANDER.">
      <fieldset className="flex flex-col gap-2">
        <legend className="sr-only">Motivo</legend>
        {REASONS.map((r) => (
          <button
            key={r.id}
            type="button"
            aria-pressed={reason === r.id}
            onClick={() => setReason(r.id)}
            className={cn(
              "min-h-[3.5rem] rounded-[var(--radius-md)] px-4 text-left text-base font-bold",
              reason === r.id ? "bg-[var(--accent-soft)] text-white ring-2 ring-[var(--accent)]" : "bg-[var(--surface-2)] text-white",
            )}
          >
            {r.label}
          </button>
        ))}
      </fieldset>
      <label htmlFor="report-note" className="sr-only">Dettagli</label>
      <textarea
        id="report-note"
        value={note}
        onChange={(e) => setNote(e.target.value.slice(0, 500))}
        rows={3}
        placeholder="Dettagli (facoltativo)"
        className="mt-3 w-full resize-none rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 text-base text-white placeholder:text-[var(--muted-text)] outline-none ring-1 ring-[var(--border)] focus:ring-[var(--accent)]"
      />
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => go(true)}
        className="pressable mt-3 flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-full bg-[var(--danger)] text-base font-extrabold text-white disabled:opacity-60"
      >
        {busy === "report" && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />} Segnala e blocca
      </button>
      <button
        type="button"
        disabled={busy !== null}
        onClick={() => go(false)}
        className="mt-1 flex min-h-[3.5rem] w-full items-center justify-center gap-2 text-base font-bold text-[var(--muted-text)]"
      >
        {busy === "block" && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />} Blocca senza segnalare
      </button>
    </Sheet>
  )
}
