"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { CheckCircle2, Clock, Copy, CreditCard, Hourglass, Loader2, MessageCircle, QrCode, UserPlus, X } from "lucide-react"
import { toast } from "sonner"
import { cancelPairInvite, claimLinkPayment, createPairInvite, joinWaitlist, leaveWaitlist, registerForTournament } from "@/actions/registration"

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
  /** No seats left: the waiting list replaces the sign-up buttons. */
  full: boolean
  /** My place in the waiting list, or null. */
  waitlistPosition: number | null
  /** The other half of my pair in the waiting list. */
  waitlistPartner: string | null
  /** My registration, for the check-in ticket. */
  registrationId: string | null
  /** The club's payment link (amount filled in where the service allows), or null: pay at the court. */
  paymentUrl: string | null
  paymentProvider: string | null
  /** "Ho pagato" already tapped: waiting for the staff to confirm. */
  paymentClaimed: boolean
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
  const payNote = !p.price
    ? "Iscrizione gratuita."
    : p.paymentUrl
      ? `Quota ${p.price} a testa: la paghi online al club${p.paymentProvider ? ` (${p.paymentProvider})` : ""} o al campo.`
      : `Quota ${p.price} a testa, si paga al campo (contanti o Satispay).`
  const invitePartner = () =>
    startTransition(async () => {
      const res = await createPairInvite(p.tournamentId)
      if (!res.ok) return void toast.error(res.error)
      setToken(res.token)
    })
  const sharePartner = (note: string) => (
    <div className="flex flex-col gap-2 rounded-2xl bg-[var(--surface-1)] p-3">
      <p className="text-base text-white">Manda il link al compagno. {note}</p>
      <button
        type="button"
        onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Entriamo in coppia a "${p.tournamentName}"? È pieno, ci mettiamo in lista insieme: ${link()}`)}`, "_blank", "noopener,noreferrer")}
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
    </div>
  )

  if (p.registered) {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-start gap-3 rounded-2xl bg-[var(--surface-2)] p-4">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--live)]" aria-hidden="true" />
          <p className="text-base text-white">
            Sei iscritto.{" "}
            {p.price
              ? p.paid
                ? "Quota pagata."
                : p.paymentClaimed
                  ? "Hai segnalato il pagamento: il club lo conferma appena lo vede."
                  : p.paymentUrl
                    ? `Quota ${p.price}: pagala ora online, oppure al campo.`
                    : `Ricordati la quota: ${p.price}, al campo.`
              : ""}
          </p>
        </div>
        {p.price && !p.paid && p.paymentUrl && p.registrationId && !p.paymentClaimed && (
          <>
            <a href={p.paymentUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full gap-2">
              <CreditCard className="h-5 w-5" aria-hidden="true" /> Paga ora la quota ({p.price})
            </a>
            <button
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const res = await claimLinkPayment(p.registrationId!)
                  if (!res.ok) return void toast.error(res.error)
                  toast.success("Grazie! Il club conferma il pagamento appena lo vede")
                  router.refresh()
                })
              }
              className="btn btn-secondary w-full gap-2"
            >
              {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
              Ho pagato
            </button>
            <p className="text-center text-sm text-[var(--muted-text)]">
              Paghi direttamente al club{p.paymentProvider ? ` su ${p.paymentProvider}` : ""}: SANDER non tocca i soldi. Poi torna qui e tocca «Ho pagato».
            </p>
          </>
        )}
        {p.price && !p.paid && p.paymentClaimed && (
          <p className="flex items-center justify-center gap-2 text-sm text-[var(--muted-text)]">
            <Hourglass className="h-4 w-4" aria-hidden="true" /> Pagamento in attesa di conferma
          </p>
        )}
        {p.registrationId && (
          <Link href={`/tournaments/${p.tournamentId}/checkin/${p.registrationId}`} className="btn btn-secondary w-full gap-2">
            <QrCode className="h-5 w-5" aria-hidden="true" /> Il tuo QR per il check-in
          </Link>
        )}
      </div>
    )
  }
  if (!p.open) return null
  if (p.full && p.isAuthed) {
    const waitlist = (join: boolean) =>
      startTransition(async () => {
        const res = join ? await joinWaitlist(p.tournamentId) : await leaveWaitlist(p.tournamentId)
        if (!res.ok) return void toast.error(res.error)
        toast.success(join ? "Sei in lista d'attesa" : "Sei uscito dalla lista d'attesa")
        router.refresh()
      })
    if (p.waitlistPosition) {
      return (
        <div className="flex flex-col gap-2 rounded-2xl bg-[var(--surface-2)] p-4">
          <p className="flex items-center gap-2 text-base font-bold text-white">
            <Clock className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            {p.waitlistPartner ? `Siete ${p.waitlistPosition}° in lista d'attesa` : `Sei ${p.waitlistPosition}° in lista d'attesa`}
          </p>
          <p className="text-base text-[var(--muted-text)]">
            {p.waitlistPartner
              ? `In coppia con ${p.waitlistPartner}: entrate insieme appena si liberano due posti, e vi arriva una notifica.`
              : "Se si libera un posto entri da solo e ti arriva una notifica."}{" "}
            {payNote}
          </p>
          {p.pairFormat && !p.waitlistPartner && !token && (
            <button type="button" disabled={pending} onClick={invitePartner} className="btn btn-secondary w-full gap-2">
              <UserPlus className="h-5 w-5" aria-hidden="true" /> Aggiungi un compagno in lista
            </button>
          )}
          {token && sharePartner("Quando accetta siete in lista insieme, al tuo posto.")}
          <button type="button" disabled={pending} onClick={() => waitlist(false)} className="flex min-h-[3.5rem] items-center justify-center text-base font-bold text-[var(--muted-text)]">
            Esci dalla lista
          </button>
        </div>
      )
    }
    return (
      <div className="flex flex-col gap-2">
        <p className="text-center text-base font-bold text-white">Torneo al completo</p>
        <button type="button" disabled={pending} onClick={() => waitlist(true)} className="btn btn-primary w-full gap-2">
          {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Clock className="h-5 w-5" aria-hidden="true" />}
          {p.pairFormat ? "Mettimi in lista da solo" : "Mettimi in lista d'attesa"}
        </button>
        {p.pairFormat && !token && (
          <button type="button" disabled={pending} onClick={invitePartner} className="btn btn-secondary w-full gap-2">
            <UserPlus className="h-5 w-5" aria-hidden="true" /> In lista in coppia
          </button>
        )}
        {token && sharePartner("Quando accetta siete in lista d'attesa insieme.")}
        <p className="text-center text-sm text-[var(--muted-text)]">Se qualcuno si ritira entri tu, in ordine di arrivo. Una coppia entra quando si liberano due posti.</p>
      </div>
    )
  }
  if (!p.isAuthed) {
    return (
      <Link href={`/auth/signin?callbackUrl=/tournaments/${p.tournamentId}&mode=register`} className="btn btn-primary w-full">
        Accedi per iscriverti
      </Link>
    )
  }

  const registerAlone = () =>
    startTransition(async () => {
      const res = await registerForTournament({ tournamentId: p.tournamentId })
      if (!res.ok) return void toast.error(res.error)
      toast.success("Sei iscritto!")
      router.refresh()
    })

  if (!p.pairFormat) {
    return (
      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={registerAlone}
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
        <button type="button" disabled={pending} onClick={registerAlone} className="btn btn-secondary w-full">
          Non ho un compagno: iscrivimi da solo
        </button>
        <p className="text-center text-sm text-[var(--muted-text)]">Le coppie di chi si iscrive da solo le forma il club.</p>
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
