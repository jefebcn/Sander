/* ────────────────────────────────────────────────────────────────────────── */
/*  Beach volley is 2v2: a Scopri match is how you find your partner. This     */
/*  reads two players as a pair — roles and court sides — so every card says  */
/*  what you'd be together, not just who the person is.                        */
/*  Pure logic, unit-tested.                                                   */
/* ────────────────────────────────────────────────────────────────────────── */

export type Role = "BLOCKER" | "DEFENDER"

export interface PairSide {
  role: Role
  side: string | null
}

export interface PairFit {
  /** "partner": you complete each other; "rival": same spot, better across the net. */
  kind: "partner" | "rival" | "open"
  title: string
  detail: string | null
}

const ROLE = { BLOCKER: "muro", DEFENDER: "difesa" } as const

function sidesFit(a: string | null, b: string | null): "split" | "clash" | null {
  if (!a || !b) return null
  if (a === "ENTRAMBI" || b === "ENTRAMBI") return "split"
  return a === b ? "clash" : "split"
}

export function pairFit(me: PairSide, them: PairSide): PairFit {
  const sides = sidesFit(me.side, them.side)
  const sideDetail =
    sides === "split" ? "E vi dividete il campo: lati diversi." : sides === "clash" ? "Giocate dallo stesso lato: uno dei due cambia." : null
  if (me.role !== them.role) {
    return {
      kind: "partner",
      title: `${ROLE[me.role][0].toUpperCase()}${ROLE[me.role].slice(1)} + ${ROLE[them.role]}: coppia completa`,
      detail: sideDetail,
    }
  }
  if (sides === "split") {
    return { kind: "partner", title: `Tutti e due ${ROLE[me.role]}, ma su lati diversi`, detail: "Coppia possibile: vi dividete il campo." }
  }
  return {
    kind: "rival",
    title: `Stesso ruolo (${ROLE[me.role]}): ideale da avversari`,
    detail: "Portate ognuno il proprio compagno e fate un 2v2.",
  }
}
