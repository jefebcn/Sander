# Scheda Google Play — SANDER (com.sanderbv.app)

Testi pronti da incollare in Play Console → Presenza nello store → Scheda principale.
I limiti di Google sono tra parentesi; i conteggi sono già verificati.

## Nome dell'app (max 30)

```
SANDER – Beach Volley Romagna
```

## Descrizione breve (max 80)

```
Trova con chi giocare a beach volley: swipe, match, coppie 2v2 e partite vicine.
```

## Descrizione completa (max 4000)

```
SANDER è l'app del beach volley in Riviera Romagnola. Trovi con chi giocare, organizzi la partita e vedi come cresce il tuo livello, tutto in un posto.

SCOPRI: TROVA CON CHI GIOCARE
Scorri i profili dei giocatori della tua zona. Ogni profilo ha fino a 6 foto e 3 risposte («Il mio colpo migliore è…», «Quando perdiamo un punto io…»). Metti like a una foto o a una risposta precisa e scrivi un commento: chi riceve un like con un commento risponde molto più spesso.
• 8 like al giorno, per sceglierli bene
• Un Ace a settimana: il tuo like finisce in cima alla sua lista
• «Il più compatibile di oggi»: ogni mattina un giocatore scelto per te, in base a livello, ruolo, zona e orari
• «Libero oggi»: fai sapere che oggi sei disponibile, mattina, pomeriggio o sera
• Affinità in percentuale e i motivi per cui te lo proponiamo

MATCH: DALLA CHAT AL CAMPO
Quando il like è reciproco è match. Chattate, proponete un giorno e un bagno, e la partita finisce in calendario. La lista ti dice a chi tocca rispondere, così nessuna conversazione si spegne.

COPPIE 2V2
Forma la tua coppia fissa, sfida le altre coppie e scala la classifica. Ogni partita completata aggiorna il punteggio della coppia. Potete anche iscrivervi insieme ai tornei.

PARTITE E TORNEI
• Crea una partita 2v2, 3v3 o 4v4 in pochi secondi e trova i giocatori che mancano
• Vedi le partite con posti liberi nel tuo comune
• Tornei King of the Beach, gironi, eliminazione diretta e Chicece, con risultati in diretta
• Risultati set per set e rating aggiornato dopo ogni partita

GIOCATORI AFFIDABILI
Chi si presenta alle partite ottiene il badge verificato e sale nei suggerimenti. Se vieni segnato come assente per errore, puoi contestarlo dalle tue presenze.

LA TUA CARTA GIOCATORE
Livello, partite giocate, percentuale di vittorie, rating e classifica del tuo comune. Dopo ogni partita vedi quanto sei cresciuto.

SICUREZZA
Puoi bloccare e segnalare un giocatore in ogni momento, anche per una foto o un messaggio. Le segnalazioni vengono controllate dal nostro team. Scopri è riservato ai maggiorenni.

Fatto in Romagna, da chi gioca, per chi gioca. Ci vediamo in spiaggia.
```

## Novità di questa versione (max 500)

```
Arriva Scopri: trova con chi giocare a colpi di swipe. Like a una foto o a una risposta con un commento, match e chat per fissare la partita. Nuove Coppie 2v2 con sfide e classifica, «Il più compatibile di oggi», «Libero oggi», badge per i giocatori affidabili e la possibilità di contestare un'assenza. Nuovi colori e nuovi caratteri.
```

## Grafica

Generata con `scripts/store-scopri.mjs` dalle schermate vere, su dati demo (vedi l'intestazione dello script).
La prova end-to-end (`scripts/e2e/smoke.mjs`) controlla anche che nell'app Android non compaia niente da comprare.

| File | Uso |
|---|---|
| `scripts/store-screenshots/feature-graphic-scopri-1024x500.png` | Grafica in evidenza (sostituisce `feature-graphic-1024x500.png`) |
| `scripts/store-screenshots/scopri-1-swipe.png` | Screenshot 1 — Scopri |
| `scripts/store-screenshots/scopri-2-like.png` | Screenshot 2 — Like con commento |
| `scripts/store-screenshots/scopri-3-match.png` | Screenshot 3 — Match |
| `scripts/store-screenshots/scopri-4-coppie.png` | Screenshot 4 — Coppie 2v2 |
| `scripts/store-screenshots/scopri-5-home.png` | Screenshot 5 — Home |
| `scripts/store-screenshots/scopri-6-profilo.png` | Screenshot 6 — Profilo Scopri |
| `scripts/store-screenshots/02-partite.png`, `03-tornei.png` | Screenshot 7–8 (facoltativi, grafica precedente) |

Formato: PNG 1080×1920 (9:16), entro i limiti di Google (lato da 320 a 3840 px).

## Da aggiornare in Play Console

1. **Sicurezza dei dati** (Contenuti dell'app → Sicurezza dei dati). Aggiungere o confermare:
   - Foto (profilo Scopri) — raccolte, condivise con gli altri utenti dell'app, non vendute.
   - Data di nascita / età — raccolta per il limite dei 18 anni di Scopri.
   - Messaggi in app (chat dei match) — raccolti.
   - Posizione approssimativa — solo il comune scelto dall'utente, nessun GPS.
   - Acquisti: SANDER+ e pacchetti SC si comprano solo sul sito, non nell'app.
   - Eliminazione dell'account: `https://www.sanderbv.it/delete-account`.
2. **Classificazione dei contenuti** (questionario IARC): rispondere «sì» a interazione tra utenti e chat; nessuna condivisione della posizione precisa.
3. **Pubblico di destinazione**: 18+ (Scopri è vietato ai minori).
4. **Contenuti generati dagli utenti**: blocco e segnalazione di un giocatore (anche per foto o messaggi) e moderazione admin in `/admin/segnalazioni`.
5. **Norme e privacy**: `https://www.sanderbv.it/privacy` e `https://www.sanderbv.it/terms` (aggiornate il 19 ottobre 2026).

## Note tecniche sull'app Android

- L'app (Capacitor) carica `https://www.sanderbv.it`: le nuove funzioni arrivano senza aggiornare l'APK.
- **Pagamenti nell'app**: SANDER+, pacchetti SC, PayPal e bonifico sono nascosti quando l'app gira dentro Android (`useIsNativeApp()` in `src/lib/native.ts`). Google Play vieta pagamenti esterni per contenuti digitali. Chi ha già SANDER+ lo vede attivo anche nell'app.
- **Notifiche**: la WebView di Android non riceve le notifiche push del browser. Nell'app restano le notifiche interne (campanella e badge). Il plugin `@capacitor/push-notifications` è già installato, ma mancano la registrazione nell'app, il file `android/app/google-services.json` (Firebase) e l'invio FCM dal server: lavoro a parte.
- **Colori di avvio**: `capacitor.config.ts` ha il nuovo grafite `#0b0b0c` e lo spinner giallo-verde. Valgono solo dopo una nuova build nativa: `npx cap sync android`, poi alzare `versionCode` in `android/app/build.gradle` (ora 2) e generare l'AAB firmato.
