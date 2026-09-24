import { describe, it, expect } from "vitest"
import { parseCity } from "./cities"

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
