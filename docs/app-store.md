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

## Scheda App Store Connect (testi pronti)

Limiti Apple tra parentesi; conteggi già verificati.

**Nome (max 30)**
```
SANDER – Beach Volley
```

**Sottotitolo (max 30)**
```
Partite, compagni, classifica
```

**Testo promozionale (max 170, si cambia senza nuova revisione)**
```
Il beach volley in Riviera ha un club: trova la partita vicino a te, il compagno giusto per il 2v2 e scala la classifica del tuo comune. Gratis.
```

**Parole chiave (max 100, virgole senza spazi)**
```
beach volley,pallavolo,2v2,torneo,spiaggia,partita,compagni,classifica,rimini,riccione,cervia,sport
```

**Descrizione (max 4000)**
```
SANDER è l'app del beach volley in Riviera. Trovi con chi giocare, organizzi la partita e vedi come cresce il tuo livello, tutto in un posto.

PARTITE VICINO A TE
• Crea una partita 2v2, 3v3 o 4v4 in pochi secondi e trova i giocatori che mancano
• Vedi le partite con posti liberi nel tuo comune e nel tuo bagno
• «Sono libero»: fai sapere quando puoi giocare, mattina, pomeriggio o sera

SCOPRI: TROVA CON CHI GIOCARE
Scorri i profili dei giocatori della tua zona: foto in campo e tre risposte («Il mio colpo migliore è…»). Metti like a una foto o a una risposta e scrivi un commento. Se il like è reciproco è match: chattate, scegliete giorno e bagno, e la partita finisce in calendario.
Scopri è riservato ai maggiorenni.

COPPIE 2V2
Forma la tua coppia fissa, sfida le altre coppie e scala la classifica. Potete anche iscrivervi insieme ai tornei.

TORNEI
King of the Beach, gironi, eliminazione diretta e Chicece, con iscrizioni e risultati in diretta.

LA TUA CARTA GIOCATORE
Livello, partite, percentuale di vittorie, rating e classifica del tuo comune. Dopo ogni partita vedi quanto sei cresciuto. Ogni bagno ha il suo Re.

GIOCATORI AFFIDABILI
Chi si presenta alle partite ottiene il badge verificato e sale nei suggerimenti.

SICUREZZA
Puoi bloccare e segnalare un giocatore in ogni momento, anche per una foto o un messaggio. Le segnalazioni vengono controllate dal nostro team. Puoi eliminare il tuo account dall'app in qualsiasi momento.

Fatto in Romagna, da chi gioca, per chi gioca. Ci vediamo in spiaggia.
```

**Altri campi**
- Categoria principale: Sport. Secondaria: Social networking.
- URL di supporto: `https://www.sanderbv.it` · URL marketing: `https://www.sanderbv.it`
- URL privacy: `https://www.sanderbv.it/privacy`
- Copyright: `2026 SANDER`
- Prezzo: gratis. Nessun acquisto in-app (gli acquisti digitali sono nascosti nell'app iPhone).

**Schermate**: 8 PNG 1290×2796 (iPhone 6,9"), consegnate a parte. Bastano quelle: Apple le riduce per gli iPhone più piccoli. Niente iPad (l'app è solo iPhone).

## Privacy dell'app (App Store Connect → Privacy dell'app)

Tracciamento: **No** (nessun dato usato per pubblicità o condiviso con data broker).

| Dato | Raccolto | Collegato all'utente | Scopo |
|---|---|---|---|
| Nome | Sì | Sì | Funzionalità dell'app |
| Indirizzo email | Sì | Sì | Funzionalità dell'app (account) |
| Foto | Sì | Sì | Funzionalità dell'app (profilo, Scopri) |
| Altri contenuti dell'utente (risposte, messaggi in chat) | Sì | Sì | Funzionalità dell'app |
| ID utente | Sì | Sì | Funzionalità dell'app |
| Cronologia acquisti (iscrizioni ai tornei) | Sì | Sì | Funzionalità dell'app |
| Interazione con il prodotto | Sì | No | Analisi (Vercel Analytics, senza cookie) |
| Dati sugli arresti anomali / altri dati diagnostici | Sì | No | Funzionalità dell'app (log errori) |
| Altri dati (data di nascita, genere, comune scelto) | Sì | Sì | Funzionalità dell'app (limite 18+ di Scopri, classifiche) |

Non raccolti: posizione precisa o approssimativa dal telefono (il comune lo sceglie l'utente), contatti, salute, dati finanziari (le carte le gestiscono Stripe e SumUp), cronologia di navigazione.

## Classificazione per età (questionario)

- Contenuti generati dagli utenti: **Sì** · Messaggi e chat: **Sì**
- Funzioni per conoscere persone (Scopri): **Sì**
- Accesso libero al web: **No** (l'app apre solo sanderbv.it)
- Violenza, contenuti sessuali, droghe, gioco d'azzardo, armi: **No**
- Risultato da scegliere: **18+**. Scopri è un servizio per conoscere persone, e con 18+ la revisione è più sicura. Contro: chi ha meno di 18 anni non può scaricare l'app iPhone (resta il sito).

## Note per il revisore (App Review Information)

**Account demo**: `appreview@sanderbv.it` (password consegnata a parte, non nel repo).

```
SANDER is a beach volleyball community app for the Italian Riviera: players find games nearby, form 2v2 pairs, join tournaments and track their rating.

Demo account: appreview@sanderbv.it (password in the field above). It has a completed player profile.

Native features in this build:
- Sign in with Apple and Google (native sheets) on the sign-in screen.
- Push notifications (APNs): Profile → "Attiva notifiche partita", or the banner in the chat inbox. Notifications arrive for new messages, matches and games.
- Camera / photo library: Profile → edit profile → tap the profile photo.
- Native share sheet and haptics across the app.

Scopri (player discovery) is for adults only: it asks for the date of birth and blocks under-18s on the server. To try it, open the Scopri tab and complete the short profile (one photo, three answers, date of birth). Users can block and report any player, photo or message; reports are reviewed by our team (/admin/segnalazioni). Accounts can be deleted in-app: Profile → "Elimina account".

There are no in-app purchases in the iOS app. Tournament registrations are paid events that take place physically on the beach (guideline 3.1.3(e)).
```
