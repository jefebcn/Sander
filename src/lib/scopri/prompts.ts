/* ────────────────────────────────────────────────────────────────────────── */
/*  What a Scopri card is made of, besides photos.                             */
/*                                                                             */
/*  Three prompt answers say more about how someone plays than any number:     */
/*  people like an answer, not a face. Keys are stored in the DB, so never     */
/*  rename one; retire it by moving it out of PROMPTS (old answers still show  */
/*  their text through PROMPT_TEXT).                                           */
/* ────────────────────────────────────────────────────────────────────────── */

export interface Prompt {
  key: string
  text: string
}

export const PROMPTS: Prompt[] = [
  { key: "best_shot", text: "Il mio colpo migliore è…" },
  { key: "spot_me", text: "In campo mi riconosci perché…" },
  { key: "partner_who", text: "Cerco un compagno che…" },
  { key: "fav_bagno", text: "Il mio bagno preferito è…" },
  { key: "after_match", text: "Dopo la partita mi trovi…" },
  { key: "best_match", text: "La partita più bella che ho giocato…" },
  { key: "weak_spot", text: "Il mio punto debole (lo ammetto)…" },
  { key: "lost_point", text: "Quando perdiamo un punto io…" },
  { key: "why_beach", text: "Gioco a beach volley perché…" },
  { key: "dream", text: "Il mio sogno da beach volley…" },
  { key: "dare_you", text: "Ti sfido a…" },
  { key: "playlist", text: "Prima di giocare ascolto…" },
  { key: "best_time", text: "L'orario perfetto per giocare è…" },
  { key: "tournament", text: "Un torneo che voglio vincere…" },
]

const PROMPT_TEXT: Record<string, string> = Object.fromEntries(PROMPTS.map((p) => [p.key, p.text]))

export function isPromptKey(key: string): boolean {
  return key in PROMPT_TEXT
}

export function promptText(key: string): string {
  return PROMPT_TEXT[key] ?? "Di me…"
}

/** What someone is on Scopri for. */
export const LOOKING_FOR = [
  { key: "COMPAGNO", label: "Compagno fisso" },
  { key: "PARTITE", label: "Partite al volo" },
  { key: "ALLENAMENTO", label: "Allenamento" },
  { key: "TORNEI", label: "Tornei" },
  { key: "MISTO", label: "Misto" },
  { key: "AMICIZIE", label: "Nuove amicizie" },
] as const

export type LookingFor = (typeof LOOKING_FOR)[number]["key"]
export const LOOKING_FOR_KEYS = LOOKING_FOR.map((l) => l.key) as [LookingFor, ...LookingFor[]]

export function lookingForLabel(key: string): string {
  return LOOKING_FOR.find((l) => l.key === key)?.label ?? key
}

/** Side of the court. */
export const SIDES = [
  { key: "SINISTRA", label: "Sinistra" },
  { key: "DESTRA", label: "Destra" },
  { key: "ENTRAMBI", label: "Tutti e due" },
] as const

export type Side = (typeof SIDES)[number]["key"]
export const SIDE_KEYS = SIDES.map((s) => s.key) as [Side, ...Side[]]

export function sideLabel(key: string | null | undefined): string | null {
  return SIDES.find((s) => s.key === key)?.label ?? null
}
