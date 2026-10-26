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

Scarta e rigenera se ci sono scarpe o calzini, loghi o scritte sui vestiti, alcol, o se la persona è diversa tra due foto della stessa serie.
