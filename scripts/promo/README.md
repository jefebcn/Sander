# Video promo SANDER

`out/sander-promo.mp4`: 19,5 secondi, 1080×1920, 60 fps, senza musica (il suono si sceglie dentro TikTok o Instagram).
`out/sander-promo-senzatesto.mp4`: stesse scene senza scritte, con la fascia in alto libera per i tuoi testi.

| Tempo | Scena | Testo |
|---|---|---|
| 0–2,1s | Amici in spiaggia, 3 sagome + la quarta tratteggiata | «Siete in tre? Manca sempre uno.» |
| 2,1–5s | Il telefono entra al volo: mazzo di Scopri | 1 · Scopri — «Chi gioca vicino a te» |
| 5–7,7s | Sale il pannello del like, commento | 2 · Like — «Un cuore e due parole» |
| 7,7–10s | «È un match!» con colpo di zoom | 3 · Match — «Se ricambia, è match!» |
| 10–13,4s | Proponi giorno e bagno, proposta inviata | 4 · Partita — «Giorno e bagno, in un tocco» |
| 13,4–16,4s | Lei tocca «Ci sto», partita creata | 5 · Fatto — «"Ci sto" e si gioca» |
| 16,5–19,5s | Logo, Gabbo, invito | «Sabato si gioca.» · Gratis · sanderbv.it |

Le schermate si muovono come l'app: le pagine nuove entrano di lato, i pannelli salgono dal basso. Tra una scena e l'altra il telefono attraversa lo schermo (con effetto mosso), una freccia lime parte da ciò che viene toccato e porta al titolo successivo, i dettagli importanti (commento, proposta, «Partita creata») escono dal telefono collegati da una linea, e a sinistra un percorso 1→5 si riempie.

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
