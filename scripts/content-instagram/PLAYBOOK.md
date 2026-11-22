# PLAYBOOK — Instagram @sanderbeachvolley

Kit che legge i dati veri di SANDER, disegna post e storie con le schermate dell'app in un mockup di telefono e li programma su Buffer. Metodo FantaTitano, adattato a SANDER.

## Contenuto del kit
| File | Cosa fa |
|---|---|
| `run.sh A\|B [lunedì]` | dati → piano → grafiche in `work/` |
| `plan.mjs` | calendario settimanale e rotazioni (per settimana ISO) |
| `render.mjs` | sceglie il formato di ogni slot e scrive le didascalie; storie 1080×1920 |
| `formats.mjs` | i formati dei post del 17/11/2026 (1080×1350): gancio, chat, gioco, notifiche, flag, carta, citazione, Frase da rete, FIPAV numero, più le slide app, lista e chiusura |
| `content.mjs` | funzioni dell'app, titoli e didascalie a rotazione |
| `publish.mjs` | Buffer: doppioni, orari passati, coda max 10, controllo storie |
| `refill.sh` | controllo giornaliero: se Buffer ha almeno 4 posti liberi, dice quali finestre (A/B) riempire |
| `history.mjs` | tutto quello che è già su Buffer (uscito o in coda), in `work/history.json` |
| `fresh.mjs` | mai niente di uguale: sceglie solo varianti non ancora usate |
| `fipav/` | lettore del calendario FIPAV (`fipav.mjs`, `cli.mjs`) e `feed.mjs`, che lo aggiunge ai dati del giro |
| `screens/` | schermate vere dell'app (dati di prova, nessuna persona reale) |
| `fonts/`, `assets/` | font di SANDER (Bricolage Grotesque, Figtree, Gochi Hand; Inter per le storie), icona dell'app, `assets/faces/` (facce di prova dell'app, mai persone vere) |

## Fonte dati
`https://www.sanderbv.it/api/social/feed`: pubblico, in sola lettura, niente dati personali.
- `tournaments`: tornei SANDER delle prossime 4 settimane.
- `openMatches`: partite aperte dei prossimi 4 giorni.
- `fipav`: calendario FIPAV senza nomi di atleti, senza tornei giovanili. Nel feed dell'app oggi è vuoto: FIPAV blocca i server di Vercel finché non autorizza SANDER.

**FIPAV letto dal giro.** Se il feed non ha tornei FIPAV, `run.sh` lancia `node fipav/feed.mjs`: legge i JSON pubblici del calendario (media.myvolley.net, gli stessi del sito federvolley.it) dall'ambiente del giro, con cache di 6 ore e una richiesta alla volta, e li scrive in `work/data.json` con `fipavSource`. Tiene solo Serie Beach, Campionato Italiano e Società, niente giovanili, niente nomi né podi. Se FIPAV non risponde, il giro continua senza.
- Finché i dati arrivano dal kit, il calendario FIPAV in app resta nascosto: le grafiche FIPAV non mandano in «Gioca → Tornei → Calendario FIPAV», mostrano Scopri («il compagno per il torneo») e scrivono «Fonte: FIPAV».
- Se FIPAV dovesse rispondere con un blocco (403) anche qui, non aggirarlo: il giro va avanti con tornei SANDER e funzioni.
- `NO_FIPAV=1 bash run.sh …` salta la lettura.

**FIPAV nell'app.** `node fipav/import.mjs` legge gli stessi file pubblici (calendario, classifiche assolute, dettagli dei tornei della settimana, risultati dei profili collegati) e li carica su `/api/fipav/import`, che li salva con il codice dell'app. Chiave: `Authorization: Bearer CRON_SECRET`, aggiunta dal proxy dell'ambiente per www.sanderbv.it (mai scriverla o stamparla). Va lanciato ogni giorno. Quando l'app ha i dati, il feed li contiene e le grafiche tornano a mandare al calendario FIPAV in app.

Scelte di Alex (13/11/2026): tornei FIPAV di tutta Italia; solo calendario (niente podi, niente nomi); categorie Serie Beach, Campionato Italiano, Società; finché FIPAV è vuoto, al loro posto tornei SANDER o funzioni.

## Calendario (Europe/Rome)
| Giorno | Tipo | Contenuto |
|---|---|---|
| Lun 18:30 | post | «Numerone» FIPAV del weekend (quanti tornei, città, «E tu sei ancora senza compagno?») → altrimenti prossimo torneo SANDER → altrimenti funzione |
| Mar 19:00 | storia ×3 | tutorial di una funzione |
| Mer 18:30 | post | funzione della settimana: copertina con la battuta (Scopri → green/red flag, Crea e Chat → chat del gruppo, Tornei e Storico → notifiche, Classifiche → carta), poi «Come funziona» e chiusura |
| Gio 18:30 | post | **Frasi da rete**, appuntamento fisso: una frase numerata (n. 01 = 19/11/2026) da `FRASI` in `content.mjs`, poi chiusura su Scopri |
| Gio 19:00 | storia | questo weekend si gioca (FIPAV → SANDER → partite aperte → funzione) |
| Ven 13:00 | post | «Manca uno»: gancio su foto (settimane pari) o chat del gruppo (dispari) → soluzione (+ partite aperte del weekend) |
| Ven 18:30 | storia | «Chi gioca stasera?» con la schermata di crea partita |
| Sab 10:30 | storia | facoltativa: torneo del weekend o una funzione |
| Dom 11:00 | post | seconda funzione (settimane pari) o un formato divertente a rotazione (dispari): citazione, «Che compagno di beach sei?», notifiche, carta, flag — mai lo stesso del mercoledì |
| Dom 18:30 | storia | countdown al prossimo torneo (SANDER, se no FIPAV con la schermata SANDER) |

Mai più di un giorno senza post. Niente post «numeri della settimana». Titoli e didascalie ruotano di settimana in settimana.

## Giro (ricarica automatica, ogni sera)
Dal 22/11/2026 (scelta di Alex) il giro non ha più giorni fissi: ogni sera alle 21:13 `bash refill.sh` legge la coda Buffer.
- Meno di 4 posti liberi → niente da fare, nessun messaggio.
- Almeno 4 liberi → stampa le finestre da riempire (`A 2026-11-23` = lun–mer, `B 2026-11-23` = gio–dom, solo giorni entro 8 giorni). Per ognuna, in ordine, fai i passi 2–8 con `bash run.sh A|B <lunedì>`.

**Mai niente di uguale.** `run.sh` legge prima lo storico Buffer (`history.mjs`); `render.mjs` usa solo varianti che non compaiono in nessuna didascalia uscita o in coda (le storie si riconoscono dal testo «🏐 …» che `publish.mjs` salva su Buffer). Se una lista non ha più niente di nuovo, lo slot non viene disegnato e `work/out/needs.json` dice quale lista. Allora scrivi varianti nuove in `work/extra-content.json` (stessa forma di `content.mjs`, per esempio `{ "GANCI": [ … ] }`, rispettando le Regole), rilancia `run.sh` e riporta le varianti nuove nel riepilogo, così Alex può aggiungerle a `content.mjs`. Mai riusare una variante.

1. **Kit.** Scarica lo zip in una cartella vuota, poi `cd content-instagram`.
2. **Dati.** `bash run.sh A|B <lunedì>`. Se il feed non risponde, riprova una volta dopo 2 minuti. Se fallisce ancora, scrivilo nel riepilogo e fermati.
3. **Controllo grafiche.** Guarda TUTTE le immagini in `work/out` con Read:
   - testi non tagliati;
   - niente sovrapposizioni tra testo, telefono e pulsante;
   - nelle storie niente di importante nei 270 px in alto né nei 380 px in basso.
   Se una grafica è sbagliata, correggi `render.mjs` e rilancia.
4. **Caricamento.** Per ogni JPG: Higgsfield `media_upload` → `curl -X PUT -H "Content-Type: image/jpeg" --data-binary @file upload_url` → `media_confirm` (type image). Scrivi `work/urls.json` con `{ "nome-file.jpg": "https://…cloudfront…" }`.
5. **Prova a vuoto.** `node publish.mjs work/out/captions.json work/urls.json --dry-run`: mostra cosa verrebbe creato e cosa viene saltato (doppioni, coda piena).
6. **Modalità: automatica** (scelta di Alex del 13/11/2026). Programma subito, senza aspettare conferma; le grafiche arrivano ad Alex nel riepilogo.
7. **Programmazione.** `node publish.mjs work/out/captions.json work/urls.json`.
   - Gli slot già occupati (stesso giorno e stesso tipo, in coda o già usciti) vengono saltati.
   - La coda resta a 10 al massimo: prima si toglie la storia facoltativa del sabato, poi gli slot più lontani.
8. **Storie.** `publish.mjs` controlla l'ultima storia Instagram su Buffer:
   - se è uscita da sola (`storiesAutoPublish: true`), le storie si programmano;
   - se Buffer non l'ha pubblicata, le storie non vanno in coda: finiscono in `manualStories` e le mandi ad Alex con SendUserFile, con giorno e ora, da caricare a mano.
   Al **primo giro** controlla nel giro successivo che la prima storia programmata sia davvero uscita.
9. **Riepilogo** per Alex, breve e in italiano:
   - giorno/ora, tipo, rubrica e anteprima per ogni contenuto;
   - cosa è stato saltato e perché;
   - eventuali storie da caricare a mano.
   La notifica push ed email arriva dall'attività pianificata.

## Regole
- **Formati del 17/11/2026 (scelta di Alex):** ogni post deve far capire subito che si parla di beach volley (sabbia, rete, 2v2, bagno, diagonale, «SANDER · beach volley» in basso). Prima la battuta o la scena che tutti hanno vissuto, poi l'app. Titoli in Bricolage maiuscolo, la parola chiave a mano in lime (Gochi Hand), testo in Figtree. Il flirt è solo una sfumatura (Frasi da rete, flag, Scopri). Le varianti ruotano per settimana in `content.mjs` (`FRASI`, `GANCI`, `CHATS`, `CITAZIONI`, `GIOCHI`, `NOTIFICHE`, `FLAGS`, `CARTE`): quando finiscono, scrivine di nuove nello stesso tono.
- **Frasi da rete:** ogni giovedì, mai saltata. Se le frasi in `FRASI` stanno per finire (26 settimane), aggiungine di nuove in fondo, senza riprendere battute già uscite.
- **Didascalie:** in italiano, tono SANDER, mai chiedere di commentare. CTA solo «Link in bio», «Salvalo», «Swipe». Le storie non hanno testo.
- **Contenuti:** sport prima di tutto, niente promesse di appuntamenti o amore, niente alcol. Persone a piedi nudi e senza loghi (vale anche per eventuali foto future).
- **FIPAV:** sempre «Fonte: FIPAV», mai nomi di atleti, mai tornei giovanili.
- **Ripetizioni:** non ripetere titoli già usati sull'account (elenco in `scripts/content-storie/README.md`). Se aggiungi varianti, controlla lì.
- **Chiave Buffer:** la aggiunge il proxy dell'ambiente. Non chiederla, non scriverla, non stamparla.
- **Doppioni:** prima di creare, sempre `--dry-run`.
- **Modifiche al kit:** rifai lo zip (senza `work/`), caricalo con Higgsfield e aggiorna l'URL nelle due attività pianificate.
