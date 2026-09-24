import { describe, it, expect } from "vitest"
import { parseCity, isKnownCity, CITY_NAMES } from "./cities"

describe("parseCity", () => {
  it("riconosce il comune dal nome", () => {
    expect(parseCity("Bagno 26, Riccione")).toBe("Riccione")
    expect(parseCity("Cesenatico")).toBe("Cesenatico")
  })

  it("è insensibile a maiuscole e spazi", () => {
    expect(parseCity("  RIMINI  ")).toBe("Rimini")
    expect(parseCity("bagno 42 rimini")).toBe("Rimini")
  })

  it("mappa le frazioni sul loro comune", () => {
    expect(parseCity("Torre Pedrera")).toBe("Rimini")
    expect(parseCity("Bagno 5, Miramare")).toBe("Rimini")
    expect(parseCity("Pinarella")).toBe("Cervia")
    expect(parseCity("Villamarina")).toBe("Cesenatico")
    expect(parseCity("Portoverde")).toBe("Misano Adriatico")
  })

  it("preferisce l'alias più lungo quando due combaciano", () => {
    // "milano marittima" è frazione di Cervia: non deve perdere contro un
    // generico match più corto, e "igea marina" non deve essere oscurata da "igea"
    expect(parseCity("Milano Marittima")).toBe("Cervia")
    expect(parseCity("Igea Marina")).toBe("Bellaria-Igea Marina")
  })

  it("restituisce null quando non riconosce nessun comune", () => {
    expect(parseCity("Bagno 26")).toBeNull()
    expect(parseCity("campo dietro casa")).toBeNull()
    expect(parseCity("")).toBeNull()
    expect(parseCity(null)).toBeNull()
    expect(parseCity(undefined)).toBeNull()
  })
})

describe("isKnownCity", () => {
  it("accetta i comuni della lista", () => {
    expect(isKnownCity("Riccione")).toBe(true)
    expect(isKnownCity("Bellaria-Igea Marina")).toBe(true)
  })

  it("rifiuta tutto il resto", () => {
    // il selettore invia un nome canonico: una frazione o testo libero non
    // deve poter finire nel campo city
    expect(isKnownCity("Milano Marittima")).toBe(false)
    expect(isKnownCity("Bologna")).toBe(false)
    expect(isKnownCity("")).toBe(false)
    expect(isKnownCity(null)).toBe(false)
    expect(isKnownCity(undefined)).toBe(false)
  })

  it("accetta ogni nome esposto al selettore", () => {
    // se il picker mostrasse un nome che lo schema rifiuta, il salvataggio
    // fallirebbe senza motivo apparente
    for (const name of CITY_NAMES) expect(isKnownCity(name)).toBe(true)
  })
})
