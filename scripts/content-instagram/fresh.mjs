/**
 * Never the same twice. Picks the first variant of a list that @sanderbeachvolley
 * has not used yet (work/history.json, from history.mjs), starting from the
 * usual weekly rotation. New variants written by the routine go in
 * work/extra-content.json ({ "GANCI": [...], "FRASI": [...], ... }, same shape
 * as content.mjs) and come first.
 *
 * When a list has nothing new left the slot is not rendered and the list is
 * written to work/out/needs.json: the routine writes new variants there and
 * renders again. Nothing is ever reused.
 */
import { readFileSync, existsSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const KIT = dirname(fileURLToPath(import.meta.url))
const read = (f, empty) => (existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : empty)
const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim()

const history = read(join(KIT, "work", "history.json"), { texts: [] })
const PAST = history.texts.map(norm)
const EXTRA = read(join(KIT, "work", "extra-content.json"), {})
const NOW = new Set() // picked in this run: two slots of the same run never share a variant
export const NEEDS = []

export class NothingNew extends Error {}

/** true when this fingerprint already went out (or is scheduled) on Instagram. */
export function used(fp) {
  const f = norm(fp)
  return f.length > 0 && (NOW.has(f) || PAST.some((t) => t.includes(f)))
}

/**
 * First unused item of `name` (extra variants first, then `list` rotated from
 * `start`). `fp(item)` is the text that identifies it in a caption or story text.
 */
export function fresh(name, list, start, fp) {
  const extra = EXTRA[name] ?? []
  const n = list.length
  const rotated = n ? Array.from({ length: n }, (_, k) => list[(((start + k) % n) + n) % n]) : []
  for (const item of [...extra, ...rotated]) {
    if (!used(fp(item))) { NOW.add(norm(fp(item))); return item }
  }
  NEEDS.push(name)
  throw new NothingNew(name)
}
