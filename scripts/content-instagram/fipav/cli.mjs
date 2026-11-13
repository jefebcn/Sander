#!/usr/bin/env node
// cli.mjs — comandi da terminale per il lettore FIPAV
// Uso: node cli.mjs <comando> [opzioni]   (node cli.mjs aiuto)

import { writeFile } from "node:fs/promises";
import {
  listTappe, getTappa, listRanking, getRankingAtleti, cercaAtleta, reportTornei, ultimoWeekend,
  prossimiTornei, prossimoWeekend, configure,
} from "./fipav.mjs";

const [, , cmd = "aiuto", ...rest] = process.argv;
const opt = {};
const pos = [];
for (let i = 0; i < rest.length; i++) {
  const a = rest[i];
  if (a.startsWith("--")) {
    const k = a.slice(2);
    const v = rest[i + 1] && !rest[i + 1].startsWith("--") ? rest[++i] : true;
    opt[k] = v;
  } else pos.push(a);
}

const season = String(opt.stagione || new Date().getFullYear());
if (opt["no-cache"]) configure({ cacheTtlMinutes: 0 });

async function output(data, printer) {
  if (opt.out) {
    await writeFile(opt.out, JSON.stringify(data, null, 2));
    console.log(`Salvato in ${opt.out}`);
  } else if (opt.json) {
    console.log(JSON.stringify(data, null, 2));
  } else printer(data);
}

const filtri = () => ({
  regione: opt.regione, provincia: opt.provincia, genere: opt.genere, tipologia: opt.tipologia,
  dal: opt.dal, al: opt.al, cerca: opt.cerca,
});

const comandi = {
  async tappe() {
    const t = await listTappe(season, filtri());
    await output(t, (rows) => {
      for (const r of rows) console.log(`${r.dal}  ${r.genere.padEnd(9)} ${r.nome.padEnd(48)} ${r.regione}   [${r.path}]`);
      console.log(`\n${rows.length} tappe`);
    });
  },

  async tappa() {
    const path = pos[0];
    if (!path) throw new Error("Indica la tappa, es: node cli.mjs tappa 2026/BVL/M/11632");
    const d = await getTappa(path);
    await output(d, (x) => {
      console.log(`${x.nome} — ${x.genere} — ${x.comune} (${x.provincia}) — ${x.dal}${x.al !== x.dal ? " → " + x.al : ""}`);
      console.log(`${x.struttura}${x.indirizzo ? ", " + x.indirizzo : ""}`);
      console.log(`\nClassifica finale:`);
      for (const c of x.classifica) console.log(`  ${String(c.posizione).padStart(2)}. ${c.coppia}  (${c.punti} pt)`);
      console.log(`\nRisultati (${x.partite.length} partite):`);
      for (const p of x.partite) console.log(`  ${p.data} ${p.ora}  ${p.turno.padEnd(22)} ${p.coppia1}  ${p.set1}-${p.set2}  ${p.coppia2}   ${p.punteggio}`);
    });
  },

  async ranking() {
    if (opt.elenco) {
      const l = await listRanking(season);
      return output(l, (x) => { console.log(`Stagione ${x.stagione} (aggiornato ${x.aggiornato})`); for (const a of x.atleti) console.log(`  ${a.path}  ${a.titolo}`); for (const s of x.societa) console.log(`  ${s.path}  ${s.titolo}`); });
    }
    const r = await getRankingAtleti(season, opt.categoria || "assoluto", opt.sesso || "m");
    const top = Number(opt.top || 30);
    await output(opt.top ? { ...r, atleti: r.atleti.slice(0, top) } : r, (x) => {
      console.log(`Ranking ${x.categoria} ${x.sesso} — stagione ${x.stagione} (aggiornato ${x.aggiornato})`);
      for (const a of x.atleti.slice(0, top)) console.log(`  ${String(a.posizione).padStart(4)}. ${a.atleta.padEnd(32)} ${a.punti} pt`);
    });
  },

  async atleta() {
    const nome = pos.join(" ");
    if (!nome) throw new Error('Indica un nome, es: node cli.mjs atleta "rossi luca"');
    const r = await cercaAtleta(season, nome);
    await output(r, (rows) => {
      if (!rows.length) return console.log("Nessun atleta trovato.");
      for (const a of rows) console.log(`  ${a.classifica.padEnd(34)} ${String(a.posizione).padStart(4)}°  ${a.atleta}  ${a.punti} pt`);
    });
  },

  async weekend() {
    const w = opt.dal ? { dal: opt.dal, al: opt.al || opt.dal } : ultimoWeekend();
    const r = await reportTornei(season, { ...filtri(), ...w });
    await output({ periodo: w, tornei: r }, (x) => {
      console.log(`Tornei FIPAV dal ${x.periodo.dal} al ${x.periodo.al}${opt.regione ? " — " + opt.regione : ""}\n`);
      for (const t of x.tornei) {
        console.log(`• ${t.nome} (${t.genere}) — ${t.luogo} — ${t.coppieIscritte} coppie${t.terminata ? "" : " — NON ANCORA CONCLUSO"}`);
        for (const p of t.podio) console.log(`    ${["", "🥇", "🥈", "🥉"][p.posizione] || p.posizione}  ${p.coppia}`);
      }
      if (!x.tornei.length) console.log("Nessun torneo nel periodo.");
    });
  },

  async prossimi() {
    const w = opt.dal ? { dal: opt.dal, al: opt.al || opt.dal } : prossimoWeekend();
    const r = await prossimiTornei(season, { ...filtri(), ...w });
    await output({ periodo: w, tornei: r }, (x) => {
      console.log(`Tornei FIPAV in programma dal ${x.periodo.dal} al ${x.periodo.al}${opt.regione ? " — " + opt.regione : ""}\n`);
      for (const t of x.tornei) console.log(`• ${t.dal}  ${t.nome} (${t.genere}) — ${t.luogo}`);
      if (!x.tornei.length) console.log("Nessun torneo in programma.");
    });
  },

  aiuto() {
    console.log(`Lettore dati beach volley FIPAV

  node cli.mjs tappe   [--regione EMILIA] [--genere M|F] [--dal 2026-06-01] [--al 2026-06-30] [--tipologia "serie beach"] [--cerca rimini]
  node cli.mjs tappa   2026/BVL/M/11632                 dettaglio: info, risultati, classifica finale
  node cli.mjs ranking [--categoria assoluto|under-20|under-18|under-16|under-14] [--sesso m|f] [--top 50]
  node cli.mjs ranking --elenco                         classifiche disponibili
  node cli.mjs atleta  "cognome nome"                   posizione dell'atleta in tutte le classifiche
  node cli.mjs weekend [--regione EMILIA] [--dal ... --al ...]   tornei dell'ultimo weekend con podio (per i post)
  node cli.mjs prossimi [--regione EMILIA] [--dal ... --al ...]  tornei del prossimo weekend (per le storie)

Opzioni comuni: --stagione 2026  --json  --out file.json  --no-cache`);
  },
};

const fn = comandi[cmd];
if (!fn) { comandi.aiuto(); process.exit(1); }
fn().catch((e) => { console.error("Errore:", e.message); process.exit(1); });
