# Stato SANDER — 23/11/2026 (FIPAV, R8 Android, ricarica Buffer automatica, niente ripetizioni)

## Dove siamo
- App: i tornei FIPAV annullati spariscono dall'app (PR #99, unita). Android con R8 attivo: versionCode 5 / 1.3 caricato da Alex nel test interno di Play.
- Instagram: la coda Buffer si ricarica da sola ogni sera alle 21:13 quando ha almeno 4 posti liberi; `fresh.mjs` controlla lo storico Buffer e non ripete mai testi né varianti.
- Ogni foto di sfondo una sola volta: le foto di `photos.json` sono finite (scorta 0); senza foto nuove lo slot esce con la grafica senza foto.
- Orari fissi: post alle 12:00, storie alle 12:30 (anche la coda attuale, 10/10 fino al 29/11).
- 5 post a settimana e 5 storie.

## Aperto / in corso
- PR #100 (ricarica, niente ripetizioni, orari): CI verde, aspetta «merge».
- Alex darà un nuovo account Higgsfield per generare foto nuove (quello attuale ha 0,07 crediti, `soul_2` costa 0,12 a foto). Poi rimettere foto nei contenuti.
- Glow-up grafiche dal 30/11: Alex deve scegliere le direzioni (A Tabellone, D Poster lime, E Telefono in campo, B Pellicola 35mm) e le rubriche nuove (Glossario da spiaggia, Il Fondamentale, Mito o verità). Prototipi nello scratchpad `glow/` (perdibili).
- Play: lista tester del test interno da completare (Alex).
- Automazioni: import FIPAV ogni giorno 06:37 (trig_01UEkWwoifzQw32yqTcy8FdS); ricarica Instagram 21:13 (trig_017VM89jHtYpjJLMN1ho7KDg), usa il repo, lo zip è solo di riserva e non ha gli orari nuovi.

## Prossimo passo consigliato
Con il nuovo account Higgsfield generare la scorta di foto nuove (una per slot, mai riusate), poi fare il glow-up con le direzioni scelte da Alex in `formats.mjs`.

## Decisioni di Alex ancora valide
- Mai post ripetitivi né lo stesso sfondo: ogni foto esce una volta sola (23/11).
- La coda attuale va bene così com'è, anche con le immagini già generate (23/11): non rifarla.
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
