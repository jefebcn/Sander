# Video promo SANDER

`out/sander-promo.mp4`: 20,5 secondi, 1080×1920, 60 fps, con effetti sonori (tocchi, passaggi, pop, match, chiusura) a volume moderato: la musica la metti sotto tu.
`out/sander-promo-senzatesto.mp4`: stesse scene senza scritte, con la fascia in alto libera per i tuoi testi.

| Tempo | Scena | Testo |
|---|---|---|
| 0–2,1s | Amici in spiaggia, 3 sagome + la quarta tratteggiata | «Siete in tre? Manca sempre uno.» |
| 2,1–5s | Il telefono entra al volo: mazzo di Scopri, tocco sul cuore | 1 · Scopri — «Chi gioca vicino a te» |
| 5–8,3s | Sale il pannello del like, il commento esce dallo schermo | 2 · Like — «Un cuore e due parole» |
| 8,3–10,75s | «È un match!» con colpo di zoom | 3 · Match — «Se ricambia, è match!» |
| 10,75–14,15s | Proponi giorno e bagno, la card della partita esce dallo schermo | 4 · Partita — «Giorno e bagno, in un tocco» |
| 14,15–17s | Lei tocca «Ci sto», «Partita creata» | 5 · Fatto — «"Ci sto" e si gioca» |
| 17,15–20,5s | Logo, Gabbo, invito | «Sabato si gioca.» · Gratis · sanderbv.it |

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
