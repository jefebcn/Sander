/* ────────────────────────────────────────────────────────────────────────── */
/*  Riviera Romagnola towns.                                                   */
/*                                                                             */
/*  Bagno numbers are assigned per comune (Rimini runs ~1–150, and the other   */
/*  towns restart their own count), so a number alone cannot tell you the      */
/*  town — inventing number→town ranges would produce wrong leaderboards.      */
/*  Instead we read the town from the location text, including the frazioni    */
/*  people actually type, and leave anything unrecognised out.                 */
/*  Pure logic — usable client + server, unit-testable.                        */
/* ────────────────────────────────────────────────────────────────────────── */

export interface City {
  /** Canonical comune name shown in the UI. */
  name: string
  /** Lowercase spellings that map to this comune: the town itself, plus its
   *  seaside frazioni, which locals name instead of the comune. */
  aliases: string[]
}

export const CITIES: City[] = [
  {
    name: "Rimini",
    aliases: [
      "rimini", "torre pedrera", "viserbella", "viserba", "rivabella",
      "san giuliano", "marebello", "rivazzurra", "miramare", "bellariva",
    ],
  },
  { name: "Riccione", aliases: ["riccione"] },
  { name: "Misano Adriatico", aliases: ["misano", "portoverde"] },
  { name: "Cattolica", aliases: ["cattolica"] },
  {
    name: "Bellaria-Igea Marina",
    aliases: ["bellaria", "igea marina", "igea"],
  },
  {
    name: "Cesenatico",
    aliases: ["cesenatico", "valverde", "villamarina", "zadina"],
  },
  {
    name: "Cervia",
    aliases: ["cervia", "milano marittima", "milano mar", "pinarella", "tagliata"],
  },
  { name: "Gatteo a Mare", aliases: ["gatteo"] },
  { name: "San Mauro Mare", aliases: ["san mauro"] },
]

/**
 * Read the comune out of a free-text location.
 * Returns null when the text names no town we know — those matches simply
 * don't take part in the town leaderboards, rather than being filed wrongly.
 */
export function parseCity(location: string | null | undefined): string | null {
  if (!location) return null
  const s = location.toLowerCase()
  // Longest alias first, so "milano marittima" wins over a bare "cervia" and
  // "igea marina" isn't shadowed by "igea".
  const ordered = CITIES.flatMap((c) => c.aliases.map((a) => ({ alias: a, name: c.name })))
    .sort((a, b) => b.alias.length - a.alias.length)
  for (const { alias, name } of ordered) {
    if (s.includes(alias)) return name
  }
  return null
}

/** Just the comune names, in the order shown by the picker. */
export const CITY_NAMES: string[] = CITIES.map((c) => c.name)

/** True when the value is one of the comuni we recognise. */
export function isKnownCity(value: string | null | undefined): boolean {
  return !!value && CITY_NAMES.includes(value)
}
