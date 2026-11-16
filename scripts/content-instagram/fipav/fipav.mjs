// fipav.mjs — lettore dati beach volley FIPAV (tornei, risultati, classifiche, ranking)
// Fonte: i file JSON pubblici usati dal sito ufficiale federvolley.it
//   https://media.myvolley.net/public/json/...
// Nessuna dipendenza: richiede Node.js 18+ (fetch integrato).

import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";

export const BASE = "https://media.myvolley.net/public/json";

const DEFAULTS = {
  cacheDir: ".cache-fipav",
  cacheTtlMinutes: 360, // 6 ore: i dati FIPAV vengono rigenerati poche volte al giorno
  delayMs: 250,         // pausa tra richieste, per non sovraccaricare il server
  userAgent: "SANDER-fipav-reader/1.0 (+https://sanderbv.it)",
};

let config = { ...DEFAULTS };
export function configure(opts = {}) { config = { ...config, ...opts }; }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let lastRequest = 0;
let queue = Promise.resolve();

async function cachedJson(path, { ttlMinutes = config.cacheTtlMinutes, optional = false } = {}) {
  const url = `${BASE}/${path}`;
  const file = config.cacheDir
    ? join(config.cacheDir, createHash("sha1").update(url).digest("hex") + ".json")
    : null;

  if (file && ttlMinutes > 0) {
    try {
      const s = await stat(file);
      if (Date.now() - s.mtimeMs < ttlMinutes * 60_000) return JSON.parse(await readFile(file, "utf8"));
    } catch { /* niente cache */ }
  }

  // coda: una richiesta alla volta, con pausa tra l'una e l'altra
  const turn = queue.then(async () => {
    const wait = lastRequest + config.delayMs - Date.now();
    if (wait > 0) await sleep(wait);
    lastRequest = Date.now();
  });
  queue = turn.catch(() => {});
  await turn;

  let res;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(url, { headers: { "User-Agent": config.userAgent, Accept: "application/json" } });
    if (res.ok || res.status === 404) break;
    await sleep(1000 * 2 ** attempt);
  }
  if (!res.ok) {
    if (optional && res.status === 404) return null;
    throw new Error(`FIPAV ${res.status} su ${url}`);
  }
  const json = await res.json();
  if (file) {
    await mkdir(config.cacheDir, { recursive: true });
    await writeFile(file, JSON.stringify(json));
  }
  return json;
}

// ---------- utilità ----------

const norm = (s = "") => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const isBye = (team) => !team || /^BYE\b/i.test(team.title || "");
const coppia = (team) => (team ? team.title : "");
const giocatori = (team) => (team?.players || []).map((p) => `${p.firstname} ${p.surname}`.trim());
const itToIso = (d) => { const [g, m, a] = (d || "").split("/"); return a ? `${a}-${m}-${g}` : ""; };

/** Converte una tappa grezza dell'indice nel formato SANDER. */
function mapTappa(c) {
  return {
    id: c.girone_index || c.CAGIRI,
    codice: c.codice,
    path: c.path.replace(/\/[^/]+\.json$/, ""), // cartella della tappa
    nome: `${c.tipologia} - ${c.comune}`,
    tipologia: c.tipologia,            // es. "Serie Beach 2", "Campionato Italiano Assoluto"
    categoria: c.ranking_type,         // es. "Serie Beach", "Assoluto", "Under 18"
    genere: c.genere,                  // "Maschile" | "Femminile" | "Misto"
    sesso: c.CASESS,                   // "M" | "F" | ...
    regione: c.regione,
    provincia: c.provincia,
    comune: c.comune,
    dal: c.data_inizio_iso || itToIso(c.dal),
    al: c.data_fine_iso || itToIso(c.al),
    montepremi: c.montepremi_valore || 0,
    menu: c.menu_eventi,               // es. "serie-beach", "campionato-italiano"
    urlSito: `https://www.federvolley.it/campionati/beach-volley/${c.path.split("/")[0]}/${c.codice}`,
  };
}

// ---------- tornei (tappe) ----------

/**
 * Elenco delle tappe di beach volley di una stagione.
 * filtri: { regione, provincia, genere ("M"|"F"|"Maschile"...), dal, al (YYYY-MM-DD), tipologia, cerca }
 */
export async function listTappe(season, filtri = {}) {
  const root = await cachedJson(`${season}/discipline.json`);
  const pages = root.pages?.length ? root.pages.map((p) => p.path_discipline) : [];
  const docs = pages.length
    ? await Promise.all(pages.map(async (p) => cachedJson(p, { optional: true })))
    : [root];

  const seen = new Set();
  let tappe = [];
  for (const d of docs) {
    for (const gruppo of Object.values(d?.beach_volley?.serie || {})) {
      for (const s of Object.values(gruppo)) {
        for (const c of s.codici || []) {
          if (seen.has(c.path)) continue;
          seen.add(c.path);
          tappe.push(mapTappa(c));
        }
      }
    }
  }

  const f = filtri;
  if (f.regione) tappe = tappe.filter((t) => norm(t.regione).includes(norm(f.regione)));
  if (f.provincia) tappe = tappe.filter((t) => norm(t.provincia).includes(norm(f.provincia)));
  if (f.genere) {
    const g = norm(f.genere)[0];
    tappe = tappe.filter((t) => norm(t.genere)[0] === g || norm(t.sesso)[0] === g);
  }
  if (f.tipologia) tappe = tappe.filter((t) => norm(t.tipologia).includes(norm(f.tipologia)));
  if (f.dal) tappe = tappe.filter((t) => t.al >= f.dal);
  if (f.al) tappe = tappe.filter((t) => t.dal <= f.al);
  if (f.cerca) {
    const q = norm(f.cerca);
    tappe = tappe.filter((t) => norm(`${t.nome} ${t.comune} ${t.provincia} ${t.regione}`).includes(q));
  }
  return tappe.sort((a, b) => a.dal.localeCompare(b.dal) || a.nome.localeCompare(b.nome));
}

// ---------- dettaglio di una tappa ----------

function mapMatch(m) {
  const set = (m["pt_a"] || []).map((a, i) => [a, (m["pt_b"] || [])[i]]).filter(([a, b]) => a || b);
  const s1 = Number(m["team1-setwin"] || 0), s2 = Number(m["team2-setwin"] || 0);
  return {
    id: m.id,
    data: itToIso(m.date),
    ora: (m.time || "").replace(".", ":"),
    fase: m.fase?.season_type || "",          // "Main draw" | "Qualificazioni" | ...
    turno: m.fase?.pool ? `Pool ${m.fase.pool}` : (m.fase?.descrizione || m.day || ""),
    formula: m.fase?.formula_label || "",
    campo: m.bvl?.campo?.name || "",
    coppia1: coppia(m.team1),
    coppia2: coppia(m.team2),
    giocatori1: giocatori(m.team1),
    giocatori2: giocatori(m.team2),
    set1: s1,
    set2: s2,
    punteggio: set.map(([a, b]) => `${a}-${b}`).join(", "),
    vincitore: m.played ? (s1 > s2 ? coppia(m.team1) : s2 > s1 ? coppia(m.team2) : "") : "",
    giocata: !!m.played,
    live: !!m.is_live,
  };
}

/** Tutti i dati di una tappa: info, risultati, classifica finale, entry list. */
export async function getTappa(pathOrTappa, { soloPartiteVere = true } = {}) {
  const path = typeof pathOrTappa === "string" ? pathOrTappa.replace(/\/[^/]+\.json$/, "") : pathOrTappa.path;
  const [info, cal, cls, entry] = await Promise.all([
    cachedJson(`${path}/info-tappa.json`, { optional: true }),
    cachedJson(`${path}/calendario.json`, { optional: true }),
    cachedJson(`${path}/classifica.json`, { optional: true }),
    cachedJson(`${path}/entry-list.json`, { optional: true }),
  ]);
  const c = cal?.data || {};
  let partite = (c.matches || []).map((m) => ({ raw: m, ...mapMatch(m) }));
  if (soloPartiteVere) partite = partite.filter((p) => !isBye(p.raw.team1) && !isBye(p.raw.team2));
  partite = partite.map(({ raw, ...p }) => p);

  const classifica = (cls?.data?.teams || [])
    .filter((t) => !isBye(t.team))
    .map((t) => ({ posizione: t.position, coppia: coppia(t.team), giocatori: giocatori(t.team), punti: t.points, premio: t.money }));

  const entryList = (entry?.data?.teams || [])
    .filter((t) => !isBye(t.team))
    .map((t) => ({ posizione: t.position, coppia: coppia(t.team), giocatori: giocatori(t.team), rankingCoppia: t.ranking_team, tabellone: t.notes }));

  const i = info?.data || {};
  return {
    path,
    nome: c.title || i.title || "",
    tipologia: c.tipologia || i.tipo_torneo || "",
    genere: c.genere || i.genere || "",
    regione: c.regione || "",
    provincia: c.provincia || "",
    comune: c.comune || "",
    dal: c.data_inizio_iso || "",
    al: c.data_fine_iso || "",
    struttura: (i.location?.struttura || "").replace(/^Struttura:\s*/, ""),
    indirizzo: i.location?.indirizzo || "",
    formula: i.tipo_tabellone || [],
    terminata: classifica.length > 0 && partite.every((p) => p.giocata),
    podio: classifica.filter((t) => t.posizione <= 3),
    classifica,
    partite,
    entryList,
  };
}

// ---------- ranking (classifiche atleti e società) ----------

/** Elenco delle classifiche disponibili per una stagione (atleti per categoria/sesso, società). */
export async function listRanking(season) {
  const idx = await cachedJson(`${season}/BVL/classifiche/index.json`);
  const d = idx.data || {};
  return {
    stagione: d.stagione,
    aggiornato: d.generated_at,
    atleti: (d.atleti || []).map((a) => ({ titolo: a.title, categoria: a.ranking_type, sesso: a.sesso, path: a.path })),
    societa: (d.societa || []).map((s) => ({ titolo: s.title, path: s.path })),
  };
}

/** Classifica atleti. categoria: "assoluto" | "under-20" | "under-18" | "under-16" | "under-14"; sesso: "m" | "f". */
export async function getRankingAtleti(season, categoria = "assoluto", sesso = "m") {
  const slug = norm(categoria).replace(/\s+/g, "-");
  const r = await cachedJson(`${season}/BVL/classifiche/atleti/${slug}/${norm(sesso)}.json`);
  const d = r.data || {};
  return {
    stagione: d.stagione,
    categoria: d.ranking_type,
    sesso: d.sesso,
    aggiornato: d.generated_at,
    atleti: (d.athletes || []).map((a) => ({
      posizione: a.position,
      atleta: a.title,
      idPersona: a.person_id,
      punti: a.total_points,
      puntiEntryList: a.entry_list_points,
      dettaglio: Object.fromEntries((a.totals_by_type || []).map((t) => [t.label, t.points])),
    })),
  };
}

/** Classifica società (path preso da listRanking().societa). */
export async function getRankingSocieta(season, path = "societa/assoluto.json") {
  const r = await cachedJson(`${season}/BVL/classifiche/${path}`);
  return r.data;
}

/** Cerca un atleta (per nome/cognome) in tutte le classifiche atleti della stagione. */
export async function cercaAtleta(season, nome) {
  const q = norm(nome).split(/\s+/).filter(Boolean);
  const { atleti } = await listRanking(season);
  const out = [];
  for (const cl of atleti) {
    const [categoria, file] = cl.path.replace(/^atleti\//, "").split("/");
    const r = await getRankingAtleti(season, categoria, file.replace(".json", ""));
    for (const a of r.atleti) {
      const n = norm(a.atleta);
      if (q.every((w) => n.includes(w))) out.push({ classifica: cl.titolo, ...a });
    }
  }
  return out.sort((a, b) => a.posizione - b.posizione);
}

// ---------- report pronto per i post (es. "Tornei FIPAV del weekend") ----------

/** Tornei disputati tra dal e al (YYYY-MM-DD), con podio. Filtri come listTappe. */
export async function reportTornei(season, filtri = {}) {
  const tappe = await listTappe(season, filtri);
  const out = [];
  for (const t of tappe) {
    const d = await getTappa(t);
    out.push({
      nome: t.nome,
      tipologia: t.tipologia,
      genere: t.genere,
      luogo: `${t.comune} (${t.provincia})`,
      regione: t.regione,
      dal: t.dal,
      al: t.al,
      struttura: d.struttura,
      coppieIscritte: d.entryList.length,
      partiteGiocate: d.partite.filter((p) => p.giocata).length,
      terminata: d.terminata,
      podio: d.podio.map((p) => ({ posizione: p.posizione, coppia: p.coppia })),
      finale: d.partite.filter((p) => /^finale(\s+1)?/i.test(p.turno) && !/3°/.test(p.turno))
        .map((p) => ({ coppia1: p.coppia1, coppia2: p.coppia2, set: `${p.set1}-${p.set2}`, punteggio: p.punteggio, vincitore: p.vincitore }))[0] || null,
      urlSito: t.urlSito,
    });
  }
  return out;
}

/** Tornei in programma tra dal e al (senza scaricare i risultati): per "Questo weekend si gioca". */
export async function prossimiTornei(season, filtri = {}) {
  const tappe = await listTappe(season, filtri);
  return tappe.map((t) => ({
    nome: t.nome, tipologia: t.tipologia, genere: t.genere, luogo: `${t.comune} (${t.provincia})`,
    regione: t.regione, dal: t.dal, al: t.al, urlSito: t.urlSito, path: t.path,
  }));
}

/** Date del prossimo weekend (venerdì-domenica); se oggi è ven/sab/dom, quello in corso. */
export function prossimoWeekend(oggi = new Date()) {
  const d = new Date(oggi);
  const giorno = d.getDay();
  const toVen = giorno === 0 ? -2 : giorno === 6 ? -1 : 5 - giorno;
  const ven = new Date(d); ven.setDate(d.getDate() + toVen);
  const dom = new Date(ven); dom.setDate(ven.getDate() + 2);
  const iso = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  return { dal: iso(ven), al: iso(dom) };
}

/** Date dell'ultimo weekend concluso (venerdì-domenica), in ora locale. */
export function ultimoWeekend(oggi = new Date()) {
  const d = new Date(oggi);
  const giorno = d.getDay(); // 0 = domenica
  const diffDom = giorno === 0 ? 7 : giorno;
  const dom = new Date(d); dom.setDate(d.getDate() - diffDom);
  const ven = new Date(dom); ven.setDate(dom.getDate() - 2);
  const iso = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
  return { dal: iso(ven), al: iso(dom) };
}
