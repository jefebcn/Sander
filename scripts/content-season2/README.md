# Stagione 2 · rilancio Instagram

Stesso stile della griglia (`scripts/content-grid`): foto mosse effetto pellicola,
pennarello, lime SANDER, piccole info negli angoli. Niente sfondi grigi: le pagine
di solo testo stanno su una foto di spiaggia sfocata e scurita, oppure sul lime.

```bash
CHROME=/opt/pw-browsers/chromium-1194/chrome-linux/chrome node scripts/content-season2/gen.mjs
python3 scripts/content-season2/pack.py /percorso/SANDER-pubblicazione   # Instagram in ordine di pubblicazione, una cartella per giorno
python3 scripts/content-season2/pack.py /percorso/SANDER-tiktok tiktok          # TikTok, stessi giorni
```

| Cartella | Cosa | Formato |
|---|---|---|
| `out/carosello/` | 6 slide del post di lancio | 1080×1350 |
| `out/copertine/` | 4 copertine delle storie in evidenza | 1080×1920 (Instagram ritaglia il cerchio centrale) |
| `out/storie/` | 9 storie da mettere in evidenza | 1080×1920 |

---

## 1 · Profilo

**Bio**
```
Il beach volley della Riviera Romagnola 🏐
Trova con chi giocare, tornei e classifica del tuo comune
Gratis su app e sito 👇
```
**Link:** `sanderbv.it/?ref=ig_bio` · **Categoria:** App · **Pulsante:** "Iscriviti"

## 2 · Pulizia prima del lancio

1. Archivia (non eliminare) i 4 vecchi post con le figure generate.
2. Pubblica le 9 storie e crea le 4 storie in evidenza (sotto).
3. Pubblica il carosello. Fissalo in alto (Fissa sul profilo).
4. Nei giorni dopo, continua con la griglia `scripts/content-grid` (un post la sera, 18–21).

## 3 · Carosello "Stagione 2"

Ordine: `01-stagione-2` → `02-stagione-1` → `03-scopri` → `04-novita` → `05-oltre-il-campo` → `06-entra`

**Didascalia**
```
Stagione 2 ☀️
La prima stagione ci ha dato il primo torneo, la prima classifica e un sacco di partite. Grazie a chi c'era.

Da oggi SANDER cambia:
🏐 Scopri: trova con chi giocare vicino a te
🤝 Proponi una partita: «Ci sto» e la partita si crea da sola
✅ Foto verificata con un selfie
☀️ Libero oggi: un tap e i tuoi match lo sanno

Si viene per giocare. Se poi nasce qualcosa, meglio ancora.
Gratis su sanderbv.it (link in bio)

#beachvolley #rivieraromagnola #rimini #riccione #cervia #beachvolleyitalia #2vs2 #sander
```
**Prima storia dopo il post:** ricondividi la slide 1 con lo sticker "Link" → `sanderbv.it/?ref=ig_story`.

## 4 · Storie in evidenza

| Evidenza | Copertina | Storie (in ordine) | Sticker consigliati |
|---|---|---|---|
| **Scopri** | `copertine/scopri` | `scopri-1`, `scopri-2`, `scopri-3` | Link su `scopri-3` → `sanderbv.it/?ref=ig_story` |
| **Tornei** | `copertine/tornei` | `tornei-1`, `tornei-2` | Sondaggio su `tornei-2`: "Ci sei al prossimo?" Sì / Forse |
| **Come funziona** | `copertine/come-funziona` | `come-1`, `come-2`, `come-3` | Link su `come-1` |
| **Stagione 1** | `copertine/stagione-1` | `stagione1-1` + le foto vere del torneo | Nessuno |

Nelle storie gli sticker vanno tra 250 px dall'alto e 340 px dal basso: lì i testi sono già lasciati liberi.

## 5 · Sponsorizzata

Parti quando ci sono 3–4 post nuovi in griglia, così chi arriva dal profilo trova contenuti.

**Obiettivo:** Traffico (verso il sito) o Interazione col profilo se vuoi follower.
**Contenuto:** il carosello (slide 1, 3, 6 le più forti) oppure un video `scripts/content-grid/out/tiktok/`.
**Link:** `https://www.sanderbv.it/?ref=ig_ads` (gli arrivi da questo link vengono contati come evento `landing` con `ref=ig_ads`).
**Pubblico:** 18–35 anni · Rimini, Riccione, Cervia + 25–30 km · interessi: beach volley, pallavolo, sport in spiaggia.
**Budget:** 5–10 € al giorno per 7 giorni. Dopo 3 giorni spegni la variante che rende meno.
**Posizionamenti:** Feed + Storie + Reels Instagram.

**Testi principali** (prova A/B/C)
```
A · Cerchi qualcuno per un 2v2? Su SANDER trovi chi gioca a beach volley vicino a te, proponi una partita e vi vedete in spiaggia. Gratis.
```
```
B · Stagione 2 è iniziata 🏐 Partite, tornei e classifica del tuo comune, tutto in un'app. Dalla Riviera Romagnola, gratis.
```
```
C · Manca sempre il quarto? Con SANDER lo trovi in un minuto: chi è libero oggi, vicino a te, al tuo livello.
```
**Titoli:** "Trova con chi giocare" · "Il beach volley della Riviera" · "Entra in campo, è gratis"
**Descrizione:** "Partite, tornei e classifica del tuo comune."
**Pulsante (CTA):** Iscriviti (oppure Scopri di più)

**Regole Meta da rispettare**
- Parla di sport: niente promesse di incontri o appuntamenti (gli annunci di dating richiedono un'approvazione a parte). La slide `05-oltre-il-campo` va bene nel post organico, non metterla nell'inserzione.
- Niente alcol (anche lo spritz della griglia resta fuori dalle inserzioni).
- Niente marchi di terzi nelle immagini: le foto generate sono già senza loghi.
- Testo sull'immagine corto: le slide del carosello vanno bene così.
