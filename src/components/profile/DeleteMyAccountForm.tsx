"use client"

import { useState, useTransition } from "react"
import { signOut } from "next-auth/react"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"
import { deleteMyAccount } from "@/actions/players"

/** Erase your own account from inside the app: type ELIMINA, confirm, signed out. */
export function DeleteMyAccountForm() {
  const [word, setWord] = useState("")
  const [busy, start] = useTransition()
  const ready = word.trim().toUpperCase() === "ELIMINA"

  function erase() {
    if (!window.confirm("Eliminare l'account per sempre? Non si può annullare.")) return
    start(async () => {
      try {
        await deleteMyAccount({ confirm: "ELIMINA" })
        try {
          localStorage.removeItem("sander_has_profile")
        } catch {}
        await signOut({ callbackUrl: "/" })
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Eliminazione non riuscita, riprova")
      }
    })
  }

  return (
    <div className="space-y-3 rounded-2xl bg-[var(--surface-2)] p-4">
      <p className="font-black text-white">Elimina subito dall&apos;app</p>
      <p className="text-base text-white/70">
        Scrivi <strong className="text-white">ELIMINA</strong> e conferma: account e dati personali vengono cancellati
        all&apos;istante e vieni disconnesso.
      </p>
      <label className="sr-only" htmlFor="erase-word">Scrivi ELIMINA per confermare</label>
      <input
        id="erase-word"
        value={word}
        onChange={(e) => setWord(e.target.value)}
        autoComplete="off"
        placeholder="ELIMINA"
        className="min-h-[3.5rem] w-full rounded-xl bg-[var(--surface-3)] px-4 text-base text-white placeholder:text-[var(--muted-text)]"
      />
      <button
        type="button"
        disabled={!ready || busy}
        onClick={erase}
        className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-full bg-[var(--danger)] text-base font-bold text-white transition-opacity disabled:opacity-40"
      >
        <Trash2 className="h-5 w-5" aria-hidden="true" />
        {busy ? "Eliminazione…" : "Elimina il mio account"}
      </button>
    </div>
  )
}
