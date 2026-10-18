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

- inchiostro `#0d0c12` per lo sfondo;
- corallo `#ff6b4a`, l'azione principale;
- acqua `#49d9c9` per match e coppie;
- sole `#ffc247` per classifiche e Ace;
- `--love` `#ff4f7b` per il momento del match;
- il lime del logo resta in `--lime`.

I font sono tre:

- **Bricolage Grotesque** (titoli e numeri, leggermente condensato con l'asse
  `wdth`);
- **Figtree** (testo);
- **Instrument Serif** (risposte ai prompt e frasi da leggere come parole
  dette).
