# Stato SANDER — 26/11/2026 (sfondi AI nel kit, coda Buffer piena)

## Dove siamo
- Instagram: coda Buffer piena (10/10) fino a gio 03/12. Le grafiche B 30/11 da ven 04/12 a dom 06/12 sono pronte ma senza posto: le mette la ricarica delle 21:13.
- Glow-up attivo (`glow.mjs`). I titoli FIPAV e le note delle storie ora ruotano con `pickBy` (e085be0), così un testo già uscito non torna.
- Higgsfield (0 crediti) e Canva (quota finita dopo 4 immagini) non si usano per gli sfondi; foto d'archivio e disegno a codice scartati da Alex (non unici o non all'altezza).
- Sfondi AI nel kit (`bgai.mjs`, Vercel AI Gateway): FLUX 3 per i post, GPT Image 2 per le storie, FLUX.2 Klein di riserva. Foto su gancio del venerdì, citazione della domenica e storie col telefono; gli altri format restano disegnati. Il venerdì, finite le chat, esce il gancio con foto.
- Chiave: network secret su `ai-gateway.vercel.sh` (il proxy la mette nelle chiamate curl). Alex ha comprato 10 $ di credito; il 26/11 restavano circa 14 $ (circa 3–5 centesimi a foto).
- La ricarica serale (trig_017VM89jHtYpjJLMN1ho7KDg) ha il prompt aggiornato: sfondi AI, controllo delle foto, credito nel riepilogo.

## Aperto / in corso
- Prime uscite con foto AI: ven 04/12 (gancio), ven e sab storie; sentire Alex.
- PR #100 aspetta «merge».
- Rubriche «Il Fondamentale» e «Mito o verità», e i formati vecchi (chat, flag, gioco, carta, frase) da ridisegnare in glow.
- Automazioni: import FIPAV ogni giorno 06:37 (trig_01UEkWwoifzQw32yqTcy8FdS); ricarica Instagram 21:13 (trig_017VM89jHtYpjJLMN1ho7KDg).

## Prossimo passo consigliato
Vedere con Alex le prime uscite con foto AI; se piacciono, estendere la foto ad altri format (copertina del mercoledì, Pellicola 35mm) e aggiungere scene in `SCENES`.

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
- Canva: il generatore AI ha una quota mensile piccola (4 immagini e stop). Seedream mette la filigrana «AI generated»: non usarlo.
- Mai scrivere o stampare chiavi (Buffer, AI Gateway, CRON_SECRET).
- `prisma db push` solo aggiunte; FIPAV 403 → fermarsi.
