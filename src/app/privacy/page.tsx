import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { LEGAL_EMAIL } from "@/lib/legal"

export const metadata = { title: "Privacy Policy — SANDER" }

const LAST_UPDATED = "19 ottobre 2026"

export default function PrivacyPage() {
  return (
    <div className="pb-12">
      <header className="flex items-center gap-3 px-4 py-5">
        <Link
          href="/profile?tab=app"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--muted-text)]"
          aria-label="Indietro"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div>
          <h1 className="font-hand text-[1.9rem] text-white">Privacy Policy</h1>
          <p className="text-xs text-[var(--muted-text)]">Aggiornata il {LAST_UPDATED}</p>
        </div>
      </header>

      <div className="px-4 space-y-6 text-sm text-white/80 leading-relaxed">

        <Section title="1. Titolare del trattamento">
          <p>
            Il titolare del trattamento dei dati personali è <strong className="text-white">SANDER</strong>.
            Per qualsiasi richiesta relativa alla privacy puoi contattarci a{" "}
            <a href={`mailto:${LEGAL_EMAIL}`} className="text-[var(--accent)] underline">
              {LEGAL_EMAIL}
            </a>
          </p>
        </Section>

        <Section title="2. Dati raccolti">
          <p>Raccogliamo i seguenti dati personali:</p>
          <ul className="mt-2 ml-4 list-disc space-y-1.5">
            <li>
              <strong className="text-white">Dati di registrazione:</strong> indirizzo email, nome,
              immagine del profilo (da Google OAuth o caricata direttamente)
            </li>
            <li>
              <strong className="text-white">Dati di attività:</strong> sessioni a cui partecipi od organizzi,
              risultati delle partite, valutazioni ricevute e assegnate, tornei
            </li>
            <li>
              <strong className="text-white">Dati di performance:</strong> statistiche di gioco,
              rating Glicko-2, livello XP, badge ricevuti
            </li>
            <li>
              <strong className="text-white">Dati tecnici:</strong> indirizzo IP, tipo di browser/dispositivo,
              dati di sessione, cookie tecnici necessari al funzionamento
            </li>
            <li>
              <strong className="text-white">Profilo Scopri (se lo crei):</strong> fino a 6 foto, le tue risposte,
              data di nascita (agli altri mostriamo solo l&apos;età), comune, ruolo, lato, cosa cerchi, disponibilità,
              &quot;Libero oggi&quot; e le tue preferenze. Il genere è facoltativo, resta privato e serve solo a
              rispettare le preferenze tue e degli altri.
            </li>
            <li>
              <strong className="text-white">Attività su Scopri:</strong> like e commenti inviati e ricevuti,
              giocatori saltati, match, coppie e sfide, chat, voti &quot;rigiocheresti&quot; dati e ricevuti,
              presenze e assenze alle partite (uscite all&apos;ultimo momento, mancate presenze segnate
              dall&apos;organizzatore).
            </li>
            <li>
              <strong className="text-white">Segnalazioni e blocchi:</strong> chi blocchi o segnali, il motivo e
              l&apos;eventuale nota. Le segnalazioni sono anonime per chi viene segnalato.
            </li>
            <li>
              <strong className="text-white">Pagamenti:</strong> per i pacchetti di SanderCredits e per
              l&apos;abbonamento SANDER+ conserviamo importi, date e gli identificativi di cliente e abbonamento
              di Stripe. I dati della carta li gestisce solo Stripe: non passano mai da noi.
            </li>
          </ul>
          <p className="mt-2">
            Non raccogliamo dati sensibili (salute, etnia, opinioni politiche, ecc.)
            né dati di minori di 16 anni. Scopri è riservato ai maggiorenni.
          </p>
        </Section>

        <Section title="3. Finalità e basi giuridiche del trattamento">
          <p>Trattiamo i tuoi dati per le seguenti finalità:</p>
          <div className="mt-2 space-y-3">
            <Row
              label="Gestione dell'account e autenticazione"
              basis="Esecuzione del contratto (art. 6.1.b GDPR)"
            />
            <Row
              label="Funzionamento della piattaforma (sessioni, tornei, ranking)"
              basis="Esecuzione del contratto (art. 6.1.b GDPR)"
            />
            <Row
              label="Cookie tecnici necessari"
              basis="Legittimo interesse (art. 6.1.f GDPR)"
            />
            <Row
              label="Comunicazioni di servizio (notifiche app, email transazionali)"
              basis="Esecuzione del contratto (art. 6.1.b GDPR)"
            />
            <Row
              label="Miglioramento del servizio e analisi aggregate"
              basis="Legittimo interesse (art. 6.1.f GDPR)"
            />
            <Row
              label="Comunicazioni di marketing (newsletter, offerte)"
              basis="Consenso (art. 6.1.a GDPR) — puoi revocare in qualsiasi momento"
            />
            <Row
              label="Scopri: proporti giocatori e coppie compatibili, il più compatibile del giorno, i promemoria"
              basis="Esecuzione del contratto (art. 6.1.b GDPR), solo se crei il profilo Scopri"
            />
            <Row
              label="Affidabilità e voti &quot;rigiocheresti&quot; mostrati in forma aggregata (percentuali)"
              basis="Legittimo interesse a una community affidabile (art. 6.1.f GDPR)"
            />
            <Row
              label="Sicurezza: segnalazioni, blocchi, moderazione delle foto, sospensioni, verifica della maggiore età dichiarata"
              basis="Legittimo interesse alla sicurezza degli utenti (art. 6.1.f GDPR)"
            />
            <Row
              label="Pagamenti, abbonamento SANDER+ e obblighi fiscali"
              basis="Esecuzione del contratto e obbligo di legge (art. 6.1.b e 6.1.c GDPR)"
            />
          </div>
          <p className="mt-3">
            <strong className="text-white">Come funziona l&apos;ordine su Scopri.</strong> L&apos;ordine in cui vedi
            i giocatori è calcolato in automatico da livello, ruolo, comune, orari liberi, obiettivi, presenze,
            voti &quot;rigiocheresti&quot; e &quot;Libero oggi&quot;. Non produce effetti giuridici e non decide
            nulla al posto tuo: puoi metterti in pausa o eliminare il profilo Scopri in qualsiasi momento.
          </p>
        </Section>

        <Section title="4. Cookie">
          <p>
            Utilizziamo esclusivamente cookie tecnici necessari al funzionamento del sito (autenticazione,
            sessione utente, preferenze UI). Non utilizziamo cookie di profilazione o di terze parti
            a fini pubblicitari senza il tuo consenso esplicito.
          </p>
          <p className="mt-2">
            Al primo accesso ti verrà mostrato un banner per accettare o rifiutare i cookie non necessari.
            Puoi modificare le tue preferenze in qualsiasi momento dalle impostazioni del browser.
          </p>
        </Section>

        <Section title="5. Condivisione dei dati">
          <p>Non vendiamo i tuoi dati personali. Li condividiamo esclusivamente con:</p>
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>
              <strong className="text-white">Neon (database cloud):</strong> hosting del database PostgreSQL
              in cui sono archiviati i dati della piattaforma
            </li>
            <li>
              <strong className="text-white">Google (OAuth):</strong> se scegli di accedere con Google,
              riceviamo nome, email e foto profilo dal tuo account Google
            </li>
            <li>
              <strong className="text-white">Vercel:</strong> hosting dell&apos;applicazione web e
              archiviazione delle foto (Vercel Blob)
            </li>
            <li>
              <strong className="text-white">Stripe:</strong> pagamenti dei SanderCredits e
              dell&apos;abbonamento SANDER+
            </li>
            <li>
              <strong className="text-white">Autorità competenti:</strong> esclusivamente in caso di
              obbligo di legge o ordine dell&apos;autorità giudiziaria
            </li>
          </ul>
          <p className="mt-2">
            Tutti i nostri fornitori sono conformi al GDPR e operano in qualità di responsabili
            del trattamento ai sensi dell&apos;art. 28 GDPR.
          </p>
        </Section>

        <Section title="6. Conservazione dei dati">
          <p>
            I tuoi dati vengono conservati per tutta la durata del tuo account attivo.
            In caso di cancellazione dell&apos;account, i dati personali vengono eliminati entro 30 giorni,
            ad eccezione dei dati richiesti dalla normativa fiscale o da altri obblighi di legge
            (conservati fino a 10 anni).
          </p>
          <p className="mt-2">
            I dati aggregati e anonimizzati (statistiche aggregate sulla piattaforma) possono essere
            conservati a tempo indeterminato.
          </p>
          <p className="mt-2">
            Il profilo Scopri, le foto, i like, i voti e lo storico presenze vengono eliminati insieme
            all&apos;account; l&apos;eventuale abbonamento SANDER+ viene disdetto prima. Le segnalazioni
            ricevute da altri utenti possono essere conservate per il tempo necessario a tutelare la
            sicurezza della community.
          </p>
        </Section>

        <Section title="7. I tuoi diritti (GDPR)">
          <p>Ai sensi del Regolamento UE 2016/679 (GDPR) hai diritto a:</p>
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li><strong className="text-white">Accesso</strong> — ottenere copia dei dati che trattiamo su di te</li>
            <li><strong className="text-white">Rettifica</strong> — correggere dati inesatti o incompleti</li>
            <li><strong className="text-white">Cancellazione</strong> — richiedere l&apos;eliminazione dei tuoi dati ("diritto all&apos;oblio")</li>
            <li><strong className="text-white">Portabilità</strong> — ricevere i tuoi dati in formato strutturato e leggibile</li>
            <li><strong className="text-white">Opposizione</strong> — opporti al trattamento per legittimo interesse</li>
            <li><strong className="text-white">Limitazione</strong> — richiedere la limitazione del trattamento in determinati casi</li>
            <li><strong className="text-white">Revoca del consenso</strong> — in qualsiasi momento per il trattamento basato su consenso</li>
          </ul>
          <p className="mt-2">
            Per esercitare i tuoi diritti scrivi a{" "}
            <a href={`mailto:${LEGAL_EMAIL}`} className="text-[var(--accent)] underline">
              {LEGAL_EMAIL}
            </a>
            . Risponderemo entro 30 giorni. Hai inoltre il diritto di presentare reclamo al Garante
            per la Protezione dei Dati Personali (
            <a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer"
               className="text-[var(--accent)] underline">
              garanteprivacy.it
            </a>
            ).
          </p>
        </Section>

        <Section title="8. Sicurezza">
          <p>
            Adottiamo misure tecniche e organizzative adeguate per proteggere i tuoi dati da accessi
            non autorizzati, perdita o divulgazione: connessioni cifrate (HTTPS/TLS), autenticazione
            sicura, accessi al database limitati e monitorati.
          </p>
        </Section>

        <Section title="9. Modifiche alla Privacy Policy">
          <p>
            Ci riserviamo il diritto di aggiornare questa Privacy Policy. In caso di modifiche sostanziali
            ti invieremo una notifica via email o tramite l&apos;app. La data di ultimo aggiornamento
            è indicata in cima alla pagina.
          </p>
        </Section>

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-black text-white mb-2">{title}</h2>
      {children}
    </div>
  )
}

function Row({ label, basis }: { label: string; basis: string }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] px-3 py-2.5">
      <p className="text-white/90 font-medium">{label}</p>
      <p className="text-xs text-[var(--muted-text)] mt-0.5">{basis}</p>
    </div>
  )
}
