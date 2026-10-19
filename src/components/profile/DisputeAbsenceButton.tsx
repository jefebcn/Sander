"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Sheet } from "@/components/ui/Sheet"
import { disputeAbsence } from "@/actions/scopri"

/** "Ero presente": contest a no-show with a short note for the admin. */
export function DisputeAbsenceButton({ eventId, title }: { eventId: string; title: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)

  async function send() {
    setBusy(true)
    try {
      await disputeAbsence({ eventId, note })
      toast.success("Contestazione inviata: intanto l'assenza non conta")
      setOpen(false)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Non riuscito")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[2.75rem] rounded-full bg-[var(--surface-4)] px-4 text-sm font-extrabold text-white"
      >
        Ero presente
      </button>
      <Sheet open={open} onOpenChange={setOpen} title="Ero presente" description={`${title}: spiega in due righe, la verifica la fa un admin.`}>
        <label htmlFor={`dispute-${eventId}`} className="sr-only">Cosa è successo</label>
        <textarea
          id={`dispute-${eventId}`}
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 300))}
          rows={3}
          placeholder="Es. «C'ero, ho giocato in squadra con Luca, 21-15 21-18»"
          className="w-full resize-none rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 text-base text-white placeholder:text-[var(--muted-text)] outline-none ring-1 ring-[var(--border)] focus:ring-[var(--accent)]"
        />
        <button
          type="button"
          disabled={busy || note.trim().length < 3}
          onClick={send}
          className="pressable mt-3 flex min-h-[3.75rem] w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-lg font-extrabold text-black disabled:opacity-60"
        >
          {busy && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />} Invia
        </button>
      </Sheet>
    </>
  )
}
