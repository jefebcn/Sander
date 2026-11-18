/**
 * Words of the SANDER Instagram kit: the six app features in rotation, the
 * community themes, and every title and caption variant. Variants rotate by
 * week, so a feature that comes back six weeks later has a new title.
 *
 * Caption rules (owner): Italian, SANDER tone, never ask people to comment;
 * the only calls to action are "Link in bio", "Salvalo" and "Swipe". Stories
 * have no caption. No alcohol, no dating promises, sport first.
 */

export const HASHTAGS = "#beachvolley #sander #beachvolleyitalia #2v2"

/** Feature rotation order (planner picks by ISO week). */
export const FEATURE_ORDER = ["scopri", "crea", "tornei", "chat", "classifiche", "storico"]

export const FEATURES = {
  scopri: {
    name: "Scopri",
    screen: "scopri",
    tutorial: [
      ["scopri", "Apri Scopri", "Vedi chi gioca vicino a te, al tuo livello."],
      ["chat", "Like con due parole", "Se ricambia è match: la chat si apre da sola."],
      ["partite", "Fissate la partita", "Giorno, bagno, ora. Il resto lo fa la sabbia."],
    ],
    titles: [["Il compagno", "giusto"], ["Swipe,", "match, 2v2"], ["Chi gioca", "come te?"]],
    bullets: ["Giocatori vicino a te, al tuo livello", "Like con due parole: diventano il primo messaggio", "Match e chat per fissare la partita"],
    captions: [
      "Cerchi qualcuno che giochi come te? Su Scopri vedi chi è in zona e al tuo livello: un like con due parole e, se ricambia, vi scrivete e fissate il 2v2.",
      "Swipe, match, partita. Su Scopri trovi il compagno per il 2v2 o gli avversari giusti, vicino a te.",
      "Il beach volley si gioca in due. Su Scopri trovi l'altra metà della coppia, senza girare dieci gruppi.",
    ],
  },
  crea: {
    name: "Crea partita",
    screen: "crea",
    tutorial: [
      ["crea", "Scegli il formato", "2v2, 3v3 o 4v4: decidi tu."],
      ["partite", "Campo e orario", "Bagno, giorno, ora. In un minuto è online."],
      ["chat", "Arrivano i giocatori", "Chi si unisce entra nella chat della partita."],
    ],
    titles: [["Crea la tua", "partita"], ["Un minuto", "e si gioca"], ["Campo, ora,", "via"]],
    bullets: ["Formato, campo e orario in un minuto", "Chi è libero vicino a te la vede subito", "Chat del gruppo e punteggio a fine partita"],
    captions: [
      "Hai il campo ma non i giocatori? Crea la partita su SANDER: formato, bagno e orario, e chi è libero in zona la vede subito.",
      "Un minuto per creare una partita: scegli 2v2, 3v3 o 4v4, il campo e l'ora. Al resto pensa SANDER.",
      "Partita creata, giocatori in arrivo. Su SANDER chi si unisce entra nella chat e a fine match segnate il punteggio.",
    ],
  },
  tornei: {
    name: "Tornei",
    screen: "tornei",
    tutorial: [
      ["tornei", "Trova il torneo", "Tutti i tornei SANDER, in Gioca."],
      ["torneo", "Scadenze e avanzamento", "Quando chiudono le iscrizioni e a che punto è."],
      ["classifica", "Gioca e sali", "Ogni risultato conta in classifica."],
    ],
    titles: [["Il tuo", "prossimo torneo"], ["Iscriviti", "in coppia"], ["Tabellone", "in tasca"]],
    bullets: ["Tornei vicino a te, iscrizione in coppia", "Scadenze con il conto alla rovescia", "Tabellone e risultati in diretta"],
    captions: [
      "Tutti i tornei in un posto: iscrizione in coppia, scadenze con il conto alla rovescia e tabellone in diretta. Su SANDER, in Gioca → Tornei.",
      "Ti iscrivi in coppia, vedi quanto manca alla chiusura e segui il tabellone dal telefono. I tornei su SANDER funzionano così.",
      "Dal calendario al tabellone, senza fogli né gruppi infiniti. Trovi tutto nella sezione Tornei di SANDER.",
    ],
  },
  chat: {
    name: "Chat",
    screen: "chat",
    tutorial: [
      ["partite", "Entri in partita", "Ti unisci con un tap."],
      ["chat", "Si apre la chat", "Tutto il gruppo nello stesso posto."],
      ["crea", "Vi organizzate", "Orario, campo e chi porta il pallone."],
    ],
    titles: [["Tutto il gruppo", "in un posto"], ["Orario, campo,", "squadra"], ["Zero gruppi", "infiniti"]],
    bullets: ["Chat per ogni partita e per ogni match", "Messaggi diretti con chi giochi", "Tutto in app, niente numeri da scambiare"],
    captions: [
      "Ogni partita ha la sua chat: orario, campo e chi porta il pallone, senza scambiarsi numeri.",
      "Niente gruppi infiniti: su SANDER la chat nasce con la partita e sparisce dal tuo telefono quando non serve più.",
      "Messaggi con chi giochi, chat di gruppo per ogni partita. Organizzarsi non è mai stato così veloce.",
    ],
  },
  classifiche: {
    name: "Classifiche",
    screen: "classifica",
    tutorial: [
      ["home", "Gioca e segna", "A fine partita inserite il punteggio."],
      ["classifica", "Sali in classifica", "Il livello si muove partita dopo partita."],
      ["storico", "Guarda i progressi", "Tutte le tue partite in Attività."],
    ],
    titles: [["Quanto vali", "davvero?"], ["Il tuo livello,", "quello vero"], ["Sali di", "livello"]],
    bullets: ["Classifica del tuo comune e di tutta Italia", "Livello che si muove a ogni partita", "Fair play: risultati confermati da entrambi"],
    captions: [
      "Ogni partita sposta il tuo livello. Su SANDER vedi dove sei nella classifica del tuo comune e quanto ti manca per salire.",
      "Classifiche vere: i punteggi li confermano entrambe le squadre. Gioca, segna e sali.",
      "Settimana, stagione, tutti i tempi: su SANDER la classifica la scrivi tu, partita dopo partita.",
    ],
  },
  storico: {
    name: "Storico partite",
    screen: "storico",
    tutorial: [
      ["home", "L'ultima partita", "Risultato e livello appena finito il match."],
      ["storico", "Tutto lo storico", "Ogni partita giocata, con data e campo."],
      ["classifica", "Il quadro completo", "Vittorie, percentuale e posizione."],
    ],
    titles: [["Tutte le tue", "partite"], ["Ti ricordi", "quella partita?"], ["La tua", "stagione"]],
    bullets: ["Ogni partita salvata, con campo e data", "Vittorie e percentuale sempre aggiornate", "Rigioca con gli stessi in un tap"],
    captions: [
      "Ogni partita resta: data, campo, risultato. Su SANDER il tuo storico cresce da solo.",
      "Il terzo set più lungo della tua estate? È lì, nello storico. E con un tap rigiochi con gli stessi.",
      "La tua stagione in una schermata: partite, vittorie e livello. Salvalo e guarda quanto cresci.",
    ],
  },
}

/** Sunday community posts (odd weeks): sport first, no dating, no repeated themes. */
export const COMMUNITY = [
  { title: ["Domenica", "a piedi nudi"], screen: "home", caption: "Domenica di sabbia: un pallone, tre amici e un campo libero. Su SANDER trovi il quarto e chi gioca vicino a te." },
  { title: ["La tua", "Riviera"], screen: "partite", caption: "Da Rimini a Cesenatico, ogni bagno ha la sua partita. Apri SANDER e guarda dove si gioca oggi." },
  { title: ["Porta", "la squadra"], screen: "chat", caption: "Ogni amico che porti su SANDER è un campo pieno in più. Mandagli il link: si entra in un minuto." },
  { title: ["Sabbia", "indoor"], screen: "tornei", caption: "Fuori fa freddo, la sabbia indoor no. Su SANDER trovi partite e tornei anche in inverno." },
]

/** "Manca sempre uno?" (Friday) — problem then solution. */
export const MISSING_ONE = [
  { hook: ["Manca", "sempre uno?"], caption: "Tre pronti, il campo c'è, ma manca sempre uno. Su SANDER lo trovi: guarda le partite aperte vicino a te o crea la tua." },
  { hook: ["Siete", "in tre?"], caption: "Il quarto non risponde? Pubblica la partita su SANDER: chi è libero in zona la vede e si unisce." },
  { hook: ["Il quarto", "non arriva?"], caption: "Succede a tutti. Su SANDER trovi il giocatore che manca, al vostro livello, vicino al campo." },
]

/** Friday story "Chi gioca stasera?" */
export const TONIGHT = [["Chi gioca", "stasera?"], ["Libero", "stasera?"], ["Stasera", "si gioca"]]

export const CTA = ["Link in bio", "Salvalo", "Swipe"]

export function pick(list, week, salt = 0) {
  return list[((week + salt) % list.length + list.length) % list.length]
}

// ─── New formats (17/11/2026) ────────────────────────────────────────────────
// Every cover says it is beach volley (2v2, sabbia, rete, bagno, diagonale)
// and lands on the app only after the joke. Display lines are uppercase in
// Bricolage, `hand` lines in Gochi Hand lime. Captions: same rules as above.

/** «Frasi da rete»: weekly (Thursday), numbered from week 1 = 19/11/2026. Sport first, flirt as a nuance. */
export const FRASI_START = "2026-11-16"
export const FRASI = [
  { d: ["Non cerco", "l'anima", "gemella."], h: ["Cerco chi copre", "la diagonale."], cap: "Le priorità, sulla sabbia, sono chiare." },
  { d: ["Mi hai fatto", "un ace."], h: ["E non ho", "nemmeno visto la palla."], cap: "Succede. Soprattutto al terzo set." },
  { d: ["Io bagher,", "tu alzata."], h: ["Il resto", "lo decide la rete."], cap: "Ogni coppia di 2v2 parte così." },
  { d: ["Non dico", "«mia»"], h: ["a chiunque.", "Solo a te."], cap: "In campo una parola sola basta." },
  { d: ["Sabbia nei", "capelli,"], h: ["punti", "in classifica."], cap: "La giornata giusta ha tutte e due le cose." },
  { d: ["Ti ho visto", "difendere."], h: ["Da lì", "ho capito tutto."], cap: "Un tuffo in difesa dice più di mille parole." },
  { d: ["Il primo", "appuntamento"], h: ["è un 2v2.", "Il secondo, la rivincita."], cap: "Sul campo ci si conosce in fretta." },
  { d: ["Cambio campo", "ogni 7 punti."], h: ["Compagno,", "mai."], cap: "Alcune cose non si cambiano." },
  { d: ["Non serve", "che parli."], h: ["Basta", "che copri la linea."], cap: "Il miglior compagno di beach parla con i piedi." },
  { d: ["Tu chiami", "il punto,"], h: ["io chiamo", "la rivincita."], cap: "Una partita tira l'altra." },
  { d: ["Palla corta", "al primo punto."], h: ["Ok,", "mi hai convinto."], cap: "Certe giocate non si dimenticano." },
  { d: ["Ho perso", "il set."], h: ["Ma ho trovato", "un compagno."], cap: "Le sconfitte migliori finiscono così." },
  { d: ["Il vento era", "contro di noi."], h: ["Il compagno", "no."], cap: "Le scuse finiscono, i compagni giusti restano." },
  { d: ["Ricezione", "perfetta."], h: ["Come la prima", "volta che hai scritto."], cap: "Precisi in campo, rapidi in chat." },
  { d: ["Più di un", "match:"], h: ["un 2v2", "ogni sabato."], cap: "Le abitudini migliori nascono sulla sabbia." },
  { d: ["Mi copri", "la diagonale?"], h: ["Io ti porto", "l'acqua al cambio campo."], cap: "Il patto di ogni coppia che funziona." },
  { d: ["Il mio tipo?"], h: ["Uno che arriva", "puntuale al campo."], cap: "Raro, ma esiste." },
  { d: ["Tu muro,", "io difesa."], h: ["Insieme,", "un problema per tutti."], cap: "Le coppie migliori si dividono il campo." },
  { d: ["Ultima", "e andiamo."], h: ["Disse nessuno,", "mai."], cap: "L'ultima non è mai l'ultima." },
  { d: ["Non ti ho", "scelto"], h: ["per il bagher.", "Anche."], cap: "Il bagher conta. Ma non solo." },
  { d: ["Ace,", "match,"], h: ["e il tramonto", "dietro la rete."], cap: "La sequenza perfetta di un sabato." },
  { d: ["Sei la mia", "alzata"], h: ["preferita.", "Ora tocca a me."], cap: "Un'alzata così non si spreca." },
  { d: ["Per te", "batto anche"], h: ["controvento.", "Quasi."], cap: "Ci sono limiti anche all'amore per il beach." },
  { d: ["Ho cercato", "il quarto."], h: ["Ho trovato", "molto di più."], cap: "Il compagno giusto arriva quando meno te lo aspetti." },
  { d: ["Due su", "sabbia:"], h: ["si parte", "dalla rete."], cap: "Ogni bella storia di beach inizia con un 2v2." },
  { d: ["Fuori?"], h: ["Per te", "era dentro."], cap: "In campo si è sempre un po' di parte." },
]

/** Hook on a photo (Friday, «manca uno»). */
export const GANCI = [
  { eyebrow: "Beach volley · sabato 17:58", d: ["Siete in tre", "in campo."], h: ["Il quarto ha", "scritto «arrivo»."], sticker: "✓✓ 2 ore fa", sub: "Non è arrivato. Su SANDER entra chi c'è davvero.", cap: "Siete in tre sulla sabbia, la rete è montata e il quarto è sparito dai radar. Su SANDER le partite di beach le vede chi è libero adesso, vicino a te: entra e si gioca." },
  { eyebrow: "Beach volley · domenica 10:30", d: ["Rete montata,", "palla gonfia."], h: ["Manca", "solo uno."], sticker: "🏐 3/4", sub: "Su SANDER il quarto lo trovi prima di scendere in spiaggia.", cap: "Rete montata, palla gonfia, manca uno. Pubblica la partita su SANDER e chi è libero in zona la vede subito." },
  { eyebrow: "2v2 · Bagno 26 · 18:30", d: ["«Ci sono»", "alle 14."], h: ["«Non ce la faccio»", "alle 18:20."], sticker: "Visualizzato ✓✓", sub: "Su SANDER, se qualcuno salta, entra il primo in lista.", cap: "Il classico forfait dell'ultimo minuto. Su SANDER se uno salta, il primo in lista d'attesa riceve la notifica ed entra al suo posto." },
  { eyebrow: "Beach volley · tutta Italia", d: ["Campo libero,", "sole pieno."], h: ["E voi", "siete in tre."], sticker: "🏐 manca 1", sub: "Su SANDER lo trovi al tuo livello, vicino al campo.", cap: "Campo libero e sole pieno, ma siete in tre. Su SANDER trovi chi gioca al vostro livello, vicino al vostro bagno." },
]

/** Group chat vs SANDER (Friday, alternate weeks; Wednesday for Crea/Chat). */
export const CHATS = [
  { group: "Beach volley sabato 🏐", sub: "Luca, Marta, Ste, Giulia e altri 10", msgs: [["", "Chi c'è per il 2v2 di sabato? 🏐", 1], ["Marta", "forse"], ["Ste", "dipende dal vento"], ["Giulia", "io solo se c'è il sole ☀️"], ["Marco", "ma a che ora? quale campo?"], ["", "quindi chi viene?", 1]], seen: "Visualizzato da 13", sticker: "47 messaggi · 0 partite", d: ["Piena in", "10 minuti."], card: ["2V2 · OGGI 18:30", "Bagno 26"], cap: "Quarantasette messaggi, zero partite: il gruppo del beach lo conosciamo tutti. Su SANDER crei la partita, scegli bagno e orario, e si riempie da sola." },
  { group: "Beach dopo lavoro 🏐", sub: "Fede, Ale, Sara, Nico e altri 7", msgs: [["", "Stasera beach? Serve il quarto", 1], ["Fede", "io ci sono 🙋"], ["Ale", "porto la palla"], ["Sara", "chi prenota il campo?"], ["Nico", "io tardi, verso le 20?"], ["", "...ok facciamo domani", 1]], seen: "Visualizzato da 10", sticker: "Rimandata. Di nuovo.", d: ["Campo, ora,", "squadra."], card: ["2V2 · STASERA 19:00", "Campo 2"], cap: "«Facciamo domani» è la frase più giocata del beach volley. Su SANDER la partita ha campo, orario e posti: chi c'è entra, e stasera si gioca davvero." },
  { group: "Torneo sabato 🏆", sub: "Giorgia, Teo, Lalla e altri 5", msgs: [["", "Chi fa coppia con me per il torneo?", 1], ["Giorgia", "io ho già il compagno 😅"], ["Teo", "io solo misto"], ["Lalla", "quand'è la scadenza?"], ["Teo", "boh, chiedi all'organizzatore"], ["", "ok cerco altrove", 1]], seen: "Visualizzato da 7", sticker: "Scadenza: ieri", d: ["Compagno", "trovato."], card: ["TORNEO · SABATO", "Iscrizione in coppia"], cap: "Trovare il compagno per il torneo nel gruppo è un'impresa. Su SANDER vedi chi gioca al tuo livello, le scadenze con il conto alla rovescia e ti iscrivi in coppia dall'app." },
]

/** Quote from the bench (Sunday rotation). */
export const CITAZIONI = [
  { who: "Il tuo compagno di beach, dopo il terzo ace subito", d: ["Il sole era"], mk: "esattamente", d2: "lì.", h: "giuro.", cap: "Ogni coppia di beach ha la sua scusa preferita. La nostra è il sole. Su SANDER almeno il punteggio lo confermate in due." },
  { who: "Tu, al terzo set sotto 12-14", d: ["Questa la"], mk: "giriamo", d2: "noi.", h: "fidati.", cap: "Il terzo set è un altro sport. Su SANDER ogni partita sposta i punti: anche quelle girate all'ultimo." },
  { who: "Il tuo compagno, dopo un «mia» mancato", d: ["L'avevo"], mk: "chiamata", d2: "io.", h: "forse.", cap: "Il «mia» più famoso del beach volley. Trova un compagno che chiama le palle giuste su SANDER." },
  { who: "Chiunque, alle 21:30, al buio", d: ["Ultima e"], mk: "andiamo.", d2: "", h: "(sono le 22:40)", cap: "L'ultima non è mai l'ultima. Su SANDER la prossima partita la fissi prima di uscire dal campo." },
]

/** «Che compagno sei?»: 9 beach types. */
export const GIOCHI = [
  { title: ["Che compagno", "di beach sei?"], foot: "numero 3", types: [["«MIA!»", "e poi la guarda"], ["«Ultima e andiamo»", "ne fa altre sei"], ["Il tattico", "«tu stai lì»"], ["Arriva", "al terzo set"], ["«Era fuori»", "sempre"], ["Muro umano", "zero parole"], ["Occhiali da 200 €", "ricezione da 2"], ["Gioca solo", "al tramonto"], ["Conta i punti", "a modo suo"]], cap: "Nove compagni di beach volley, nove modi di stare sulla sabbia. Su Scopri trovi quello che gioca come te.", line: "Nove compagni di beach, uno è il tuo" },
  { title: ["Che giocatore", "da spiaggia sei?"], foot: "numero 7", types: [["Ricezione", "in tuffo, sempre"], ["Batte forte", "e prega"], ["Chiama tutto", "non prende niente"], ["Allena", "il compagno"], ["Sabbia", "ovunque"], ["Smorzata", "a ogni punto"], ["Fa coppia", "solo col migliore"], ["Si scalda", "per 40 minuti"], ["Arriva", "con 3 palloni"]], cap: "Sulla sabbia ognuno ha il suo stile. Su SANDER trovi chi gioca come te, vicino a te.", line: "Nove stili da spiaggia, uno è il tuo" },
]
export const GIOCO_FACES = ["marco-1", "giorgia-1", "luca-1", "chiara-1", "davide-1", "marta-1", "filippo-1", "elena-1", "andrea-1"]

/** Lock screen with SANDER notifications. */
export const NOTIFICHE = [
  { date: "sabato 14 giugno", time: "17:42", n: [["🏐", "Si è liberato un posto: 2v2 al Bagno 26 alle 18:30. Entri?", "ora"], ["👀", "Sara ha messo like alla tua risposta: «la mia arma segreta? la palla corta»", "3 min fa"], ["🔥", "+12 punti. Hai superato Marco nel tuo comune.", "ieri"]], d: "Telefono pieno.", h: "Sabato in campo.", cap: "Le notifiche giuste: un posto libero nel 2v2, un like su Scopri, i punti dopo la partita. Su SANDER il beach volley ti scrive al momento giusto." },
  { date: "domenica 3 agosto", time: "09:15", n: [["🏆", "Iscrizioni aperte: torneo 2v2 di sabato. Mancano 4 coppie.", "ora"], ["🤝", "Luca vuole fare coppia con te per il torneo.", "12 min fa"], ["⏳", "Le iscrizioni chiudono tra 2 giorni.", "1 h fa"]], d: "Il torneo", h: "ti cerca lui.", cap: "Tornei di beach volley con le iscrizioni in coppia e il conto alla rovescia: su SANDER le scadenze te le ricorda l'app." },
  { date: "venerdì 18 luglio", time: "19:03", n: [["✅", "Risultato confermato: 21-17, 21-19. Bella partita!", "ora"], ["📈", "Sei salito di livello: ora sei Argento.", "ora"], ["🔁", "Rivincita? Marco e Giulia vi sfidano sabato.", "5 min fa"]], d: "Partita finita.", h: "Rivincita sabato.", cap: "Risultato confermato da entrambe le coppie, punti aggiornati e la rivincita già pronta. Il dopo-partita del beach volley, su SANDER." },
]

/** Green flag / red flag of the 2v2 partner. */
export const FLAGS = [
  { title: ["Il compagno", "di 2v2"], h: "giusto", green: ["Ti copre la diagonale senza che lo chiedi", "Ti passa l'acqua al cambio campo", "Perso? «La prossima è nostra»"], red: ["«Mia!»… e la guarda cadere", "Le 18:30 per lui sono le 19", "Perso? «C'era vento»"], cap: "Green flag e red flag del compagno di beach volley. Quello giusto, su Scopri, lo trovi al tuo livello e vicino a te." },
  { title: ["La coppia", "di beach"], h: "perfetta", green: ["Si dividono il campo senza parlare", "Festeggiano anche il punto dell'altro", "Rivincita fissata prima di uscire"], red: ["Due che chiamano la stessa palla", "Uno batte, l'altro guarda il telefono", "Litigano sul punteggio"], cap: "Una coppia di 2v2 si vede da come si divide il campo. Su SANDER trovi chi gioca come te e fissate la partita in chat." },
]

/** Card: bronze → gold. */
export const CARTE = [
  { eyebrow: "La tua carta da beach volley", d: "Oggi bronzo.", h: "Sabato oro?", sub: "Vinci a beach, i punti salgono, la carta cambia cornice.", cap: "Su SANDER ogni partita di beach volley sposta i tuoi punti. Salendo la carta passa da bronzo ad argento e oro." },
  { eyebrow: "Beach volley · la tua carta", d: "Quanto vali", h: "sulla sabbia?", sub: "I punti li decidono i risultati, confermati da tutte e due le coppie.", cap: "Il livello vero, sulla sabbia: su SANDER i punti si muovono con i risultati, confermati da entrambe le coppie." },
]
