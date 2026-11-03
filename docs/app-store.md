# App Store (iPhone) — SANDER

L'app iPhone è un guscio Capacitor (`ios/`) che apre www.sanderbv.it, con funzioni native: accesso con Apple e Google, notifiche push (APNs), fotocamera, condivisione, vibrazione.

## Già pronto nel repo

- `ios/`: progetto Xcode generato da `npx cap add ios` (Capacitor 8, Swift Package Manager, niente CocoaPods).
  - Solo iPhone (`TARGETED_DEVICE_FAMILY = 1`), solo verticale.
  - `Info.plist`: testi dei permessi fotocamera e foto, `WKAppBoundDomains` (sanderbv.it), `ITSAppUsesNonExemptEncryption = false`.
  - `App/App.entitlements`: notifiche push e Accedi con Apple.
  - `AppDelegate.swift`: passa il token APNs a `@capacitor/push-notifications`.
- Accedi con Apple: `src/lib/appleNative.ts` (provider `apple-native` in `src/lib/auth.ts`), pulsante in `AuthForm` solo su iOS.
- Notifiche native: `src/lib/nativePush.ts` (app), `src/lib/apns.ts` (server), tabella `native_push_tokens`. Android resta senza finché non c'è Firebase (`google-services.json`): registrarsi senza lo fa chiudere.
- Scopri: ogni azione rifiuta i minorenni (`requireMe` in `src/actions/scopri.ts`).
- Acquisti digitali (SC, SANDER+, extra) nascosti nell'app (`isNativeApp`); le iscrizioni ai tornei sono servizi reali e restano.

## Da fare nel portale Apple (developer.apple.com)

1. **Identifiers → App ID** `com.sanderbv.app`: spunta *Push Notifications* e *Sign in with Apple*.
2. **Keys → +**: chiave con *Apple Push Notifications service (APNs)*. Scarica il file `.p8` (una volta sola) e annota Key ID e Team ID.
3. **Google Cloud Console** → stesso progetto del login Google → *Credenziali → ID client OAuth → iOS*, bundle `com.sanderbv.app`. Annota il client ID e il suo "iOS URL scheme" (`com.googleusercontent.apps.…`).

## Variabili su Vercel (Production)

| Nome | Valore |
|---|---|
| `APNS_KEY_ID` | Key ID della chiave APNs |
| `APNS_TEAM_ID` | Team ID dell'account Apple Developer |
| `APNS_PRIVATE_KEY` | Contenuto del file `.p8` (anche con `\n` al posto degli a capo) |
| `APNS_SANDBOX` | `true` solo per provare da Xcode; vuoto per TestFlight e App Store |
| `AUTH_GOOGLE_IOS_ID` | Client ID iOS di Google (senza, su iPhone non compare "Continua con Google") |

## In Xcode (o Codemagic) prima della prima build

- `Info.plist` → *URL Types*: aggiungi lo "iOS URL scheme" di Google (`com.googleusercontent.apps.…`), serve al login Google.
- *Signing & Capabilities*: scegli il Team. Push e Sign in with Apple arrivano già da `App.entitlements`.
- Icona: `ios/App/App/Assets.xcassets/AppIcon.appiconset` (1024×1024, senza trasparenza).

## App Store Connect

- Classificazione d'età: 18+ (Scopri: incontri tra utenti, contenuti generati dagli utenti, chat).
- Note per il revisore: account demo con dati, e dove trovare le funzioni native (Accedi con Apple, notifiche, fotocamera nella foto profilo).
