# Sander — App Store Setup Guide

## Prerequisiti (sul tuo Mac)
- Xcode 15+ installato
- Node.js 18+
- Account Apple Developer attivo (99€/anno)

---

## 1. Prima installazione (una volta sola)

```bash
# Clona il repo e installa dipendenze
git clone <repo-url>
cd Sander
npm install

# Aggiunge la cartella ios/ al progetto
npm run cap:add:ios

# Aggiunge la cartella android/ (opzionale)
npm run cap:add:android

# Sincronizza configurazione
npm run cap:sync
```

---

## 2. Icone richieste da Apple

Nella cartella `ios/App/App/Assets.xcassets/AppIcon.appiconset/` servono:

| Dimensione | Nome file |
|-----------|-----------|
| 1024×1024 | AppIcon-1024.png |
| 180×180   | AppIcon-60@3x.png |
| 120×120   | AppIcon-60@2x.png |
| 87×87     | AppIcon-29@3x.png |
| 58×58     | AppIcon-29@2x.png |
| 80×80     | AppIcon-40@2x.png |
| 120×120   | AppIcon-40@3x.png |

**Tool gratuito:** https://appicon.co — carica il file `public/icon-512.png` e genera tutto automaticamente.

---

## 3. Splash screen

- Crea immagine 2732×2732px sfondo `#07090a` con logo Sander centrato
- Inseriscila in `ios/App/App/Assets.xcassets/Splash.imageset/`

---

## 4. Apri in Xcode e configura

```bash
npm run cap:ios
```

In Xcode:
1. **Signing & Capabilities** → seleziona il tuo Apple Developer Team
2. **Bundle Identifier** → `com.sanderbv.app`
3. **Version** → `1.0.0`, **Build** → `1`
4. **Display Name** → `Sander`

---

## 5. Informazioni App Store Connect

**Nome app:** Sander - Beach Volley  
**Sottotitolo:** Tornei e sessioni di beach volley  
**Categoria primaria:** Sports  
**Età:** 4+  
**Privacy:** non raccoglie dati di terze parti  

**Descrizione (IT):**
```
Sander è l'app per gestire tornei e sessioni di beach volley.
Organizza partite, segui le classifiche Glicko-2 in tempo reale,
iscriviti ai tornei e tieni traccia delle tue statistiche personali.
```

**Keywords:** beach volley, torneo, pallavolo, classifica, sessione, sport

---

## 6. Screenshots richiesti (iPhone 6.7")

Schermate da fare (usa iPhone o Simulator):
1. Home page / lista sessioni
2. Profilo giocatore con SanderCard
3. Torneo in corso con bracket/standings
4. Classifica giocatori

---

## 7. Submit

```bash
# In Xcode: Product → Archive → Distribute App → App Store Connect
```

Oppure usa **Transporter** (app gratuita su Mac App Store).

---

## 8. Aggiornamenti futuri

Per ogni modifica al codice:
```bash
git push  # → Vercel fa deploy automatico → app aggiornata live
```

Per modifiche native (icona, permessi):
```bash
npm run cap:sync
# poi rebuild in Xcode e nuovo submit
```
