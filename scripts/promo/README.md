# Video promo SANDER

`out/sander-promo.mp4`: circa 20 secondi, 1080×1920, 60 fps, con effetti sonori (tocchi, passaggi, pop, match, chiusura) a -16 LUFS.

La timeline è scritta a 120 BPM e riprodotta il 6% più veloce (`SPEED` in `gen.mjs`): circa **127 BPM**. Un solo punto di attenzione alla volta (schermata → titolo → tocco → freccia → passaggio), ogni titolo resta fermo abbastanza da leggerlo, nessuna pulsazione a tempo. Telefono e camera si muovono con una molla smorzata («glide», senza rimbalzo) e un accenno di effetto mosso; le schermate scorrono con la curva «smooth»; solo Gabbo e le card che escono hanno un piccolo rimbalzo.

I tempi nella tabella sono quelli della timeline: dividili per 1,06 per i secondi reali.
`out/sander-promo-senzatesto.mp4`: stesse scene senza scritte, con la fascia in alto libera per i tuoi testi.

| Tempo | Scena | Testo |
|---|---|---|
| 0–2s | La chat del gruppo, una bolla per battito («Chi gioca sabato?», «io forse», «dipende dal meteo», «siamo in tre…») | «Manca sempre uno.» + sagoma tratteggiata |
| 2–5s | Il telefono entra al volo: mazzo di Scopri, tocco sul cuore | 1 · Scopri — «Chi gioca vicino a te» |
| 5–8s | Sale il pannello del like, il commento esce dallo schermo | 2 · Like — «Un cuore e due parole» |
| 8–10,5s | «È un match!» con colpo di zoom | 3 · Match — «Se ricambia, è match!» |
| 10,5–14,5s | Proponi giorno e bagno, la card della partita esce dallo schermo | 4 · Partita — «Giorno e bagno, in un tocco» |
| 14,5–18s | Lei tocca «Ci sto», «Partita creata» | 5 · Fatto — «"Ci sto" e si gioca» |
| 18–21s | Logo, Gabbo, invito | «Sabato si gioca.» · Gratis · sanderbv.it |

Le schermate si muovono come l'app: le pagine nuove entrano di lato, i pannelli salgono dal basso. Tra una scena e l'altra il telefono attraversa lo schermo (con effetto mosso), nei tre cambi di titolo una freccia lime parte da ciò che viene toccato, gira lungo il bordo destro (mai sopra le schermate) e arriva dove compare il titolo nuovo, i dettagli importanti (commento, proposta, «Partita creata») escono dal telefono collegati da una linea, e a sinistra un percorso 1→5 si riempie.

Le scritte stanno nella fascia alta: niente sotto i 1500 px né sul lato destro, dove TikTok e Instagram mettono pulsanti e didascalia.

## Rifarlo

1. App in locale con i profili demo, poi le schermate (`shots/`):
   `EMAIL=… EMAIL2=… node scripts/promo/shots.mjs` (chi mette like, chi risponde alla proposta; la seconda persona deve aver già messo like alla prima).
2. Il video: `FFMPEG=/percorso/ffmpeg node scripts/promo/gen.mjs` (aggiungi `--no-text` per la versione senza scritte).

Didascalia consigliata:
```
Siete in tre? 🏐 Su SANDER trovi il quarto: chi gioca vicino a te, un like con due parole, match e la partita si crea da sola.
Gratis · link in bio
#beachvolley #rivieraromagnola #rimini #riccione #sander
```
Per le sponsorizzate usa il link `sanderbv.it/scopri?ref=ig_ads`.

## Regole seguite (skill reel-studio + video-editing)

- Tutti i testi, le frecce e le card stanno in x 60–960, y 250–1600 (zone sicure di Reels/TikTok) e non si toccano mai: verificato fotogramma per fotogramma con `AT=… node scripts/promo/gen.mjs`.
- Gancio sul problema (la chat che non si riempie) prima della soluzione; titoli che entrano sfocati e vanno a fuoco sul battito; dietro il telefono la schermata stessa, ingrandita e scurita.
- Audio normalizzato a -16 LUFS (true peak -1,5 dB), il livello dei social.

