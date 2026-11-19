# Ricette SANDER (lavori che si ripetono)

COSA | comando o script | trappole | la prossima volta

Import FIPAV | `cd scripts/content-instagram && node fipav/import.mjs` | se FIPAV risponde 403 fermarsi; se mancano alcuni file di dettaglio, ci riprova il giorno dopo | se l'esito è ok non serve avvisare Alex

Giro Instagram A o B | skill `sander-instagram` e poi `run.sh` nel kit | Buffer tiene al massimo 10 post in coda; salta i giorni che hanno già un post dello stesso tipo | i formati sono in `formats.mjs`, l'abbinamento funzione → copertina è `FEATURE_COVER` in `plan.mjs`

Reel da un video di altri | ffmpeg: scala e ritaglia a 1080×1920; PNG trasparente con il gancio da 0 a 3 s con dissolvenza; xfade sulla schermata finale; audio originale con afade | zone sicure dei reel: in alto 270 px, in basso dal pixel 1248; la griglia del profilo taglia a 3:4 (y da 240 a 1680); il testo lime sopra la rete gialla non si legge, serve un gradiente scuro sotto | prima serve il permesso dell'autore; su Buffer: `assets:[{video:{url,metadata:{thumbnailOffset:500}}}]` con `metadata.instagram {type:"reel", shouldShareToFeed:true}`

Caricare file per Buffer | Higgsfield: `media_upload`, poi curl PUT (con `If-None-Match: *` per zip e video), poi `media_confirm` | il risultato di `media_upload` non contiene il nome del file: abbinare i file per ordine; se il PUT dà 520, riprovare | —

Spostare o cambiare un post Buffer | `editPost(input:{id, text})` per il testo, `editPost(input:{id, mode:"customScheduled", dueAt})` per la data, `deletePost(input:{id})` per cancellare | — | —

Lanciare l'app in locale con Postgres | `pg_ctl -l /var/tmp/pg5544/log` | con `-l` serve il percorso di un file, non di una cartella | —
