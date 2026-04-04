export const dynamic = "force-dynamic"

import Link from "next/link"
import { ChevronLeft, AlertTriangle } from "lucide-react"

const ERROR_MESSAGES: Record<string, string> = {
  Configuration:
    "Errore di configurazione del server. Contatta l'amministratore.",
  AccessDenied: "Accesso negato. Hai annullato il login o non hai i permessi.",
  Verification: "Il link di verifica è scaduto o non è valido.",
  OAuthSignin:
    "Errore durante il reindirizzamento a Google. Riprova tra qualche secondo.",
  OAuthCallback:
    "Errore durante il ritorno da Google. Controlla la connessione e riprova.",
  OAuthCreateAccount:
    "Impossibile creare l'account con Google. L'email potrebbe essere già in uso.",
  EmailCreateAccount: "Impossibile creare l'account con questa email.",
  Callback: "Errore imprevisto durante il login. Riprova.",
  OAuthAccountNotLinked:
    "Questa email è già registrata con password. Accedi con email e password, poi collega Google dal profilo.",
  Default: "Si è verificato un errore durante il login. Riprova.",
}

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const message =
    (error && ERROR_MESSAGES[error]) ?? ERROR_MESSAGES.Default

  return (
    <div className="relative flex min-h-dvh flex-col bg-[#0a0a0a] px-6 pb-10">
      {/* Glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 35% at 50% 0%, rgba(255,60,60,0.05) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />

      {/* Back */}
      <div className="relative z-10 flex items-center pt-14">
        <Link
          href="/auth/signin"
          aria-label="Indietro"
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--muted-text)] transition-colors active:bg-[var(--surface-3)]"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>

      <div className="relative z-10 mt-16 flex flex-col items-center gap-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--danger)]/15">
          <AlertTriangle className="h-8 w-8 text-[var(--danger)]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white">Errore di accesso</h1>
          <p className="text-sm text-[var(--muted-text)]">{message}</p>
          {error && (
            <p className="text-xs text-[var(--muted-text)]/50">
              Codice: {error}
            </p>
          )}
        </div>

        <Link
          href="/auth/signin"
          className="flex min-h-[3.5rem] w-full max-w-xs items-center justify-center rounded-2xl bg-[var(--accent)] font-bold text-black transition-all active:scale-[0.98]"
        >
          Riprova
        </Link>
      </div>
    </div>
  )
}
