import { describe, it, expect } from "vitest"
import calendarPage from "./__fixtures__/calendar-page.json"
import infoTappa from "./__fixtures__/info-tappa.json"
import entryList from "./__fixtures__/entry-list.json"
import ranking from "./__fixtures__/ranking.json"
import rankingIndex from "./__fixtures__/ranking-index.json"
import {
  titleCase, cleanClub, shortCategory, isYouthCategory, categoryGroup,
  romeToUtc, parseDay, parseItalianDate, seasonsToSync, calendarPages,
  parseCalendarPage, parseInfo, parseEntryList, parseStandings, parseRanking,
  seniorRankingPaths, parseAthlete,
} from "./parse"

describe("text", () => {
  it("title case keeps apostrophes and hyphens", () => {
    expect(titleCase("ACERBI RAOUL")).toBe("Acerbi Raoul")
    expect(titleCase("PODESTA' SIMONE")).toBe("Podesta' Simone")
    expect(titleCase("SACRIPANTI MAURO - TRAVI DANIELE")).toBe("Sacripanti Mauro - Travi Daniele")
  })

  it("drops membership codes from club names", () => {
    expect(cleanClub("(2540660) CARPEGNA MICHELA")).toBe("Carpegna Michela")
    expect(cleanClub("QUANTA CLUB SRL SSD")).toBe("Quanta Club Srl Ssd")
  })

  it("categories", () => {
    expect(shortCategory("Campionato Italiano per società Gold")).toBe("Società Gold")
    expect(isYouthCategory("Campionato Italiano per società Under 16")).toBe(true)
    expect(isYouthCategory("Tappa giovanile regionale U14")).toBe(true)
    expect(isYouthCategory("Serie Beach 1")).toBe(false)
    expect(categoryGroup("Serie Beach 2")).toBe("serie")
    expect(categoryGroup("Campionato Italiano per società Silver")).toBe("societa")
    expect(categoryGroup("Campionato Italiano per società Under 18")).toBe("giovanili")
  })
})

describe("dates", () => {
  it("Rome wall clock, winter and summer", () => {
    expect(romeToUtc(2026, 11, 12, 11, 0).toISOString()).toBe("2026-11-12T10:00:00.000Z")
    expect(romeToUtc(2026, 8, 19, 12, 0).toISOString()).toBe("2026-08-19T10:00:00.000Z")
  })

  it("days and Italian dates", () => {
    expect(parseDay("21/08/2026")?.toISOString()).toBe("2026-08-21T00:00:00.000Z")
    expect(parseDay("2026-11-15")?.toISOString()).toBe("2026-11-15T00:00:00.000Z")
    expect(parseDay("boh")).toBeNull()
    expect(parseItalianDate("12 Novembre 2026 alle 11:00")?.toISOString()).toBe("2026-11-12T10:00:00.000Z")
    expect(parseItalianDate("15 Novembre 2026")?.toISOString()).toBe("2026-11-15T00:00:00.000Z")
    expect(parseItalianDate("")).toBeNull()
  })
})

describe("calendar", () => {
  it("picks the seasons around today", () => {
    const index = { seasons: [
      { season: "1970", da: "1970-01-01", a: "1970-01-01" },
      { season: "2025", da: "2025-01-04", a: "2025-12-28" },
      { season: "2026", da: "2026-01-03", a: "2026-12-27" },
      { season: "2027", da: "2027-01-03", a: "2027-01-31" },
    ] }
    expect(seasonsToSync(index, new Date("2026-11-13T10:00:00Z"))).toEqual([2026, 2027])
    expect(seasonsToSync(index, new Date("2026-01-20T10:00:00Z"))).toEqual([2025, 2026, 2027])
  })

  it("lists page files", () => {
    expect(calendarPages({ pages: [{ path_discipline: "2026/1/discipline.json" }, {}] })).toEqual(["2026/1/discipline.json"])
  })

  it("reads beach events and skips broken ones", () => {
    const evs = parseCalendarPage(calendarPage, 2026)
    expect(evs).toHaveLength(2)
    expect(evs[0]).toMatchObject({
      code: "BVLM12476", gender: "M", girone: "12476", category: "Campionato Italiano per società Gold",
      city: "Milano", province: "Milano", region: "Lombardia", clubName: "Quanta Club Srl Ssd",
      prizeEuro: 0, path: "2026/BVL/M/12476", menu: "societa",
    })
    expect(evs[0].startDate.toISOString()).toBe("2026-11-15T00:00:00.000Z")
    expect(evs[1]).toMatchObject({ code: "BVLF11832", region: "Puglia", prizeEuro: 1500 })
    expect(evs[1].endDate.toISOString()).toBe("2026-08-22T00:00:00.000Z")
  })
})

describe("event files", () => {
  it("info: venue, formula and deadlines in Rome time", () => {
    const d = parseInfo(infoTappa)
    expect(d.venue).toBe("Quanta Club Srl Ssd")
    expect(d.address).toBe("Via Assietta, 19")
    expect(d.formula).toEqual([
      "Main Draw: Eliminazione diretta", "8 squadre al Main Draw", "Qualificazioni: Girone",
      "12 partecipanti alle Qualificazioni", "8 Qualificati",
    ])
    expect(d.deadlines.map((x) => [x.key, x.at])).toEqual([
      ["iscrizioni", "2026-11-12T10:00:00.000Z"],
      ["lista", "2026-11-12T10:00:00.000Z"],
      ["cambio", "2026-11-13T12:00:00.000Z"],
    ])
  })

  it("entry list never keeps membership codes", () => {
    const e = parseEntryList(entryList)
    expect(e[0]).toEqual({ pos: 1, team: "Rossi Mario - Bianchi Luca", club: "Beach Club Ssd", points: 2605.5, note: "Qualifiche" })
    expect(e[1]).toMatchObject({ team: "Verdi Anna - Neri Sara", club: null, points: 1090.3, note: null })
  })

  it("standings sorted by position", () => {
    const s = parseStandings({ data: { teams: [
      { position: 2, team: { title: "B B - C C" }, points: 60, money: 300 },
      { position: 1, team: { title: "A A - D D" }, points: 86.25, money: "600.0" },
    ] } })
    expect(s.map((x) => [x.pos, x.team, x.money])).toEqual([[1, "A A - D D", 600], [2, "B B - C C", 300]])
  })
})

describe("rankings", () => {
  it("rows and year", () => {
    const r = parseRanking(ranking)
    expect(r.year).toBe(2026)
    expect(r.rows).toEqual([
      { personId: 101, position: 1, name: "Rossi Mario", totalPoints: 3824.25, entryPoints: 2430 },
      { personId: 102, position: 2, name: "Podesta' Luca", totalPoints: 3000, entryPoints: 2615.5 },
    ])
  })

  it("only senior rankings", () => {
    expect(seniorRankingPaths(rankingIndex)).toEqual([
      { gender: "M", path: "atleti/assoluto/m.json" },
      { gender: "F", path: "atleti/assoluto/f.json" },
    ])
  })

  it("athlete results, newest first, without the date suffix", () => {
    const res = parseAthlete({ risultati: [
      { final_position: 2, points: 282.5, league_start: "07/08/2026", league_name: "Campionato Italiano Assoluto - Tappa - Cordenons - data inizio: 07/08/2026" },
      { final_position: 1, points: 300, league_start: "27/08/2026", league_name: "FIVB - Pro Tour Future - Modena - data inizio: 27/08/2026" },
    ] })
    expect(res).toEqual([
      { position: 1, points: 300, date: "2026-08-27", event: "FIVB - Pro Tour Future - Modena" },
      { position: 2, points: 282.5, date: "2026-08-07", event: "Campionato Italiano Assoluto - Tappa - Cordenons" },
    ])
  })
})
