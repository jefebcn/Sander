# SANDER — Prompt Instagram v2 (sistema a 5 direzioni)

Formato di tutti i post: **3:4 verticale, 1080×1440 px**.

## Come si usa

1. Incolla **una volta** il `BLOCCO BRAND` in una nuova chat ChatGPT.
2. Poi incolla il prompt della direzione che ti serve.
3. Per generare il post successivo nella stessa chat basta scrivere: *"stesso stile, cambia il testo in: ..."*.

**Regole d'oro per non far uscire testo storto**
- Mai piu di **5 parole** di testo dentro l'immagine.
- Mai apostrofi o accenti nel testo (`e` invece di `è`, `oggi si gioca` invece di `l'estate`).
- Tutto in MAIUSCOLO.
- Chiudere sempre con: *nessun altro testo, nessun watermark, nessun logo.*
- Se il testo esce sbagliato due volte: chiedi l'immagine **senza testo** e me la mandi, il testo lo metto io renderizzato dal codice (esatto al pixel).

---

## BLOCCO BRAND — incollalo per primo

```
Sei il direttore artistico di SANDER, l'app della community di beach volley della
Riviera Romagnola (Rimini, Riccione, Cervia, Cesenatico, Misano, Cattolica).
Non e un brand di moda: e uno strumento che serve a trovare partite, segnare i
punteggi e scalare le classifiche del proprio comune.

IDENTITA VISIVA — da rispettare in ogni immagine, senza eccezioni:
- Fondo nero profondo: #07090a. Superfici scure: #0d100d.
- Colore accento unico: verde lime neon #c9f31d. Si usa POCO: una parola, un
  numero, una linea. Mai grandi aree piene di lime.
- Secondario, solo se serve: azzurro cielo #00b4f0.
- Testo bianco puro #ffffff.
- Tipografia: un solo font sans-serif CONDENSED, bold, tutto MAIUSCOLO
  (tipo Archivo Condensed / Anton / Oswald). Niente serif, niente corsivo,
  niente font decorativi, niente script.
- Zero gradienti arcobaleno, zero effetti vetro, zero cornici barocche,
  zero emoji, zero stelline, zero bagliori.
- Estetica: sportiva, sporca di sabbia, vera. Luce di tardo pomeriggio sul mare
  Adriatico. NON estetica moda, NON estetica lusso, NON render 3D lucido.

FORMATO: sempre 3:4 verticale, 1080x1440 px.

Non generare nulla finche non ti mando il prompt del singolo post.
```

---

# DIREZIONE 1 — Foto full-bleed + una frase
*Riferimenti: @volleyballworld, @beachprotour*
**Uso:** annunci partite, hype, identita, apertura di settimana.

```
Post SANDER, Direzione 1 — "foto full-bleed".

Fotografia sportiva realistica a tutto formato, 3:4 verticale 1080x1440.
Soggetto: un giocatore di beach volley in schiacciata, silhouette controluce
contro il cielo di un tardo pomeriggio sull'Adriatico. Sabbia che schizza.
Colori naturali e desaturati, contrasto alto, grana fotografica leggera.
Composizione: il soggetto occupa la META SUPERIORE dell'immagine; la meta
inferiore e cielo e sabbia in ombra, volutamente VUOTA e scura.

Sopra la foto, un velo nero sfumato dal basso (dal 45% di altezza fino al
bordo inferiore) per far respirare il testo.

Testo, nella zona vuota in basso a sinistra, allineato a sinistra,
sans-serif condensed bold tutto maiuscolo, due righe:
riga 1 bianca #ffffff: "OGGI SI GIOCA"
riga 2 in verde lime #c9f31d, stessa dimensione: "A RICCIONE"

La riga 1 e la riga 2 hanno la stessa altezza di carattere, interlinea molto
stretta, il blocco di testo occupa circa il 40% della larghezza.
Niente box, niente cornice, niente sottolineature: il testo poggia diretto
sulla foto.

Nessun altro testo, nessun watermark, nessun logo, nessun numero.
```

**Varianti testo** (cambia solo le due righe, il resto resta identico):
| riga 1 (bianco) | riga 2 (lime) |
| --- | --- |
| `OGGI SI GIOCA` | `A RICCIONE` |
| `TROVA LA PARTITA` | `IN 3 TAP` |
| `NON SERVE LA SQUADRA` | `SERVE SANDER` |
| `IL CAMPO E LI` | `MANCHI TU` |
| `SEI 4 A RICCIONE` | `PUOI FARE MEGLIO` |

---

# DIREZIONE 2 — Card dati, numero gigante
*Riferimenti: @strava, @whoop*
**Uso:** classifiche, statistiche, milestone, "lo sapevi che".

```
Post SANDER, Direzione 2 — "card dati".

Grafica editoriale piatta (NON una fotografia), 3:4 verticale 1080x1440.
Fondo pieno nero #07090a con una texture di sabbia appena percettibile,
molto scura, quasi invisibile.

Al centro geometrico, un numero gigantesco in verde lime neon #c9f31d,
sans-serif condensed bold: "147"
Il numero occupa circa il 55% della larghezza dell'immagine ed e l'unico
elemento luminoso della composizione.

Subito sotto il numero, centrata, una riga di testo bianco #ffffff
sans-serif condensed maiuscolo, dimensione circa un decimo del numero:
"PARTITE IN RIVIERA QUESTA SETTIMANA"
mandata a capo su due righe brevi, interlinea stretta.

In alto, centrata, una riga piccolissima grigia #a3a3a3, maiuscola,
con spaziatura tra le lettere molto ampia: "SANDER"

Una linea orizzontale sottile verde lime, larga solo il 15% dell'immagine,
tra la scritta in alto e il numero.

Composizione simmetrica, molto aria, niente icone, niente illustrazioni,
niente grafici, niente cornici.
Nessun altro testo, nessun watermark.
```

**Varianti testo:**
| numero | didascalia sotto |
| --- | --- |
| `147` | `PARTITE IN RIVIERA QUESTA SETTIMANA` |
| `9` | `COMUNI CON LA LORO CLASSIFICA` |
| `1680` | `IL RATING DEL PRIMO IN CLASSIFICA` |
| `3` | `TAP PER TROVARE UNA PARTITA` |
| `26` | `IL BAGNO PIU GIOCATO DELLA RIVIERA` |

---

# DIREZIONE 4 — Prodotto / schermata vera
*Riferimento: Playtomic (design system di Erretres)*
**Uso:** annunciare le novita (selettore comune, disponibilita, lista d'attesa).

> **Attenzione:** ChatGPT non sa disegnare la TUA schermata. Non chiedergli di
> inventarla, esce finta e con testo inventato. Gli chiedi solo lo **sfondo con
> lo spazio vuoto**, poi ci incolli sopra lo screenshot reale (Canva, Figma, o
> lo faccio io).

```
Post SANDER, Direzione 4 — "sfondo per mockup prodotto".

Grafica di sfondo, 3:4 verticale 1080x1440. NESSUN TESTO, NESSUN TELEFONO,
NESSUNA INTERFACCIA: solo lo sfondo.

Fondo nero #07090a. Dal basso, un alone diffuso molto morbido di verde lime
#c9f31d a bassissima opacita (max 15%), come una luce dietro un oggetto che
non si vede. Sopra, granulosita finissima tipo sabbia.

Al centro dell'immagine deve restare un'area verticale completamente pulita e
scura, di proporzione 9:19 circa (la forma di uno schermo di telefono), alta
circa il 65% dell'immagine, dove verra incollato uno screenshot in seguito.
Intorno a quest'area, ombra morbida per staccarla dal fondo.

Nella parte superiore, spazio vuoto per un titolo su due righe.
Non scrivere niente. Nessun testo, nessun watermark, nessun logo,
nessun mockup di dispositivo.
```

Titolo da mettere sopra a mano (bianco condensed + una parola lime):

- `ORA SCEGLI` / **`IL TUO COMUNE`**
- `DICI QUANDO GIOCHI` / **`TI TROVIAMO NOI`**
- `CAMPO PIENO?` / **`ENTRI IN LISTA`**

---

# DIREZIONE 5 — Meme, foto reale + battuta
*Riferimento: @dinkbeachvolley*
**Uso:** reach, salvataggi, condivisioni. E il formato che porta gente nuova.

> Questo funziona solo con **foto vere**. Carica la tua foto in ChatGPT e usa
> questo prompt di editing, non di generazione.

```
Ti allego una fotografia reale di beach volley.
Non rigenerarla e non modificare il soggetto: usala cosi com'e.

Ritagliala a 3:4 verticale 1080x1440, tenendo il soggetto nella parte alta.
Aggiungi un velo nero sfumato solo sul terzo inferiore.

Nel terzo inferiore, testo bianco #ffffff sans-serif condensed bold
tutto maiuscolo, centrato, su due righe, interlinea stretta:
"QUANDO DICI CHE E FUORI
E TUTTI GUARDANO TE"

Nient'altro: nessuna cornice, nessun bordo, nessuna barra colorata,
nessun watermark, nessun logo, nessuna emoji.
```

**Battute pronte** (gia validate sui 5 meme che hai approvato):
- `QUANDO DICI CHE E FUORI / E TUTTI GUARDANO TE`
- `ULTIMA PARTITA / DETTO 4 PARTITE FA`
- `LA SABBIA ENTRA DOVE / NON DOVREBBE ENTRARE`
- `PARTITA ALLE 8 DI MATTINA / IDEA DI IERI SERA`
- `PUNTO NEGATO / AMICIZIA FINITA`

---

# DIREZIONE 3 — SanderCard
*Riferimento: card FIFA Ultimate Team*

**Questa NON si fa con ChatGPT.** La card esiste gia dentro l'app
(`src/components/player/SanderCard.tsx`): la generi vera, con rating e nome
reali, e fai lo screenshot. Un'imitazione fatta da un generatore avrebbe numeri
inventati e non sarebbe il tuo prodotto.

Se vuoi il post, serve solo lo **sfondo**: usa il prompt della Direzione 4
(cambiando la proporzione dell'area pulita in 3:4 invece di 9:19) e ci incolli
sopra la card.

---

# Calendario di rotazione

| | Lunedi | Mercoledi | Venerdi |
| --- | --- | --- | --- |
| **ogni settimana** | Direzione 1 | Direzione 2 o 3 | Direzione 5 |

La Direzione 4 si inserisce ogni volta che esce una funzionalita nuova,
al posto del mercoledi.

Il filo conduttore non e il layout: e **fondo nero + lime solo sull'accento +
un solo font condensed maiuscolo**. Quella e l'identita. Le forme cambiano,
quelle tre cose no.
