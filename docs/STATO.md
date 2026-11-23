# Stato SANDER — 23/11/2026 (glow-up grafiche, ricarica Buffer automatica, niente ripetizioni)

## Dove siamo
- App: i tornei FIPAV annullati spariscono dall'app (PR #99, unita). Android con R8 attivo: versionCode 5 / 1.3 caricato da Alex nel test interno di Play.
- Instagram: la coda Buffer si ricarica da sola ogni sera alle 21:13 quando ha almeno 4 posti liberi; `fresh.mjs` controlla lo storico Buffer e non ripete mai testi né varianti.
- Ogni foto di sfondo una sola volta: le foto di `photos.json` sono finite (scorta 0); senza foto nuove lo slot esce con la grafica senza foto.
- Glow-up attivo da oggi: `glow.mjs` (Tabellone, Poster lime, Telefono in campo, Glossario da spiaggia), senza foto. La coda Buffer 23–29/11 è stata rifatta tutta con il nuovo stile (10/10).
- Orari fissi: post alle 12:00, storie alle 12:30.
- 5 post a settimana e 5 storie.

## Aperto / in corso
- PR #100 (ricarica, niente ripetizioni, orari): CI verde, aspetta «merge».
- Alex darà un nuovo account Higgsfield per generare foto nuove (quello attuale ha 0,07 crediti, `soul_2` costa 0,12 a foto). Poi rimettere foto nei contenuti.
- Glow-up: restano da fare B Pellicola 35mm (serve foto), le rubriche «Il Fondamentale» e «Mito o verità», e i formati vecchi ancora usati (chat, flag, gioco, carta, frase) da ridisegnare. Il Glossario esce nella rotazione della domenica (settimane dispari).
- Play: lista tester del test interno da completare (Alex).
- Automazioni: import FIPAV ogni giorno 06:37 (trig_01UEkWwoifzQw32yqTcy8FdS); ricarica Instagram 21:13 (trig_017VM89jHtYpjJLMN1ho7KDg), usa il repo, lo zip è solo di riserva e non ha gli orari nuovi.

## Prossimo passo consigliato
Sentire Alex sulle prime uscite del nuovo stile; poi ridisegnare in `glow.mjs` i formati ancora vecchi e aggiungere le rubriche nuove. Con il nuovo account Higgsfield valutare la Pellicola 35mm (ogni foto una volta sola).

## Decisioni di Alex ancora valide
- Mai post ripetitivi né lo stesso sfondo: ogni foto esce una volta sola (23/11).
- Nuovo stile da subito, al posto dei contenuti vecchi (23/11).
- Post alle 12:00, storie alle 12:30.
- Font solo Bricolage Grotesque, Figtree, Gochi Hand; beach volley chiaro da subito.
- «Frase da rete» ogni giovedì. Solo Instagram, niente TikTok.
- Video di altri solo con permesso; video stranieri con testi in inglese.
- Niente sanderbv.it nelle grafiche (App Store, Google Play, «link in bio»); didascalie senza richieste di commento.

## Attenzione
- Merge solo con «merge»; chiedere prima del push (va in produzione); mai force push.
- Un riavvio del container può cancellare commit non pushati.
- `prisma db push` solo aggiunte; FIPAV 403 → fermarsi.
- Sul PC di Alex: `Documents\GitHub\Sander` può perdere il versionCode con Pull/Discard; chiedere conferma prima di ogni operazione sul PC.
- Mai scrivere o stampare la chiave Buffer o il CRON_SECRET.
