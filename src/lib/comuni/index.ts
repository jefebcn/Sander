/* ────────────────────────────────────────────────────────────────────────── */
/*  Every Italian comune (ISTAT, scripts/comuni/build.py) plus San Marino.     */
/*  SANDER started on the Riviera Romagnola but grows with its players:        */
/*  anyone can set their own comune, anywhere in Italy.                        */
/*  Server-side (validators, actions): the client loads the same list from     */
/*  /api/comuni only when the picker needs it.                                 */
/* ────────────────────────────────────────────────────────────────────────── */

import data from "./comuni.json"
import { CITY_NAMES } from "@/lib/cities"

export interface ComuniData {
  regions: string[]
  /** [name, index into regions], sorted by name. */
  comuni: [string, number][]
}

export const COMUNI = data as ComuniData

const REGION_OF = new Map<string, string>(COMUNI.comuni.map(([name, r]) => [name, COMUNI.regions[r]]))

/** The region of an ISTAT comune (or San Marino); null for anything else. */
export function regionOfComune(name: string | null | undefined): string | null {
  return (name && REGION_OF.get(name)) || null
}

/**
 * True for a place a player or a match can be filed under: any Italian comune,
 * San Marino, or one of the Riviera names SANDER has always offered (Gatteo a
 * Mare and San Mauro Mare are seaside frazioni people pick by that name).
 */
export function isKnownPlace(value: string | null | undefined): boolean {
  return !!value && (CITY_NAMES.includes(value) || REGION_OF.has(value))
}
