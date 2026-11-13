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
      ["tornei", "Trova il torneo", "Tornei SANDER e calendario FIPAV, tutto in Gioca."],
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
