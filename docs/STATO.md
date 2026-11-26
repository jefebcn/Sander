# Stato SANDER — 26/11/2026 (sfondi nuovi con AI Gateway, coda Buffer piena)

## Dove siamo
- Instagram: coda Buffer piena (10/10) fino a gio 03/12. Le grafiche B 30/11 da ven 04/12 a dom 06/12 sono pronte ma senza posto: le mette la ricarica delle 21:13.
- Glow-up attivo (`glow.mjs`, senza foto). I titoli FIPAV e le note delle storie ora ruotano con `pickBy` (e085be0), così un testo già uscito non torna.
- Sfondi: Alex vuole sfondi foto unici, belli e «beach volley style». Higgsfield no (0 crediti), Canva ha finito la quota mensile dopo 4 immagini, foto d'archivio e disegno a codice scartati (non unici o non all'altezza).
- Nuova strada: Vercel AI Gateway. Chiave salvata da Alex come network secret su `ai-gateway.vercel.sh` (il proxy la aggiunge da solo); `GET /v1/credits` → balance 5 $, usati 0.
- Esempio approvato come direzione: testo glow sopra una foto (post tramonto «Manca il quarto?», storia sabbia «Stasera si gioca.»). Lo script di prova era nello scratchpad, fuori dal kit.

## Aperto / in corso
- Prova dei 3 modelli con la stessa scena (carriola di ghiaccio con birre e anguria al tramonto, giocatori a piedi nudi dietro): `bfl/flux-3-image` (~0,05 $), `bytedance/seedream-5.5` (0,02–0,035 $), `openai/gpt-image-2`. Poi Alex sceglie.
- Dopo la scelta: nel kit uno slot foto per format, ogni sfondo una volta sola (segnato in `photos.json`), alternato alle grafiche senza foto.
- PR #100 aspetta «merge».
- Rubriche «Il Fondamentale» e «Mito o verità», e i formati vecchi (chat, flag, gioco, carta, frase) da ridisegnare in glow.
- Automazioni: import FIPAV ogni giorno 06:37 (trig_01UEkWwoifzQw32yqTcy8FdS); ricarica Instagram 21:13 (trig_017VM89jHtYpjJLMN1ho7KDg).

## Prossimo passo consigliato
Generare la scena carriola con i 3 modelli, metterla nel layout glow (post 1080×1350, storia 1080×1920) e far scegliere ad Alex; poi aggiungere gli sfondi AI al kit.

## Decisioni di Alex ancora valide
- Birra ammessa nelle foto, ogni tanto anche protagonista, ma non in ogni post (26/11). Persone a piedi nudi, senza loghi né scritte.
- Dettagli scherzosi benvenuti (carriola col ghiaccio, ciabatte, cane che ruba il pallone…).
- Mai post ripetitivi né lo stesso sfondo: ogni foto esce una volta sola (23/11).
- Post alle 12:00, storie alle 12:30. «Frase da rete» ogni giovedì. Solo Instagram.
- Font solo Bricolage Grotesque, Figtree, Gochi Hand.
- Niente sanderbv.it nelle grafiche; didascalie senza richieste di commento.

## Attenzione
- Merge solo con «merge»; chiedere prima del push (va in produzione); mai force push.
- Le chiavi non si chiedono in chat: in una sessione molto lunga il modulo chiavi non si apre, Alex le mette in Edit ambiente → Network secrets.
- Canva: il generatore AI ha una quota mensile piccola (4 immagini e stop).
- Mai scrivere o stampare chiavi (Buffer, AI Gateway, CRON_SECRET).
- `prisma db push` solo aggiunte; FIPAV 403 → fermarsi.
