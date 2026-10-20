"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, Loader2, ScanFace, Hourglass } from "lucide-react"
import { toast } from "sonner"
import { shrinkImage } from "@/lib/shrinkImage"

export interface SelfieState {
  verified: boolean
  /** Latest check, if any: PENDING | APPROVED | REJECTED. */
  last: "PENDING" | "APPROVED" | "REJECTED" | null
  /** Today's gesture. */
  gesture: { emoji: string; text: string }
}

/** "Foto verificata": a live selfie with today's gesture, checked by SANDER. */
export function SelfieVerify({ state, hasPhotos }: { state: SelfieState; hasPhotos: boolean }) {
  const router = useRouter()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)

  async function send(file: File) {
    setBusy(true)
    try {
      const body = new FormData()
      body.append("file", await shrinkImage(file))
      const res = await fetch("/api/scopri/selfie", { method: "POST", body })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? "Invio non riuscito")
      toast.success("Selfie inviato: lo controlliamo entro 24 ore")
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invio non riuscito")
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ""
    }
  }

  if (state.verified) {
    return (
      <p className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--accent-soft)] p-4 text-base font-bold text-white">
        <ScanFace className="h-6 w-6 shrink-0 text-[var(--accent)]" aria-hidden="true" />
        Foto verificata. Se aggiungi una nuova foto, la verifica va rifatta.
      </p>
    )
  }
  if (state.last === "PENDING") {
    return (
      <p className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4 text-base text-white">
        <Hourglass className="h-6 w-6 shrink-0 text-[var(--accent)]" aria-hidden="true" />
        Selfie in verifica: di solito entro 24 ore. Ti avvisiamo noi.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-md)] bg-[var(--surface-2)] p-4">
      {state.last === "REJECTED" && (
        <p className="text-sm font-bold text-[var(--danger)]">
          L&apos;ultimo selfie non corrispondeva alle foto o al gesto. Riprova con luce buona e il viso ben visibile.
        </p>
      )}
      <p className="text-base text-white">
        Scatta un selfie adesso facendo questo gesto. Lo confrontiamo con le tue foto e poi lo cancelliamo.
      </p>
      <p className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--surface-3)] p-3 text-base font-bold text-white">
        <span className="text-3xl" aria-hidden="true">{state.gesture.emoji}</span>
        {state.gesture.text}
      </p>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && send(e.target.files[0])}
      />
      <button
        type="button"
        disabled={busy || !hasPhotos}
        onClick={() => input.current?.click()}
        className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-full bg-[var(--accent)] text-base font-extrabold text-black disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Camera className="h-5 w-5" aria-hidden="true" />}
        {hasPhotos ? "Scatta il selfie" : "Prima aggiungi una foto"}
      </button>
    </div>
  )
}
