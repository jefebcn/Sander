import type { Metadata } from "next"
import Link from "next/link"
import { ChevronLeft, Trash2, Mail } from "lucide-react"
import { getCurrentSession } from "@/lib/getCurrentPlayer"
import { DeleteMyAccountForm } from "@/components/profile/DeleteMyAccountForm"

export const metadata: Metadata = { title: "Elimina Account — SANDER" }

export default async function DeleteAccountPage() {
  const signedIn = !!(await getCurrentSession())?.user?.id
  return (
    <div className="pb-12">
      <header className="flex items-center gap-3 px-4 py-5">
        <Link
          href="/"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--muted-text)]"
          aria-label="Indietro"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-hand text-[1.9rem] text-white">Elimina Account</h1>
          <p className="text-xs text-[var(--muted-text)]">Richiesta cancellazione dati</p>
        </div>
      </header>

      <div className="px-4 space-y-5 text-sm text-white/80 leading-relaxed">

        {/* Warning box */}
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Trash2 className="h-4 w-4 text-red-400 shrink-0" />
            <p className="font-bold text-red-400">Attenzione — operazione irreversibile</p>
          </div>
          <p className="text-white/70">
            L&apos;eliminazione dell&apos;account comporta la cancellazione permanente di tutti i
            tuoi dati personali dalla piattaforma SANDER.
          </p>
        </div>

        {/* What gets deleted */}
        <div className="rounded-2xl bg-[var(--surface-2)] p-4 space-y-3">
          <p className="font-black text-white">Cosa viene eliminato</p>
          <ul className="space-y-1.5 text-white/70">
            <li>✓ Profilo utente (nome, email, foto, data di nascita)</li>
            <li>✓ Accesso all&apos;account e notifiche</li>
            <li>✓ Statistiche, punti, livello XP e badge</li>
            <li>✓ SanderCredits residui</li>
            <li>✓ Partite in programma che organizzi (annullate, con rimborso agli iscritti)</li>
            <li>✓ Profilo Scopri: foto, risposte, preferenze, like, match e coppie</li>
            <li>✓ Foto, selfie di verifica e video caricati, cancellati anche dall&apos;archivio</li>
            <li>✓ Testo dei messaggi che hai scritto, uscita da gruppi e chat delle partite</li>
            <li>✓ Voti &quot;rigiocheresti&quot; dati e ricevuti e storico presenze</li>
            <li>✓ Abbonamento SANDER+, disdetto su Stripe prima dell&apos;eliminazione</li>
          </ul>
        </div>

        {/* What is kept */}
        <div className="rounded-2xl bg-[var(--surface-2)] p-4 space-y-3">
          <p className="font-black text-white">Cosa viene conservato</p>
          <ul className="space-y-1.5 text-white/70">
            <li>⚠ Dati aggregati anonimi (statistiche globali piattaforma)</li>
            <li>⚠ Risultati di partite e tornei già giocati, senza il tuo nome (&quot;Giocatore eliminato&quot;), per non alterare lo storico degli altri giocatori</li>
            <li>⚠ Dati richiesti da obblighi di legge (fino a 10 anni)</li>
          </ul>
        </div>

        {/* Retention period */}
        <div className="rounded-2xl bg-[var(--surface-2)] p-4">
          <p className="font-black text-white mb-1">Tempi di eliminazione</p>
          <p className="text-white/70">
            Dall&apos;app l&apos;eliminazione è <strong className="text-white">immediata</strong>. Con la richiesta via email
            i dati vengono eliminati entro <strong className="text-white">30 giorni</strong>.
          </p>
        </div>

        {signedIn && <DeleteMyAccountForm />}

        {/* How to request */}
        <div className="rounded-2xl bg-[var(--surface-2)] p-4 space-y-3">
          <p className="font-black text-white">{signedIn ? "Oppure via email" : "Come richiedere l\u2019eliminazione"}</p>
          <p className="text-white/70">
            Invia una email a{" "}
            <a
              href="mailto:conti9708@gmail.com?subject=Richiesta eliminazione account SANDER&body=Ciao, richiedo l'eliminazione del mio account SANDER e di tutti i dati associati.%0A%0AEmail account: [la tua email]%0A%0AGrazie"
              className="font-bold text-[var(--accent)] underline"
            >
              conti9708@gmail.com
            </a>{" "}
            con oggetto <strong className="text-white">«Richiesta eliminazione account SANDER»</strong>,
            indicando l&apos;email associata al tuo account.
          </p>
          <a
            href="mailto:conti9708@gmail.com?subject=Richiesta eliminazione account SANDER&body=Ciao, richiedo l'eliminazione del mio account SANDER e di tutti i dati associati.%0A%0AEmail account: [la tua email]%0A%0AGrazie"
            className="flex items-center justify-center gap-2 min-h-[3.5rem] w-full rounded-full font-bold text-black transition-opacity active:opacity-80"
            style={{ background: "var(--accent)" }}
          >
            <Mail className="h-4 w-4" />
            Invia richiesta via email
          </a>
        </div>

        <p className="text-xs text-[var(--muted-text)] text-center pb-4">
          Per ulteriori informazioni consulta la{" "}
          <Link href="/privacy" className="text-[var(--accent)] underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  )
}
