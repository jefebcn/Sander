# Stato SANDER — 19/11/2026 (app per i nuovi utenti, formati Instagram, primi reel)

## Dove siamo
- App: le correzioni per il primo accesso dei nuovi utenti sono online (PR #96). Le pagine vuote mostrano i tornei FIPAV e le ultime partite; la stagione finita mostra «Finita»; Tornei apre il calendario FIPAV quando su SANDER non c'è niente; i link vecchi del login reindirizzano; la home per chi non è registrato è più corta.
- Instagram: nuovi formati in `scripts/content-instagram/formats.mjs` (PR #97). Sono online e collegati ai giri automatici.
- Primi reel fatti con video di altri, con il permesso dell'autore: POV uscito il 17/11, «Technique: zero» in coda per sabato 21 alle 18:30.
- Coda Buffer: 9 post su 10 fino a domenica 22.
- Il ramo `claude/sander-tournament-app-ay3CY` è allineato a main.

## Aperto / in corso
- Giri automatici:
  - import FIPAV ogni giorno alle 06:37;
  - Instagram giro A la domenica alle 21:13 (post da lunedì a mercoledì) e giro B il mercoledì alle 21:13 (da giovedì a domenica).
- Martedì 25 è libero per un eventuale reel in più.
- Proposte fatte ad Alex, non ancora chieste:
  - sfondi nuovi da Gemini (i prompt sono già pronti);
  - altri reel con permesso;
  - messaggio di collaborazione a Tenerife Beach Volley;
  - punto 3 dell'analisi: bottone Scopri centrale;
  - punto 4 dell'analisi: slogan dello shop pubblico.

## Prossimo passo consigliato
Controllare il giro A di domenica 22/11. Poi decidere con Alex quale delle proposte aperte fare.

## Decisioni di Alex ancora valide
- Font solo quelli di SANDER: Bricolage Grotesque, Figtree, Gochi Hand.
- Ogni grafica deve far capire subito che si parla di beach volley.
- «Frase da rete» esce ogni giovedì alle 18:30.
- Video di altri solo con il permesso dell'autore.
- Reel da video stranieri: testi e didascalie in inglese, copertina nello stile del profilo e finale breve con l'app.
- Solo Instagram, niente TikTok.
- Nelle grafiche niente sanderbv.it: si scrive App Store, Google Play o «link in bio».
- Le didascalie non chiedono mai di commentare.

## Attenzione
- Fare il merge solo quando Alex scrive «merge».
- Prima di fare push chiedere ad Alex: il push va in produzione.
- Mai force push.
- `prisma db push` solo per aggiunte.
- Se FIPAV risponde 403, fermarsi e non aggirare le protezioni.
- Mai scrivere o stampare la chiave di Buffer o il CRON_SECRET.
