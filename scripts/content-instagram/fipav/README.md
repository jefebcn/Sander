# Lettore dati FIPAV beach volley — SANDER

Legge i dati ufficiali del beach volley FIPAV: tornei (tappe), risultati partita per partita, classifica finale, entry list, ranking atleti e società.

Requisiti: **Node.js 18 o superiore**. Nessuna libreria da installare.

## Da dove arrivano i dati
Sono i file JSON pubblici usati dal sito ufficiale federvolley.it (sezione Beach Volley → Eventi e Classifiche):

```
https://media.myvolley.net/public/json/{stagione}/discipline.json             indice stagione (pagine)
https://media.myvolley.net/public/json/{stagione}/{n}/discipline.json         tappe (pagina n)
https://media.myvolley.net/public/json/{stagione}/BVL/{M|F}/{id}/info-tappa.json
                                                       .../calendario.json   risultati
                                                       .../classifica.json   classifica finale
                                                       .../entry-list.json   coppie iscritte
https://media.myvolley.net/public/json/{stagione}/BVL/classifiche/index.json  elenco ranking
                                   .../BVL/classifiche/atleti/{categoria}/{m|f}.json
```

Non è un'API ufficiale documentata: se la FIPAV cambia la struttura, va aggiornato `fipav.mjs`. Il programma usa una cache di 6 ore e fa una richiesta alla volta, con una pausa, per non pesare sul server. Nei post e nell'app citare sempre la fonte («Dati: FIPAV»). Per un uso intenso o commerciale conviene chiedere alla FIPAV.

## Comandi

```bash
node cli.mjs tappe --regione emilia --genere m --dal 2026-06-01 --al 2026-08-31
node cli.mjs tappe --cerca rimini
node cli.mjs tappa 2026/BVL/M/11966                  # info, classifica finale, tutte le partite
node cli.mjs ranking --categoria assoluto --sesso f --top 20
node cli.mjs ranking --elenco                        # tutte le classifiche disponibili
node cli.mjs atleta "capucci enrico"                 # posizione in tutte le classifiche
node cli.mjs weekend --regione emilia                # tornei dell'ultimo weekend + podio
node cli.mjs prossimi --regione emilia               # tornei del prossimo weekend
```

Opzioni comuni: `--stagione 2026`, `--json` (stampa JSON), `--out file.json` (salva su file), `--no-cache`.
Categorie ranking: `assoluto`, `under-20`, `under-18`, `under-16`, `under-14`.

## Uso nel codice (app SANDER, script, attività pianificate)

```js
import { listTappe, getTappa, getRankingAtleti, cercaAtleta, reportTornei, ultimoWeekend } from "./fipav.mjs";

const tappe = await listTappe("2026", { regione: "emilia", dal: "2026-08-01", al: "2026-08-31" });
const torneo = await getTappa(tappe[0]);          // { nome, podio, classifica, partite, entryList, ... }
const ranking = await getRankingAtleti("2026", "assoluto", "m");
const posizioni = await cercaAtleta("2026", "rossi luca");
const postLunedi = await reportTornei("2026", { regione: "emilia", ...ultimoWeekend() });
```

Su Vercel (serverless) la cartella della cache non è scrivibile: usa `configure({ cacheDir: "/tmp/fipav" })` oppure `configure({ cacheDir: null })` e salva tu i risultati su Supabase.

## Formato dei dati (principali)

- **Tappa**: `id, codice, path, nome, tipologia, categoria, genere, regione, provincia, comune, dal, al, montepremi, urlSito`
- **Dettaglio**: `struttura, indirizzo, formula, terminata, podio[], classifica[{posizione, coppia, giocatori, punti}], partite[{data, ora, fase, turno, coppia1, coppia2, set1, set2, punteggio, vincitore}], entryList[]`
- **Ranking atleti**: `posizione, atleta, idPersona, punti, puntiEntryList, dettaglio{Torneo internazionale, Campionato italiano, Serie Beach}`

## Idee di integrazione
1. **App**: un job giornaliero (Vercel Cron o Supabase Edge Function) che chiama `listTappe` + `getTappa` e salva su tabelle Supabase `fipav_tappe`, `fipav_partite`, `fipav_classifiche`. L'app legge da lì.
2. **Instagram**: l'attività del lunedì lancia `node cli.mjs weekend --regione emilia --json` e usa podi e finali per il carosello «Tornei FIPAV del weekend». Quella del giovedì usa `prossimi` per la storia «Questo weekend si gioca».
3. **Profili giocatori**: con `cercaAtleta` si può mostrare nel profilo SANDER la posizione FIPAV di un giocatore, ma solo se è lui a collegare il suo nome.
