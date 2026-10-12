# SANDER — Idee per il futuro

Ogni idea ha due voti: **impatto** (quanto sposta utenti o ricavi) e **sforzo**
(quanto lavoro serve). Dove possibile si appoggia a pezzi che l'app ha già, ed è
per questo che alcune costano poco.

Legenda: 🟢 basso · 🟡 medio · 🔴 alto

---

## 1. Da fare subito: inverno e stagione 2027

| # | Idea | Impatto | Sforzo | Perché ora |
|---|------|:---:|:---:|---|
| 1 | **SANDER Wrapped 2026**: il riepilogo della stagione da condividere (partite, vittorie, bagno preferito, compagno più frequente, Re dei Bagni conquistati) | 🟢🟢🟢 | 🟡 | Ottobre è il momento giusto. Il Wrapped mensile esiste già, va solo esteso alla stagione. È il contenuto più condivisibile che hai |
| 2 | **Modalità inverno**: arene di sabbia indoor della Romagna come "bagni" in classifica, con tornei indoor | 🟢🟢🟢 | 🟡 | Da ottobre ad aprile i ricavi vanno a zero. Così l'app resta viva e la classifica non si ferma |
| 3 | **Countdown alla stagione 2027**: a maggio si riparte da zero nelle classifiche dei comuni, con premio per il primo Re di ogni comune | 🟢🟢 | 🟢 | Riporta in app chi ha giocato quest'estate: è la retention stagionale che ora misuri in /admin/metriche |

## 2. Far tornare la gente (gamification)

| # | Idea | Impatto | Sforzo | Note |
|---|------|:---:|:---:|---|
| 4 | **Sfide settimanali**: "gioca 2 partite", "vinci in un bagno nuovo", "porta un amico", con XP e badge | 🟢🟢🟢 | 🟡 | Danno un motivo per aprire l'app anche senza una partita fissata |
| 5 | **Serie settimanale**: settimane di fila in cui hai giocato, con 1 "salva-serie" al mese | 🟢🟢 | 🟢 | Funziona come la fiamma di Duolingo. I dati sono già in `lib/streak.ts` |
| 6 | **La tua nemesi**: il giocatore contro cui perdi di più, con proposta di rivincita | 🟢🟢 | 🟢 | `getHeadToHeadStats` esiste già |
| 7 | **MVP votato dai compagni** a fine partita | 🟢🟢 | 🟡 | Crea reputazione e dà un motivo per chiudere la partita in app |
| 8 | **Notifica "manca uno"**: "manca 1 giocatore alle 18 al Bagno 26, entri?" mandata a chi è libero ed è al livello giusto | 🟢🟢🟢 | 🟡 | Unisce la bacheca disponibilità e la lista d'attesa che ci sono già. È la funzione che riempie le partite |

## 3. Territorio e community

| # | Idea | Impatto | Sforzo | Note |
|---|------|:---:|:---:|---|
| 9 | **Pagina ufficiale del bagno**: campi, orari, contatti, partite in programma, Re del Bagno. Il bagno può rivendicarla | 🟢🟢🟢 | 🟡 | Porta i bagni dentro l'app ed è la base per i ricavi partner (idee 14 e 15) |
| 10 | **Coppie fisse** con classifica a coppie | 🟢🟢 | 🟡 | Nel beach volley si gioca in coppia: oggi la classifica è solo individuale |
| 11 | **Derby della Riviera**: evento mensile comune contro comune, con classifica aggregata | 🟢🟢 | 🟢 | Le classifiche per comune esistono già: serve la cornice dell'evento |
| 12 | **App in inglese e tedesco** | 🟢🟢 | 🟡 | D'estate la Riviera è piena di turisti tedeschi che giocano in spiaggia |
| 13 | **Check-in al campo con QR del bagno** | 🟢 | 🟡 | Certifica che la partita è stata davvero giocata lì: classifiche più credibili |

## 4. Ricavi

| # | Idea | Impatto | Sforzo | Note |
|---|------|:---:|:---:|---|
| 14 | **Commissione sui tornei con Stripe Connect** (es. 5–8%) | 🟢🟢🟢 | 🟡 | Risolve anche un problema: oggi le quote dei tornei di organizzatori esterni arrivano sul tuo Stripe e vanno girate a mano |
| 15 | **Sponsor della classifica** ("Classifica di Riccione offerta da…") e partner per bagno | 🟢🟢 | 🟢 | Il pulsante "Diventa partner" in home raccoglie già i contatti |
| 16 | **SANDER Pro** (circa 2,99 €/mese o 19,99 €/anno): statistiche avanzate, cornici esclusive per la carta, priorità in lista d'attesa, storico completo | 🟢🟢 | 🔴 | Da lanciare quando ci sono abbastanza utenti attivi: prima serve la massa |
| 17 | **Prenotazione campi** con i bagni partner (commissione o canone) | 🟢🟢🟢 | 🔴 | È il modello di Playtomic. Richiede accordi con i bagni |
| 18 | **Merch**: la carta SANDER stampata, la maglietta "Re del Bagno" | 🟢 | 🟢 | Si può fare on demand, senza magazzino |

## 5. Da sistemare prima di crescere

| # | Cosa | Perché |
|---|------|---|
| 19 | **Google Play Billing nell'app Android** | Per vendere SC dentro l'app Android serve la fatturazione di Google. Il pagamento con carta ora è attivo solo sul web. PayPal e bonifico però compaiono ancora anche nell'app: da valutare se nasconderli lì |
| 20 | **Piano Vercel** | Il piano Hobby vieta l'uso commerciale: con incassi Stripe serve il Pro |
| 21 | **Ricerca del codice invito** | Oggi a ogni iscrizione con invito si caricano tutti i giocatori per trovare il codice. Va bene adesso, non con migliaia di utenti: serve un campo indicizzato |
| 22 | **App iOS** | Il progetto Capacitor per iOS c'è già |
| 23 | **"Aggiungi al calendario"** per le partite (file .ics) | Meno partite dimenticate, meno buchi all'ultimo |

---

### Le prime 5 da cui partirei

1. **Wrapped 2026** (1): si fa adesso e fa marketing gratis.
2. **Notifica "manca uno"** (8): riempie le partite, che è il motivo per cui la gente usa l'app.
3. **Sfide settimanali** (4): danno un motivo per aprirla ogni settimana.
4. **Pagina del bagno** (9): porta i bagni dentro l'app e apre i ricavi partner.
5. **Stripe Connect sui tornei** (14): ricavo pulito e niente più quote da girare a mano.
