# Programmazione post Instagram e TikTok (piano, da avviare)

Deciso il 20/10/2026: niente Metricool né Buffer. Da avviare quando si è pronti.

## Instagram (e Facebook): coda dentro SANDER, pubblicazione automatica

- **Coda in admin.** Ogni post ha immagine o carosello (fino a 10), didascalia, data e ora.
  - Base già esistente: modello `ContentPost`, `/api/cron/content`, `components/admin/ContentQueue.tsx`.
  - Servono in più: `scheduledAt`, `kind` (image/carousel/reel), l'id del post pubblicato e lo stato `FAILED`.
- **Pubblicazione** tramite Instagram Graph API, Content Publishing (le stesse API di Buffer e Metricool):
  1. `POST /{ig-user-id}/media` per creare il contenitore (image_url pubblico: blob o `/api/story/...`);
  2. per i caroselli, un contenitore per immagine più quello `CAROUSEL`;
  3. `POST /{ig-user-id}/media_publish`.
  - Limite: 100 post ogni 24 ore.
- **Orari.** Il cron di Vercel Hobby gira una sola volta al giorno, quindi serve un workflow GitHub Actions `schedule` ogni 15 minuti che chiama `/api/cron/social` con `CRON_SECRET`. La route pubblica i post con `scheduledAt <= now`.
- **Setup una tantum dell'utente (circa 20 minuti):**
  1. account Instagram professionale (Business o Creator) collegato a una pagina Facebook;
  2. app su Meta for Developers con i permessi `instagram_basic`, `instagram_content_publish`, `pages_show_list`, `pages_read_engagement`;
  3. token che non scade (system user di Business Manager), salvato in Vercel come `META_ACCESS_TOKEN`, più `IG_USER_ID`.
- **Prima coda:** i 12 post di `scripts/content-grid/out/` (ordine dal 12 all'1, didascalie in `scripts/content-grid/README.md`), uno al giorno alle 18:45, ora italiana.

## TikTok: preparazione automatica, pubblicazione con un tap

- La Content Posting API di TikTok pubblica in pubblico solo da app approvate; da app non approvate i post escono privati. Niente pubblicazione completamente automatica.
- **Opzione A (scelta):** integrazione TikTok di Higgsfield (`tiktok_connect`, `tiktok_prepare_publish`). All'ora stabilita, un'attività programmata prepara il post: video caricato su Higgsfield (MP4 3–600 s, 23–60 fps) e didascalia. L'utente conferma con un tap nel modulo di pubblicazione.
- **Opzione B:** programmazione nativa di TikTok Studio da computer, fino a 10 giorni in anticipo, con un pacchetto già diviso per giorno.
- **Materiale pronto:** `scripts/content-grid/tiktok/*.mp4`, didascalie nella sezione TikTok del README.
