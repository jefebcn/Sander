# Storie Instagram SANDER

Stile approvato a ottobre 2026: le prossime storie partono da qui.

```
CHROME=… node scripts/content-storie/gen.mjs [nome…]
```

Output in `out/` (non versionato). Ogni storia è un blocco HTML in `gen.mjs`:
per farne una nuova copia la più simile e cambia testo e sfondo.

## Stile

- **Formato**: 1080×1920, JPG. Niente sticker: così si possono programmare su Buffer.
- **Zona sicura**: niente di importante sopra i 270 px (barra di Instagram) né sotto i 380 px (risposta).
- **Tre fondi, da alternare** per non ripetersi:
  - foto pellicola con sfumatura scura in alto e in basso (`.shade`);
  - card lime `#c6f736` con testo nero;
  - card scura con numeri lime (liste, "come funziona").
- **Titoli**: Gochi Hand, grandi, bianco + una parola o una riga in lime. Sulle foto vanno nel cielo o nel vuoto, mai sopra i volti.
- **Etichette**: Inter maiuscolo spaziato in alto (es. STAGIONE 2 · RIVIERA · GRATIS), pillola con bordo per la frase breve.
- **Chiusura**: icona dell'app (`public/icon-512.png`) + `sanderbv.it` in Gochi Hand + "LINK IN BIO".

## Sfondi

In `bg/`, generati con Higgsfield `soul_2`, 9:16, qualità 1.5k. Modello di prompt:

> 35mm film photo, [scena: stagione, ora del giorno, Riviera/Adriatico], young friends playing beach volleyball barefoot on the sand, candid, grainy film, slight motion blur, plain clothing without logos, no text, no brands

Scarta e rigenera se ci sono scarpe o calzini, loghi o scritte sui vestiti, alcol, torso nudo o pose da modella, o se la persona è diversa tra due foto della stessa serie.

## Regola: massimo due usi per foto

Vale per storie, post e caroselli, su Instagram e TikTok insieme. La stessa foto di sfondo si usa al massimo due volte, anche se il testo sopra cambia. Al terzo uso genera un nuovo stock (stesso stile) e rifai la grafica con la foto nuova. Prima di programmare su Buffer, controlla qui e aggiorna il registro.

| Foto | Usi |
|------|-----|
| `novembre-felpe` | storia 27 ott |
| `tramonto-coppia` | storia 5 nov |
| `palla-sabbia` | storia 8 nov |
| `tuffo-sera` | TikTok 4 nov (carosello Scopri, 1) |
| `gruppo-sera` | TikTok 4 nov (carosello Scopri, 3) |
| `schiacciata-tramonto` | IG 14 nov (Libero oggi) |
| `alzata-notte` | IG 17 nov (La giornata tipo) |
| `batti-cinque` | IG 22 nov (Scopri 2v2) |
| `bagher-notte` | IG 24 nov (Sander) |
| `piedi-corsa` | libera |
| `battuta-ombrelloni` | libera |

Già esaurite, non riusarle: le foto del pacchetto Stagione 2 (coppia con la maglia 23, ragazza in viola, corsa sfocata verde, alzata sotto la rete) e il palo della rete (2 usi: IG 30 ott, 7 nov).
