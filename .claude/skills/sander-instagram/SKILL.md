---
name: sander-instagram
description: Automazione Instagram di @sanderbeachvolley (metodo FantaTitano con Buffer). Usala per la ricarica serale della coda Buffer (refill.sh), per rifare/correggere grafiche dell'app SANDER in mockup di telefono, aggiungere funzioni o varianti, o cambiare calendario e regole dei post.
---

# sander-instagram

Kit: `scripts/content-instagram/` nel repo (stesso contenuto dello zip online usato dalle attività pianificate). Leggi `scripts/content-instagram/PLAYBOOK.md` e seguilo: è la fonte di verità per giro, regole e calendario.

## In breve
- Dati: `https://www.sanderbv.it/api/social/feed` (pubblico, sola lettura, niente dati personali). Codice: `src/lib/social/feed.ts`.
- Ogni sera `bash refill.sh`: se Buffer ha almeno 4 posti liberi stampa le finestre da riempire, e per ognuna `bash run.sh A|B <lunedì>` (A = lun–mer, B = gio–dom).
- Mai niente di uguale: `fresh.mjs` scarta ogni variante già uscita o in coda; se una lista è finita (`work/out/needs.json`) scrivi varianti nuove in `work/extra-content.json` e rilancia.
- Guarda tutte le immagini, caricale con Higgsfield (media_upload → PUT → media_confirm), `node publish.mjs work/out/captions.json work/urls.json --dry-run`, poi senza `--dry-run`.
- Automatico (scelta di Alex del 13/11/2026): programma subito e manda le grafiche nel riepilogo. Attività pianificata: ogni sera alle 21:13 (ricarica), in questa chat.
- Buffer: canale IG `6adf67a12f1f5ed648d9cba6`, piano gratuito (max 10 in coda), chiave aggiunta dal proxy dell'ambiente: mai chiederla né stamparla.

## Stile
- **Post (dal 17/11/2026, `formats.mjs`):** prima una battuta o una scena di beach volley che tutti hanno vissuto, poi l'app. Ogni copertina deve far capire subito che si parla di beach volley. Font di SANDER: Bricolage Grotesque maiuscolo per i titoli, Gochi Hand lime per la parola chiave, Figtree per i testi; scuro + lime, grana da pellicola, adesivi ed evidenziatore.
- **Frasi da rete:** appuntamento fisso del giovedì, numerato (`FRASI` in `content.mjs`). Flirt solo come sfumatura, sport prima di tutto.
- **Stile (dal 23/11/2026):** `glow.mjs`: Tabellone (dati), Poster lime (ganci), Telefono in campo (app e storie), Glossario da spiaggia. Schermate vere dell'app in un telefono.
- **Sfondi AI (dal 26/11/2026):** `bgai.mjs` genera una foto nuova (Vercel AI Gateway) per ogni copertina di post e ogni storia (slide interne disegnate); scena mai tra le ultime 12 (`work/scenes-used.json`); niente foto per slot già passati; rifarla = cancellare `work/photos-new/<slot>.jpg` e rilanciare. Niente Higgsfield né Canva.
- Post 1080×1350, storie 1080×1920 (niente di importante nei 270 px in alto e nei 380 px in basso).

## Aggiornare le schermate
Le schermate in `screens/` vengono dall'app in locale con dati di prova (nomi inventati): avvia DB e `next dev`, poi cattura a 390×844 @2x con Playwright (vedi la storia del kit nel PLAYBOOK). Non usare mai schermate con persone reali.

## Regole da non dimenticare
Didascalie in italiano senza chiedere commenti; CTA solo Link in bio / Salvalo / Swipe; storie senza testo; niente numeri della settimana; FIPAV solo calendario con «Fonte: FIPAV», mai nomi né tornei giovanili (se l'app non ha dati FIPAV, `run.sh` li legge con `fipav/feed.mjs`; un 403 non va aggirato); non ripetere titoli già usati (`scripts/content-storie/README.md`).
