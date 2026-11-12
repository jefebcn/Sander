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
  - card scura con numeri lime (liste, "come funziona"): **solo dentro un carosello, mai come prima immagine o come storia/post singolo**. Da sola o in copertina non rispetta i colori del progetto: lì si usa la card lime o una foto.
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
| `gruppo-sera` | TikTok 4 nov (carosello Scopri, 3) · storia App Store (La partita in tasca) — **esaurita** |
| `battuta-ombrelloni` | IG 14 nov (Ci sei davvero?) |
| `piedi-corsa` | TikTok 14 nov (Coppie, 1) |
| `alzata-notte` | IG 17 nov (La giornata tipo) |
| `schiacciata-tramonto` | TikTok 19 nov (Foto verificata, 1) · post fissato App Store (Il beach volley ha la sua app) — **esaurita** |
| `batti-cinque` | IG 22 nov (Rigiocheresti) |
| `bagher-notte` | IG 24 nov (Chi porta il pallone?) |

Già esaurite, non riusarle: le foto del pacchetto Stagione 2 (coppia con la maglia 23, ragazza in viola, corsa sfocata verde, alzata sotto la rete, gambe in corsa) e il palo della rete (2 usi: IG 30 ott, 7 nov).

## Regola: niente temi o testi ripetuti

Oltre alle foto, non si ripetono titoli, temi e frasi delle didascalie, tra Instagram e TikTok insieme. Prima di programmare, scarica da Buffer i contenuti già usciti e in coda e controlla l'elenco qui sotto: un tema già fatto si può riprendere solo con un'angolazione nuova e un titolo diverso. Niente alcol nemmeno nei testi e negli sticker.

Temi già usati (fino al 24 nov 2026): Stagione 1 e Stagione 2 · Come funziona / In tre tocchi / Entra in 1 minuto / Gioca e sali · Trova con chi giocare / Scopri · Manca sempre il quarto / Manca sempre uno (serie) · Proponi una partita · Libero oggi · Porta un amico · Livelli · Novità di novembre · Sander Club 2v2 · Si gioca anche a novembre · Gioca fino al tramonto · La prossima palla è tua · A piedi nudi / dress code zero scarpe · Tornei SANDER · 21-19 · La giornata tipo · Classifica pulita (fair play) · Presenze verificate · Coppie 2v2 · Foto verificata · Kit del sabato · Rigiocheresti · La chat della partita · App su App Store e Google Play (storie: È ufficiale / La partita in tasca / Scaricala, è gratis; post fissato `post-app.mjs`: Il beach volley ha la sua app / Dentro l'app / Gratis, su iPhone e Android).
