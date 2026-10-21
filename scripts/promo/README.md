# Video promo SANDER

`out/sander-promo.mp4`: 27 secondi, 1080×1920, 30 fps, senza musica (il suono si sceglie dentro TikTok o Instagram).
`out/sander-promo-senzatesto.mp4`: stesse scene senza scritte, con la fascia in alto libera per i tuoi testi.

| Tempo | Scena | Testo |
|---|---|---|
| 0–3s | Amici in spiaggia, 3 sagome + la quarta tratteggiata | «Siete in tre? Manca sempre uno.» |
| 3–7,6s | Mazzo di Scopri | 1 · Scopri — «Chi gioca vicino a te» |
| 7,6–12s | Like su una risposta con commento | 2 · Like — «Un cuore e due parole» |
| 12–15,4s | «È un match!» | 3 · Match — «Se ricambia, è match!» |
| 15,4–20,2s | Proponi giorno e bagno, proposta inviata | 4 · Partita — «Giorno e bagno, in un tocco» |
| 20,2–23,7s | Lei tocca «Ci sto», partita creata | 5 · Fatto — «"Ci sto" e si gioca» |
| 24–27s | Logo, Gabbo, invito | «Sabato si gioca.» · Gratis · sanderbv.it |

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
