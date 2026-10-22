"use client"

import { useState } from "react"
import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"
import { useHaptic } from "@/lib/useHaptic"
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/Dialog"

interface SignOutButtonProps {
  className?: string
  children?: React.ReactNode
  iconOnly?: boolean
}

/** Asks first: the button sits right next to "Modifica profilo" and one stray tap logged people out. */
export function SignOutButton({ className, children, iconOnly }: SignOutButtonProps) {
  const haptic = useHaptic()
  const [pending, setPending] = useState(false)

  function confirmSignOut() {
    haptic("light")
    setPending(true)
    localStorage.removeItem("sander_onboarded")
    signOut({ callbackUrl: "/" })
  }

  return (
    <Dialog>
      <DialogTrigger className={className} aria-label="Esci dall'account">
        {children ?? (
          iconOnly
            ? <LogOut className="h-4 w-4" aria-hidden="true" />
            : <><LogOut className="h-4 w-4" aria-hidden="true" /> Esci dall&apos;account</>
        )}
      </DialogTrigger>
      <DialogContent
        className="w-[calc(100%-2rem)]"
        title="Vuoi uscire?"
        description="Dovrai accedere di nuovo per segnare punteggi e unirti alle partite."
      >
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={confirmSignOut}
            disabled={pending}
            className="flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-2xl text-base font-black text-white disabled:opacity-60"
            style={{ background: "var(--danger)" }}
          >
            <LogOut className="h-5 w-5" aria-hidden="true" />
            {pending ? "Uscita…" : "Esci dall'account"}
          </button>
          <DialogClose className="flex min-h-[3.5rem] w-full items-center justify-center rounded-full btn-secondary text-base font-bold text-white">
            Annulla
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
