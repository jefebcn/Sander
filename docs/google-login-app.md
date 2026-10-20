# Accesso con Google nell'app Android

Dentro l'app Google non accetta il login "web": la pagina si apre in Chrome e l'app resta disconnessa.
Dalla versione **1.1 (versionCode 3)** l'app usa l'accesso nativo di Android, cioè la scelta dell'account
del telefono (Credential Manager, plugin `@capgo/capacitor-social-login`).

## Come funziona

1. Nell'app, "Continua con Google" apre la scelta dell'account del telefono.
2. Google restituisce un *ID token* firmato per il nostro client Web (`AUTH_GOOGLE_ID`).
3. Il sito lo verifica con le chiavi pubbliche di Google (`src/lib/googleNative.ts`) e fa entrare lo
   **stesso utente** del login Google dal sito. Lo cerca prima per account Google, poi per email verificata;
   se non lo trova, lo crea.

Le installazioni vecchie (versione 1.0) non hanno il plugin: per loro il pulsante resta nascosto e si entra
con email e password. Sul sito non cambia niente.

## Cosa fare (una volta sola)

### 1. Google Cloud Console: client OAuth Android

Usa lo **stesso progetto** del client Web già in uso, quello di `AUTH_GOOGLE_ID` che inizia con `109868424641-`.

1. Apri <https://console.cloud.google.com/apis/credentials> e scegli il progetto.
2. Vai su **Crea credenziali → ID client OAuth → Tipo: Android**.
3. Compila i campi:
   - **Nome pacchetto:** `com.sanderbv.app`
   - **SHA-1:** in Play Console apri l'app SANDER → **Test e rilascio → Integrità dell'app → Firma dell'app**
     e copia lo **SHA-1 del "certificato della chiave di firma dell'app"**.
4. Crea un **secondo** client Android con lo SHA-1 della tua **chiave di caricamento** (stessa pagina, "Certificato
   della chiave di caricamento"). Serve per provare le build che installi tu prima di caricarle.

Non copiare l'ID dei client Android da nessuna parte: l'app usa il client **Web**, che il sito le passa già.

### 2. Schermata consenso OAuth

Se è ancora in **Test**, possono entrare solo gli account aggiunti in **Pubblico → Utenti di test**. Per aprire
a tutti premi **Pubblica app**. Per `email` e `profile` Google non chiede la verifica dell'app.

### 3. Build della nuova versione

```bash
npm install
npx cap sync android        # registra i plugin nativi nel progetto Android
npx cap open android        # apre Android Studio
```

In Android Studio vai su **Build → Generate Signed App Bundle / APK → Android App Bundle**, con la tua chiave
di caricamento e variante **release**. Il file esce in `android/app/release/app-release.aab`.

### 4. Play Console

1. **Test interno → Crea nuova release** → carica l'`.aab` (versionCode 3, versione 1.1).
2. Installa dal link di test interno e prova "Continua con Google".
3. Se funziona, **promuovi in produzione**.

Testo per "Novità di questa versione":

```
• Accedi con Google direttamente dall'app
• Fotocamera, vibrazione e condivisione native
• Scopri: "Aperto a conoscersi", foto verificata, proponi una partita in chat
• Nuovo sfondo e la mascotte Gabbo
```

## Se non funziona

- **`[28444] Developer console is not set up correctly`**: lo SHA-1 o il nome pacchetto del client Android
  non corrispondono alla build installata. Ricontrolla lo SHA-1 della firma Play (per le build dal Play Store)
  e quello della chiave di caricamento (per le build installate a mano).
- **Il selettore si chiude senza entrare**: la schermata consenso è in Test e quell'account non è tra gli
  utenti di test.
- **"Accesso con Google non riuscito" dopo aver scelto l'account**: il sito ha rifiutato il token. Succede se
  `AUTH_GOOGLE_ID` su Vercel non è il client Web dello stesso progetto. L'errore compare in admin → Sistema e
  nei log come `google-native sign-in refused`.
