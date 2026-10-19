# Scopri — trovare con chi giocare

Scopri porta in SANDER le meccaniche delle app di incontri "fatte per essere
cancellate" (modello Hinge), rivolte al beach volley: trovare un compagno o una
coppia, fare match e scendere in campo.

## Da dove viene

Le meccaniche sono state ricavate con REA (`inspect_web_page` via Chrome DevTools)
dalle pagine pubbliche di hinge.co: `/mission`, `/how-we-connect-daters` e
`/trustandsafety`. L'app di Hinge non è stata decompilata: i suoi termini lo
vietano, e le meccaniche sono già descritte pubblicamente. Non è stato copiato
né codice né design: solo le idee, adattate al beach volley.

| Hinge (pubblico) | SANDER |
|---|---|
| Profilo con foto e 3 prompt obbligatori | Profilo Scopri: 1–6 foto, 3 risposte a domande di beach volley (`lib/scopri/prompts.ts`) |
| Like su una foto o un prompt specifico, con commento | Cuore su ogni foto e risposta; il commento diventa il primo messaggio della chat |
| 8 like gratis al giorno | `FREE_LIKES_PER_DAY = 8` (giorno di Roma); extra con gli SC |
| Rose (1 a settimana, "in evidenza") | **Ace**: 1 gratis a settimana, in cima a "Ti vogliono"; extra con gli SC |
| Likes You, niente like anonimi | **Ti vogliono**: uno alla volta; "Vedi tutti" per 24 ore con gli SC |
| Most Compatible (Gale–Shapley) | **Il più compatibile di oggi**: abbinamento stabile del pool, muro ↔ difesa |
| Your Turn: avviso quando tocca a te | **Match**: "Tocca a te / Nuovi / In attesa"; con 5 match in sospeso Scopri chiede di rispondere |
| Dealbreakers reciproci | **Non negoziabili**: comuni, con chi, ruolo, differenza di livello, applicati nei due sensi |
| We Met: "vi siete visti?" | "Avete giocato insieme?" dopo due giorni dal match |
| Segnalazione anonima, non vi vedete più | Segnala o blocca (anche "Annulla match"): spariscono deck, like e chat privata |
| Abbonamenti | Extra a SC (nessun abbonamento): +5 like 15 SC, +1 Ace 25 SC, Vedi tutti 30 SC |

In più, solo SANDER:

- **Coppie 2v2**: due giocatori formano una coppia e sfidano altre coppie. Quando
  una sfida è reciproca si apre la chat a quattro e la partita va in calendario
  completa, una coppia per lato.
- **Dal match alla sabbia**: "Crea la partita insieme" mette i due in coppia in
  una partita 2v2 con due posti liberi; SANDER avvisa chi gioca vicino.
- **Partite di gruppo** nel mazzo: tra un giocatore e l'altro compaiono le
  partite aperte del tuo comune a cui mancano giocatori.

## Regole

- **Età e accesso**: solo maggiorenni. Serve la data di nascita, ma gli altri
  vedono solo l'età. Senza data di nascita non si entra nel pool.
- **Profilo completo**: almeno 1 foto (vale anche la foto profilo), 3 risposte
  e il comune.
- **Pausa**: chi è in pausa non è visibile e non può mandare like; match e chat
  restano.
- **Skip**: chi passi torna dopo 30 giorni; un like resta per sempre.
- **Compatibilità** (`lib/scopri/score.ts`): livello 35, muro + difesa 20,
  stesso comune 15, orari liberi in comune 15, stesso obiettivo 10, lati
  compatibili 5. Il totale è scalato se il rating non ha ancora partite alle
  spalle.
- **Il più compatibile** (`lib/scopri/stableMatch.ts`): muri e difese sono i
  due lati di Gale–Shapley, e chi propone si alterna ogni giorno. Chi resta
  senza coppia viene abbinato con il miglior punteggio reciproco. Le scelte sono
  simmetriche e salvate in `DailyPick`, una per giorno.

## Affidabilità, "Libero oggi", ingresso

- **Affidabilità** (`lib/scopri/reliability.ts`):
  - Le presenze sono le partite completate (`Player.sessionsPlayed`).
  - Le assenze sono le uscite da una partita a meno di 3 ore dall'inizio, salvate in `AttendanceEvent`. Prima del secondo tocco su "Lascia partita" l'utente viene avvisato.
  - **Verificato** vuol dire almeno 3 partite e almeno l'80% di presenze; la carta mostra il badge e la percentuale.
  - Nell'ordine del mazzo pesano anche le presenze e il badge. L'affinità mostrata resta la stessa.
- **Libero oggi**:
  - Si sceglie la fascia: mattina, pomeriggio, sera o tutto il giorno. Vale fino a mezzanotte.
  - Nel mazzo si passa avanti di 12 punti, o di 25 se anche chi guarda è libero nella stessa fascia.
  - I propri match vengono avvisati una volta al giorno.
  - Il colore è il lime del logo.
- **Ingresso**:
  - Dopo il profilo base, il nuovo iscritto vede un passo facoltativo di un minuto (`/onboarding/scopri`), già precompilato con la foto profilo e tre domande suggerite.
  - I minorenni saltano il passo.
- **Richiami** (`lib/scopri/digest.ts`, eseguiti dal cron del mattino):
  - Chi è già su Scopri riceve "N nuovi giocatori a {comune}", al massimo una volta al giorno.
  - Chi non c'è ancora riceve "{N} giocatori di {comune} sono su Scopri", al massimo una volta a settimana e solo se nel comune ce ne sono almeno 3.
  - Il richiamo non arriva a chi ha disattivato gli avvisi né ai minorenni.
  - Massimo 400 notifiche per esecuzione.

## Dopo la partita, coppie, sicurezza, SANDER+

- **Rigiocheresti?**
  - Dopo una partita completata (entro 7 giorni) la home e la pagina della partita chiedono, per ogni persona che c'era, sì o no (`PlayAgainVote`).
  - La percentuale di sì compare sulla carta quando ci sono almeno 3 voti e pesa nell'ordine del mazzo.
  - Un no, in un senso o nell'altro, tiene separate le due persone su Scopri e nel più compatibile.
  - Quando 3 persone diverse dicono no nello stesso mese, gli admin ricevono un avviso.
- **Notifiche del mattino** (cron `content`, per non superare il limite di cron di Vercel):
  - il più compatibile di oggi, calcolato ora nel cron;
  - "tocca a te", se l'altro ha scritto più di 24 ore fa, una volta per messaggio;
  - una sola volta, la sfida di coppia rimasta senza risposta;
  - i richiami di ingresso.
- **Coppie**:
  - Il punteggio di coppia è un Elo (K 32) che si muove quando si chiude con i set un 2v2 tra due coppie in match.
  - La classifica sta in `/scopri/coppie`.
  - "Iscrivi la coppia" funziona nei tornei a coppie fisse (BRACKETS, ROUND_ROBIN, DOUBLE_ELIMINATION, CHICECE): i due vengono messi vicini nel seeding.
- **Sicurezza**:
  - Si può segnalare anche dal mazzo, con il motivo "Foto non adatta".
  - `/admin/segnalazioni` raccoglie in un posto solo:
    - le segnalazioni aperte (sospendi, archivia);
    - le foto da controllare, prima quelle segnalate (rimuovi, va bene);
    - le persone con molti "non rigiocherei";
    - i profili sospesi (riattiva).
  - Chi è sospeso esce dal pool e non può mandare like.
  - L'organizzatore può segnare "Non si è presentato" tra l'inizio e le 48 ore successive: conta come assenza.
  - La data di nascita si inserisce una volta sola e poi non si può più cambiare.
- **SANDER+** (`/scopri/plus`):
  - Abbonamento Stripe a €4,99 al mese, con like illimitati, "vedi tutti" sempre attivo, 3 Ace a settimana e i filtri "solo verificati" e "solo liberi oggi".
  - Il webhook gestisce `checkout.session.completed`, `customer.subscription.*` e `invoice.paid`.
  - Se la scadenza è passata, la si ricontrolla su Stripe.
  - La disdetta vale a fine mese.

## Dove sta il codice

- `prisma/schema.prisma`: modelli `PlayerPhoto`, `PlayerPrompt`,
  `DiscoverProfile`, `PlayerSwipe`, `PlayerMatch`, `DailyPick`, `PlayerBlock`,
  `CreditSpend`, `Duo`, `DuoSwipe`, `DuoMatch`. Sono solo aggiunte.
- `src/lib/scopri/`: logica pura testata (`rules`, `score`, `stableMatch`) e
  helper server (`server`, `duos`, `blocks`, `games`).
- `src/actions/scopri.ts` e `src/actions/coppie.ts`: ogni action valida con Zod
  e agisce solo per il giocatore autenticato.
- `src/app/scopri/*`: le pagine Scopri, Ti vogliono, Match, Coppie e Profilo.
  `src/app/api/scopri/photo` gestisce l'upload delle foto.
- `src/app/admin/segnalazioni`: le segnalazioni, visibili agli admin.

## Stile

La palette si chiama "Riviera di notte" ed è sempre scura:

- grafite `#0b0b0c` come il fondo del logo;
- giallo-verde `#c6f736` del logo per l'azione principale, il like e i momenti "live";
- acqua `#49d9c9` per match e coppie;
- sole `#ffc247` per classifiche e Ace;
- `--love` `#ff4f7b` per il momento del match.

I font sono tre:

- **Bricolage Grotesque** (titoli e numeri, leggermente condensato con l'asse
  `wdth`);
- **Figtree** (testo);
- **Instrument Serif** (risposte ai prompt e frasi da leggere come parole
  dette).
