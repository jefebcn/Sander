---
name: sander-instagram
description: Automazione Instagram di @sanderbeachvolley (metodo FantaTitano con Buffer). Usala per il giro della domenica (lun–mer) o del mercoledì (gio–dom), per rifare/correggere grafiche dell'app SANDER in mockup di telefono, aggiungere funzioni o varianti, o cambiare calendario e regole dei post.
---

# sander-instagram

Kit: `scripts/content-instagram/` nel repo (stesso contenuto dello zip online usato dalle attività pianificate). Leggi `scripts/content-instagram/PLAYBOOK.md` e seguilo: è la fonte di verità per giro, regole e calendario.

## In breve
- Dati: `https://www.sanderbv.it/api/social/feed` (pubblico, sola lettura, niente dati personali). Codice: `src/lib/social/feed.ts`.
- `bash run.sh A` domenica sera (lun–mer della settimana dopo), `bash run.sh B` mercoledì sera (gio–dom).
- Guarda tutte le immagini, caricale con Higgsfield (media_upload → PUT → media_confirm), `node publish.mjs work/out/captions.json work/urls.json --dry-run`, poi senza `--dry-run`.
- Fino al 29/11/2026: prima di programmare mostra le grafiche ad Alex e aspetta il suo ok. Dal 30/11: automatico.
- Buffer: canale IG `6adf67a12f1f5ed648d9cba6`, piano gratuito (max 10 in coda), chiave aggiunta dal proxy dell'ambiente: mai chiederla né stamparla.

## Stile
UI scura, accento ambra/arancio tramonto, sfondi generati (niente foto: nessun limite di riuso), titoli Gochi Hand, etichette Inter, schermate vere dell'app in un telefono. Post 1080×1350, storie 1080×1920 (niente di importante nei 270 px in alto e nei 380 px in basso).

## Aggiornare le schermate
Le schermate in `screens/` vengono dall'app in locale con dati di prova (nomi inventati): avvia DB e `next dev`, poi cattura a 390×844 @2x con Playwright (vedi la storia del kit nel PLAYBOOK). Non usare mai schermate con persone reali.

## Regole da non dimenticare
Didascalie in italiano senza chiedere commenti; CTA solo Link in bio / Salvalo / Swipe; storie senza testo; niente numeri della settimana; FIPAV solo calendario con «Fonte: FIPAV», mai nomi né tornei giovanili; non ripetere titoli già usati (`scripts/content-storie/README.md`).
