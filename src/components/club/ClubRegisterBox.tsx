"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Copy, Loader2, MessageCircle, UserPlus, X } from "lucide-react"
import { toast } from "sonner"
import { cancelPairInvite, createPairInvite, registerForTournament } from "@/actions/registration"

interface Props {
  tournamentId: string
  tournamentName: string
  /** "€ 25,00" or null when free. */
  price: string | null
  pairFormat: boolean
  registered: boolean
  paid: boolean
  isAuthed: boolean
  open: boolean
  /** My invite still waiting for the partner. */
  pendingToken: string | null
}

/**
 * Sign-up for a club tournament: in pairs through an invite link (or alone in
 * rotating-partner formats), paid at the court.
 */
export function ClubRegisterBox(p: Props) {
  const [token, setToken] = useState(p.pendingToken)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  // Built on tap: the origin isn't known while rendering on the server.
  const link = () => `${window.location.origin}/tournaments/${p.tournamentId}/coppia/${token}?ref=coppia`
  const payNote = p.price ? `Quota ${p.price} a testa, si paga al campo (contanti o Satispay).` : "Iscrizione gratuita."

  if (p.registered) {
    return (
      <div className="flex items-start gap-3 rounded-2xl bg-[var(--surface-2)] p-4">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--live)]" aria-hidden="true" />
        <p className="text-base text-white">
          Sei iscritto. {p.price ? (p.paid ? "Quota pagata." : `Ricordati la quota: ${p.price}, al campo.`) : ""}
        </p>
      </div>
    )
  }
  if (!p.open) return null
  if (!p.isAuthed) {
    return (
      <Link href={`/auth/signin?callbackUrl=/tournaments/${p.tournamentId}&mode=register`} className="btn btn-primary w-full">
        Accedi per iscriverti
      </Link>
    )
  }

  if (!p.pairFormat) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await registerForTournament({ tournamentId: p.tournamentId })
              if (!res.ok) return void toast.error(res.error)
              toast.success("Sei iscritto!")
              router.refresh()
            })
          }
          className="btn btn-primary w-full gap-2"
        >
          {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <UserPlus className="h-5 w-5" aria-hidden="true" />}
          Iscriviti
        </button>
        <p className="text-center text-sm text-[var(--muted-text)]">{payNote}</p>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const res = await createPairInvite(p.tournamentId)
              if (!res.ok) return void toast.error(res.error)
              setToken(res.token)
            })
          }
          className="btn btn-primary w-full gap-2"
        >
          {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <UserPlus className="h-5 w-5" aria-hidden="true" />}
          Iscriviti in coppia
        </button>
        <p className="text-center text-sm text-[var(--muted-text)]">
          Inviti il compagno con un link: quando accetta, la coppia è iscritta. {payNote}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-[var(--surface-2)] p-4">
      <p className="text-base font-bold text-white">Manda il link al compagno</p>
      <p className="text-base text-[var(--muted-text)]">Appena accetta siete iscritti e ti arriva una notifica. {payNote}</p>
      <button
        type="button"
        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Facciamo coppia a "${p.tournamentName}"? Accetta qui: ${link()}`)}`, "_blank", "noopener,noreferrer")}
        className="btn btn-primary w-full gap-2"
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" /> Manda su WhatsApp
      </button>
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(link()).then(() => toast.success("Link copiato"), () => toast.error(link()))}
        className="btn btn-secondary w-full gap-2"
      >
        <Copy className="h-5 w-5" aria-hidden="true" /> Copia il link
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const res = await cancelPairInvite(token)
            if (!res.ok) return void toast.error(res.error)
            setToken(null)
          })
        }
        className="flex min-h-[3.5rem] items-center justify-center gap-1 text-base font-bold text-[var(--muted-text)]"
      >
        <X className="h-4 w-4" aria-hidden="true" /> Annulla l&apos;invito
      </button>
    </div>
  )
}
