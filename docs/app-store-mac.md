# Pubblicare SANDER sull'App Store dal Mac — passo passo

Per chi usa il Mac. Tempo totale: **una sessione di 4-6 ore** (metà è attesa di download), più **1-2 ore** un altro giorno se Apple chiede modifiche native. Le modifiche al sito non servono il Mac: l'app carica sanderbv.it.

## Prima di iniziare (senza Mac)

- [ ] Account **Apple Developer** attivo (99 €/anno), a nome di chi pubblica.
- [ ] Fatti i passaggi del portale Apple e di Google e inseriti i valori su Vercel: vedi `docs/app-store.md` → "Da fare nel portale Apple" e "Variabili su Vercel".
- [ ] Per provare le notifiche dal Mac: su Vercel `APNS_SANDBOX=true`. **Toglila prima di pubblicare.**

## 0. Il Mac va bene? (5 minuti)

- Menu  → Informazioni su questo Mac: serve **macOS 15.6 Sequoia o più recente** (Apple accetta solo app create con Xcode 26).
- Impostazioni → Generali → Spazio: servono **almeno 50 GB liberi**.

## 1. Installare gli strumenti (1-2 ore, quasi tutta attesa)

1. **Xcode**: App Store del Mac → cerca "Xcode" → Ottieni (circa 15 GB). Aprilo una volta, accetta la licenza, e quando chiede le piattaforme spunta **iOS**.
2. **Node.js**: scarica la versione LTS da https://nodejs.org e installala.
3. Apri **Terminale** e scrivi `xcode-select --install` (installa git; se dice che c'è già, va bene).

## 2. Scaricare il progetto (10 minuti)

Il repository è privato. Il modo più semplice: installa **GitHub Desktop** (https://desktop.github.com), accedi con l'account GitHub che vede `jefebcn/Sander`, poi File → Clone repository → `jefebcn/Sander`.

Poi in Terminale (adatta il percorso se l'hai clonato altrove):

```bash
cd ~/Documents/GitHub/Sander
npm install
npx cap sync ios
npx cap open ios
```

Si apre Xcode. In basso a sinistra scarica i pacchetti Swift: aspetta che finisca (qualche minuto).

## 3. Impostazioni in Xcode (15 minuti)

Nella colonna a sinistra clicca **App** (l'icona blu in alto), poi il target **App**.

1. **Signing & Capabilities**
   - Spunta *Automatically manage signing*.
   - **Team**: già impostato (Team ID `8VQ5WP5Y4L`). Se Xcode lo segna in rosso: Xcode → Settings → Accounts → + → accedi con l'ID Apple dell'account sviluppatore, poi sceglilo qui.
   - Bundle Identifier: `com.sanderbv.app` (già impostato).
   - Devono comparire **Push Notifications** e **Sign in with Apple**. Se mancano: **+ Capability** e aggiungile.
2. **Info** → *URL Types*: lo schema di Google (`com.googleusercontent.apps.1098684246416-…`) è già inserito. Serve al login con Google: controlla solo che ci sia.
3. **General** → *Version* `1.0`, *Build* `1`. A ogni nuovo invio ad Apple alza *Build* di 1.

## 4. Provare l'app (30-60 minuti)

**Sul simulatore**: in alto scegli un iPhone (es. iPhone 17 Pro) e premi ▶︎. Le notifiche e l'accesso con Apple vanno provati sul telefono vero.

**Sul tuo iPhone**:
1. Collegalo con il cavo, sblocca e tocca "Autorizza".
2. Sull'iPhone: Impostazioni → Privacy e sicurezza → **Modalità sviluppatore** → attiva (si riavvia).
3. In Xcode scegli il tuo iPhone in alto e premi ▶︎.

Cosa controllare:
- [ ] L'app si apre su SANDER con il logo all'avvio.
- [ ] **Continua con Apple** funziona (anche "nascondi la mia email").
- [ ] **Continua con Google** funziona.
- [ ] Profilo → **Attiva notifiche partita** → consenti. Poi da un altro account manda un messaggio: arriva la notifica, toccandola si apre la chat.
- [ ] Profilo → Modifica profilo → foto: si aprono fotocamera e galleria.
- [ ] Nessun prezzo per SC o SANDER+ in giro per l'app.

## 5. Creare l'app su App Store Connect (15 minuti, dal browser)

https://appstoreconnect.apple.com → **App** → **+** → Nuova app:
- Piattaforma: iOS · Nome: `SANDER – Beach Volley` · Lingua principale: Italiano
- ID bundle: `com.sanderbv.app` · SKU: `sander-ios` · Accesso: completo

Poi compila con i testi di `docs/app-store.md`: scheda, schermate (le 8 PNG), privacy, classificazione 18+, note per il revisore con l'account demo.

## 6. Inviare la build (30-60 minuti, metà attesa)

1. In alto in Xcode scegli **Any iOS Device (arm64)**.
2. Menu **Product → Archive** (5-10 minuti).
3. Si apre l'Organizer: **Distribute App → App Store Connect → Upload** → avanti con le opzioni predefinite.
4. Dopo 10-30 minuti la build compare in App Store Connect (arriva anche un'email).
5. Facoltativo ma consigliato: **TestFlight** → installa la build sul tuo iPhone e riprova le notifiche (TestFlight usa le notifiche di produzione: togli prima `APNS_SANDBOX` da Vercel).

## 7. Inviare in revisione (10 minuti)

App Store Connect → la tua app → versione 1.0 → sezione **Build** → scegli quella caricata → **Aggiungi per la revisione** → **Invia**.

La risposta arriva di solito in **1-3 giorni**. Se Apple chiede modifiche:
- quasi sempre si correggono sul sito: rispondi nel Centro risoluzione e reinvia la stessa build, **senza Mac**;
- solo per modifiche native (icona, permessi, plugin) serve una nuova build: ripeti i passi 2 (`npx cap sync ios`), 3 (alza *Build*) e 6.

## Riepilogo tempi per chi presta il Mac

| Sessione | Cosa | Durata |
|---|---|---|
| 1 | Installazione, prova su iPhone, invio ad Apple | 4-6 ore (di cui 1-2 di download) |
| 2, solo se serve | Correzione nativa chiesta da Apple | 1-2 ore |
| Aggiornamenti futuri nativi | Nuova build | circa 1 ora |
