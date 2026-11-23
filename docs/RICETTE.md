# Ricette SANDER (lavori che si ripetono)

COSA | comando o script | trappole | la prossima volta

Import FIPAV | `cd scripts/content-instagram && node fipav/import.mjs` | se FIPAV risponde 403 fermarsi; se mancano alcuni file di dettaglio, ci riprova il giorno dopo | se l'esito è ok non serve avvisare Alex

Ricarica Buffer (ogni sera 21:13) | skill `sander-instagram`: `bash refill.sh`, poi `bash run.sh A|B <lunedì>` per ogni riga stampata | parte solo con almeno 4 posti liberi su 10; `fresh.mjs` scarta varianti già uscite (storico Buffer), con liste finite scrivere varianti nuove in `work/extra-content.json`; senza foto nuove lo slot esce senza foto (`needs.json`) | post sempre 12:00, storie 12:30; Playwright va lanciato con `executablePath: "/opt/pw-browsers/chromium"`

Reel da un video di altri | ffmpeg: scala e ritaglia a 1080×1920; PNG trasparente con il gancio da 0 a 3 s con dissolvenza; xfade sulla schermata finale; audio originale con afade | zone sicure dei reel: in alto 270 px, in basso dal pixel 1248; la griglia del profilo taglia a 3:4 (y da 240 a 1680); il testo lime sopra la rete gialla non si legge, serve un gradiente scuro sotto | prima serve il permesso dell'autore; su Buffer: `assets:[{video:{url,metadata:{thumbnailOffset:500}}}]` con `metadata.instagram {type:"reel", shouldShareToFeed:true}`

Caricare file per Buffer | Higgsfield: `media_upload`, poi curl PUT (con `If-None-Match: *` per zip e video), poi `media_confirm` | il risultato di `media_upload` non contiene il nome del file: abbinare i file per ordine; se il PUT dà 520, riprovare | —

Spostare o cambiare un post Buffer | `editPost(input:{id, text})` per il testo, `editPost(input:{id, mode:"customScheduled", dueAt})` per la data, `deletePost(input:{id})` per cancellare | — | —

Lanciare l'app in locale con Postgres | `pg_ctl -l /var/tmp/pg5544/log` | con `-l` serve il percorso di un file, non di una cartella | —

Build Android per Play (sul PC di Alex) | in `android/`: `$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"`, `$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"`, `.\gradlew bundleRelease` → `app/build/outputs/bundle/release/app-release.aab` | alzare sempre `versionCode` in `app/build.gradle` (un Pull o Discard di GitHub Desktop lo può riportare indietro); R8 attivo | prima di agire sul PC dire cosa si fa e chiedere conferma
