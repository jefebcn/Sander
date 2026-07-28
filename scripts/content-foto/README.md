# Caroselli foto — hook visivo con foto reali

7 caroselli social costruiti su **foto reali di beach volley**, pensati per fermare lo scroll
già dalla prima slide. Sostituiscono i vecchi caroselli piatti (solo testo su sfondo scuro),
che non agganciavano l'utente.

## Perché così
- **Cover con foto full-bleed**: la slide 1 fa ~80% del lavoro. Immagine forte → l'utente si ferma.
- **Titolo nello spazio vuoto della foto**: il testo non copre mai il soggetto (a volte alto, a volte basso).
- **Marchio SANDER in alto a sinistra**: zona sempre libera, non disturba il soggetto.
- **Slide interne dark + lime**: il messaggio, pulito e coerente col brand.
- **Ultima slide = CTA** ("Scarica gratis 🏐 · sanderbv.it").

## Due formati, già pronti
| Cartella | Ratio | Uso |
|----------|-------|-----|
| `instagram/` | **4:5** (1080×1350) | feed Instagram (carosello) |
| `tiktok/`    | **9:16** (1080×1920) | TikTok / Reels / Storie |

La versione TikTok è studiata con **zona sicura**: didascalia, @utente e rail dei pulsanti di TikTok
non coprono mai testo o soggetto (il marchio sta in alto-sx, il titolo resta sopra la fascia bassa).

## I 7 caroselli
`re` Re dei Bagni · `carta` Carta giocatore · `trova` Trova partita · `wa` Basta WhatsApp ·
`stag` Stagioni · `cop` Conta con chi giochi · `ht` Il rating non mente.

Ogni carosello = 5 slide: `{nome}-01` (cover) → `{nome}-05` (CTA).

## Come si pubblica
1. Apri `didascalie.md`, copia la didascalia del carosello.
2. Carica le 5 slide (in ordine) da `instagram/` o `tiktok/` nel programmatore (es. **Metricool**).
3. Incolla la didascalia, imposta data/ora, pubblica.

## Meme / hot-take (`meme/`)
Post pronti (solo testo, dark+lime) per i giorni "meme" del calendario, in `meme/instagram/` (4:5)
e `meme/tiktok/` (9:16): `meme-punti · meme-wa · meme-rating · meme-vs`.

## Overlay per i reel (`reel-overlay/`)
PNG **9:16 trasparenti** col testo-gancio, da trascinare **sopra la tua clip** in CapCut/InShot.
Sono nominati per data del calendario:

| File | Reel del | Testo |
|------|----------|-------|
| `rl-04ago.png` | 4 ago | POV: la schiacciata che chiude il set. |
| `rl-07ago.png` | 7 ago | Il tramonto, la sabbia, la partita. Serve altro? |
| `rl-11ago.png` | 11 ago | Quando trovi il compagno giusto al primo scambio. |
| `rl-14ago.png` | 14 ago | Una domenica qualsiasi in Riviera. |
| `rl-15ago.png` | 15 ago (Ferragosto) | Buon Ferragosto. Il campo è pieno? 🔥 |
| `rl-18ago.png` | 18 ago | Il meglio della settimana in 15 secondi. |
| `rl-21ago.png` | 21 ago | Rallenta. Guarda la traiettoria. Questo è beach. |
| `rl-25ago.png` | 25 ago | La sensazione dopo il punto che vale il set. |
| `rl-28ago.png` | 28 ago | Weekend = campo. Punto. |
| `rl-01set.png` | 1 set | 30 giorni di beach. Il prossimo lo giochi con noi? |

Il video resta la **tua clip** (`public/videos/`): metti l'overlay sopra, aggiungi la didascalia dal calendario, pubblica.

## Foto → carosello
Le foto reali stanno in `public/`. Mappatura:

| Carosello | Foto |
|-----------|------|
| `re`    | spike in controluce al tramonto |
| `carta` | giocatrice a rete con occhiali |
| `trova` | pallone sulla sabbia al tramonto |
| `wa`    | spiaggia ampia con campo in lontananza |
| `stag`  | schiacciata in salto al tramonto |
| `cop`   | giocatrice a rete, cielo azzurro |
| `ht`    | pallone in bianco e nero sul bagnasciuga |

Servono più foto per estendere il piano a 30 giorni con lo stesso stile.
