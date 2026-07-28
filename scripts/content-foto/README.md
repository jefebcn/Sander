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
