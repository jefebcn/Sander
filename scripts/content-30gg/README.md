# Piano contenuti — 30 giorni

Batch di 30 post social (Instagram + TikTok/Reels) per SANDER, generato con
l'agente `social-dink` (stile @dinkbeachvolley adattato al brand: dark + lime).

## Contenuto
- **`posts.json`** — i 30 post strutturati (rubrica, gancio, didascalia, audio, come si fa, slide dei caroselli). È la fonte dati.
- **`calendario.html`** — il piano editoriale navigabile (5 settimane, didascalie da copiare). Apribile nel browser.
- **`carousels/`** — i 54 PNG (1080×1920) dei 9 caroselli già renderizzati, pronti da postare.

## Rubriche (rotazione settimanale)
Lun Re dei Bagni · Mar Meme · Mer Skill/clip · Gio Carta giocatore · Ven POV/hot-take · Sab Live dai campi · Dom UGC/community.

## Rigenerare
```bash
# calendario.html dai post
node scripts/content-30gg/gen-calendar.mjs

# HTML dei caroselli dai post
node scripts/content-30gg/render-carousels.mjs
# poi i PNG con Chromium headless:
cd scripts/content-30gg/carousels
for f in *.html; do
  /opt/pw-browsers/chromium-*/chrome-linux/chrome --headless --no-sandbox --disable-gpu \
    --hide-scrollbars --force-device-scale-factor=1 --window-size=1080,1920 \
    --screenshot="${f%.html}.png" "file://$PWD/$f"
done
```

## Come si usa
Carica caroselli + didascalie in un programmatore gratuito (**Metricool** consigliato) e imposta
la pubblicazione automatica. Per i reel/clip: filma la scena descritta in "Come si fa", monta,
incolla la didascalia. Batch una volta → coperto un mese.
