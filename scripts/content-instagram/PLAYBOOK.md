# PLAYBOOK — Instagram @sanderbeachvolley

Kit che legge i dati veri di SANDER, disegna post e storie con le schermate dell'app in un mockup di telefono e li programma su Buffer. Metodo FantaTitano, adattato a SANDER.

## Contenuto del kit
| File | Cosa fa |
|---|---|
| `run.sh A\|B [lunedì]` | dati → piano → grafiche in `work/` |
| `plan.mjs` | calendario settimanale e rotazioni (per settimana ISO) |
| `render.mjs` | template post 1080×1350 e storie 1080×1920 |
| `content.mjs` | funzioni dell'app, titoli e didascalie a rotazione |
| `publish.mjs` | Buffer: doppioni, coda max 10, controllo storie |
| `screens/` | schermate vere dell'app (dati di prova, nessuna persona reale) |
| `fonts/`, `assets/` | Gochi Hand, Inter, icona dell'app |

## Fonte dati
`https://www.sanderbv.it/api/social/feed`: pubblico, in sola lettura, niente dati personali.
- `tournaments`: tornei SANDER delle prossime 4 settimane.
- `openMatches`: partite aperte dei prossimi 4 giorni.
- `fipav`: calendario FIPAV senza nomi di atleti, senza tornei giovanili. Oggi è vuoto: FIPAV blocca i server di Vercel finché non autorizza SANDER. Quando arriveranno i dati, gli slot FIPAV si riempiranno da soli.

Scelte di Alex (13/11/2026): tornei FIPAV di tutta Italia; solo calendario (niente podi, niente nomi); categorie Serie Beach, Campionato Italiano, Società; finché FIPAV è vuoto, al loro posto tornei SANDER o funzioni.

## Calendario (Europe/Rome)
| Giorno | Tipo | Contenuto |
|---|---|---|
| Lun 18:30 | post | Tornei FIPAV del weekend → altrimenti prossimo torneo SANDER → altrimenti funzione |
| Mar 19:00 | storia ×3 | tutorial di una funzione |
| Mer 18:30 | post | funzione della settimana (mai la stessa due settimane di fila) |
| Gio 19:00 | storia | questo weekend si gioca (FIPAV → SANDER → partite aperte → funzione) |
| Ven 13:00 | post | «Manca sempre uno?», problema → soluzione (+ partite aperte del weekend) |
| Ven 18:30 | storia | «Chi gioca stasera?» con la schermata di crea partita |
| Sab 10:30 | storia | facoltativa: torneo del weekend o una funzione |
| Dom 11:00 | post | seconda funzione (settimane pari) o community (dispari) |
| Dom 18:30 | storia | countdown al prossimo torneo (SANDER, se no FIPAV con la schermata SANDER) |

Mai più di un giorno senza post. Niente post «numeri della settimana». Titoli e didascalie ruotano di settimana in settimana.

## Giro (due volte a settimana)
- **Domenica sera** → `bash run.sh A` (lunedì–mercoledì della settimana dopo).
- **Mercoledì sera** → `bash run.sh B` (giovedì–domenica di questa settimana).

1. **Kit.** Scarica lo zip in una cartella vuota, poi `cd content-instagram`.
2. **Dati.** `bash run.sh A` (o `B`). Se il feed non risponde, riprova una volta dopo 2 minuti. Se fallisce ancora, scrivilo nel riepilogo e fermati.
3. **Controllo grafiche.** Guarda TUTTE le immagini in `work/out` con Read:
   - testi non tagliati;
   - niente sovrapposizioni tra testo, telefono e pulsante;
   - nelle storie niente di importante nei 270 px in alto né nei 380 px in basso.
   Se una grafica è sbagliata, correggi `render.mjs` e rilancia.
4. **Caricamento.** Per ogni JPG: Higgsfield `media_upload` → `curl -X PUT -H "Content-Type: image/jpeg" --data-binary @file upload_url` → `media_confirm` (type image). Scrivi `work/urls.json` con `{ "nome-file.jpg": "https://…cloudfront…" }`.
5. **Prova a vuoto.** `node publish.mjs work/out/captions.json work/urls.json --dry-run`: mostra cosa verrebbe creato e cosa viene saltato (doppioni, coda piena).
6. **Modalità.**
   - **Fino al 29/11/2026 compreso: controllo di Alex in chat.** Manda le immagini con SendUserFile, scrivi per ogni slot giorno/ora, tipo e didascalia, poi fermati e chiedi conferma. Programma solo dopo il suo «ok», applicando le modifiche che chiede.
   - **Dal 30/11/2026: automatico.** Programma subito.
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
- **Didascalie:** in italiano, tono SANDER, mai chiedere di commentare. CTA solo «Link in bio», «Salvalo», «Swipe». Le storie non hanno testo.
- **Contenuti:** sport prima di tutto, niente promesse di appuntamenti o amore, niente alcol. Persone a piedi nudi e senza loghi (vale anche per eventuali foto future).
- **FIPAV:** sempre «Fonte: FIPAV», mai nomi di atleti, mai tornei giovanili.
- **Ripetizioni:** non ripetere titoli già usati sull'account (elenco in `scripts/content-storie/README.md`). Se aggiungi varianti, controlla lì.
- **Chiave Buffer:** la aggiunge il proxy dell'ambiente. Non chiederla, non scriverla, non stamparla.
- **Doppioni:** prima di creare, sempre `--dry-run`.
- **Modifiche al kit:** rifai lo zip (senza `work/`), caricalo con Higgsfield e aggiorna l'URL nelle due attività pianificate.
