import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { LEGAL_EMAIL } from "@/lib/legal"

export const metadata = { title: "Termini di servizio — SANDER" }

const LAST_UPDATED = "19 ottobre 2026"

export default function TermsPage() {
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
          <h1 className="font-hand text-[1.9rem] text-white">Termini di servizio</h1>
          <p className="text-xs text-[var(--muted-text)]">Aggiornato il {LAST_UPDATED}</p>
        </div>
      </header>

      <div className="px-4 space-y-6 text-sm text-white/80 leading-relaxed">

        <Section title="1. Accettazione dei termini">
          <p>
            Utilizzando SANDER ("Servizio", "App", "Piattaforma") accetti integralmente i presenti Termini di Servizio.
            Se non accetti questi termini, non puoi utilizzare il Servizio.
            SANDER si riserva il diritto di modificare i presenti termini in qualsiasi momento;
            l&apos;uso continuato della piattaforma dopo eventuali modifiche costituisce accettazione delle stesse.
          </p>
        </Section>

        <Section title="2. Descrizione del servizio">
          <p>
            SANDER è una piattaforma digitale dedicata alla gestione di sessioni e tornei di beach volleyball.
            Permette agli utenti di:
          </p>
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>Creare e partecipare a sessioni di gioco</li>
            <li>Organizzare e iscriversi a tornei</li>
            <li>Visualizzare statistiche personali e ranking</li>
            <li>Interagire con altri giocatori tramite il feed e il sistema di valutazione</li>
          </ul>
        </Section>

        <Section title="3. Registrazione e account">
          <p>
            Per accedere al Servizio è necessario creare un account fornendo un indirizzo email valido
            o autenticandosi tramite Google. Sei responsabile della riservatezza delle tue credenziali
            di accesso e di tutte le attività svolte tramite il tuo account.
          </p>
          <p className="mt-2">
            L&apos;account è personale e non cedibile. Devi avere almeno 16 anni per registrarti.
            SANDER si riserva il diritto di sospendere o chiudere account che violino i presenti termini.
          </p>
        </Section>

        <Section title="4. Condotta dell'utente">
          <p>Utilizzando SANDER ti impegni a:</p>
          <ul className="mt-2 ml-4 list-disc space-y-1">
            <li>Fornire informazioni accurate e aggiornate nel tuo profilo</li>
            <li>Non pubblicare contenuti offensivi, discriminatori o illeciti</li>
            <li>Non tentare di accedere ai dati di altri utenti senza autorizzazione</li>
            <li>Rispettare gli altri giocatori con fair play dentro e fuori dal campo</li>
            <li>Non usare il sistema di valutazione in modo fraudolento o coordinato</li>
          </ul>
        </Section>

        <Section title="5. Sistema di ranking e valutazioni">
          <p>
            Il ranking Glicko-2 e il sistema di valutazione sono strumenti informativi e sportivi.
            SANDER non garantisce che i punteggi riflettano il reale livello di ogni giocatore.
            Manipolazioni intenzionali del sistema (es. partite simulate, voti coordinati) comportano
            la sospensione dell&apos;account.
          </p>
        </Section>

        <Section title="6. Pagamenti e commissioni">
          <p>
            Alcune sessioni possono richiedere il pagamento anticipato della quota campo tramite l&apos;app.
            In questi casi SANDER applica una commissione di gestione. L&apos;utilizzo del codice promo
            referral può ridurre o eliminare tale commissione secondo i termini del programma inviti
            vigente al momento della transazione.
          </p>
          <p className="mt-2">
            SANDER non è responsabile per rimborsi di quote già versate per sessioni cancellate
            da organizzatori terzi; in tale caso si applica la policy di rimborso specifica della sessione.
          </p>
        </Section>

        <Section title="6-bis. Scopri, coppie e sicurezza">
          <p>
            Scopri serve a trovare compagni e avversari per giocare. È riservato ai maggiorenni: la data di
            nascita, una volta inserita, non si può cambiare e dichiarare un&apos;età falsa comporta la
            sospensione. Le foto devono ritrarre te e rispettare la decenza; profili falsi, messaggi
            offensivi o molesti e l&apos;uso di Scopri per scopi diversi dal gioco non sono ammessi.
          </p>
          <p className="mt-2">
            Puoi bloccare o segnalare chiunque: la segnalazione è anonima. SANDER può rimuovere foto e
            sospendere profili Scopri che violano queste regole. Uscire da una partita nelle ultime ore o
            non presentarsi abbassa la tua affidabilità, visibile agli altri in percentuale.
          </p>
          <p className="mt-2">
            Ci si vede sempre in luoghi pubblici: i campi e i bagni. SANDER mette in contatto i giocatori ma
            non risponde del comportamento degli utenti fuori dall&apos;app.
          </p>
        </Section>

        <Section title="6-ter. SANDER+ ed extra con gli SC">
          <p>
            <strong className="text-white">SANDER+</strong> è un abbonamento mensile al prezzo indicato al momento
            dell&apos;attivazione, pagato tramite Stripe. Si rinnova automaticamente ogni mese finché non lo disdici.
            Puoi disdire in qualsiasi momento dalla pagina SANDER+: resta attivo fino alla fine del mese già
            pagato e non sono previsti rimborsi per periodi parziali. Eventuali variazioni di prezzo ti saranno
            comunicate prima del rinnovo successivo, con la possibilità di disdire.
          </p>
          <p className="mt-2">
            Attivando SANDER+ chiedi che il servizio inizi subito e prendi atto che, per il mese iniziato,
            perdi il diritto di recesso previsto per i contratti a distanza (art. 59 del Codice del Consumo),
            fermo restando il diritto di disdire i rinnovi successivi.
          </p>
          <p className="mt-2">
            Il <strong className="text-white">pass SANDER+ di 30 giorni</strong> si paga con carta, Apple Pay o
            Google Pay tramite SumUp: dà le stesse funzioni di SANDER+ per 30 giorni dall&apos;acquisto (o dalla
            scadenza del pass in corso) e <strong className="text-white">non si rinnova automaticamente</strong>.
            Anche per il pass chiedi che il servizio inizi subito e prendi atto che non è rimborsabile dopo
            l&apos;attivazione.
          </p>
          <p className="mt-2">
            Gli extra di Scopri acquistati con i SanderCredits (like, Ace, &quot;vedi tutti&quot;, pass SANDER+
            di 7 giorni) si usano subito e non sono rimborsabili. Il pass di 7 giorni non si rinnova e dà le
            stesse funzioni di SANDER+ fino alla scadenza indicata.
          </p>
        </Section>

        <Section title="7. Proprietà intellettuale">
          <p>
            Tutti i contenuti della piattaforma (logo, grafica, testi, codice) sono di proprietà di SANDER
            o dei rispettivi titolari di licenza. È vietata la riproduzione, distribuzione o modifica
            senza previo consenso scritto.
          </p>
          <p className="mt-2">
            Caricando foto o contenuti su SANDER, concedi alla piattaforma una licenza non esclusiva,
            gratuita e mondiale per visualizzarli all&apos;interno del servizio.
          </p>
        </Section>

        <Section title="8. Limitazione di responsabilità">
          <p>
            SANDER è fornita "così com&apos;è". Non garantiamo la disponibilità ininterrotta del servizio
            né l&apos;assenza di errori. SANDER non è responsabile per danni indiretti, perdita di dati
            o mancati guadagni derivanti dall&apos;uso o dall&apos;impossibilità di utilizzare la piattaforma.
          </p>
          <p className="mt-2">
            SANDER non organizza direttamente le sessioni sportive e non è responsabile per infortuni
            o danni fisici occorsi durante le attività sportive gestite tramite la piattaforma.
          </p>
        </Section>

        <Section title="9. Legge applicabile">
          <p>
            I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia è competente
            in via esclusiva il Foro di Milano, salvo diversa previsione di legge a tutela del consumatore.
          </p>
        </Section>

        <Section title="10. Contatti">
          <p>
            Per qualsiasi domanda relativa ai presenti Termini di Servizio puoi contattarci all&apos;indirizzo:{" "}
            <a href={`mailto:${LEGAL_EMAIL}`} className="text-[var(--accent)] underline">
              {LEGAL_EMAIL}
            </a>
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
