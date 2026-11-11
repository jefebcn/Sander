import { describe, expect, it } from "vitest"
import { clashMessage, clashes, courtCount, eventRange, findClash, layoutDay, minutesInto, shiftDay, weekOf, type CalEvent } from "./clubCalendar"
import { romeWallTime } from "./romeMonth"

const ev = (over: Partial<CalEvent>): CalEvent => ({
  id: "e",
  kind: "PARTITA",
  title: "Partita",
  startsAt: romeWallTime("2026-11-22", "10:00"),
  endsAt: romeWallTime("2026-11-22", "11:30"),
  court: 1,
  ...over,
})

describe("romeWallTime", () => {
  it("turns Rome wall-clock into the right instant, winter and summer", () => {
    expect(romeWallTime("2026-11-22", "10:00").toISOString()).toBe("2026-11-22T09:00:00.000Z")
    expect(romeWallTime("2026-07-01", "10:00").toISOString()).toBe("2026-07-01T08:00:00.000Z")
  })
})

describe("clashes", () => {
  it("same court overlapping clashes; touching ends or other courts don't", () => {
    expect(clashes(ev({}), ev({ startsAt: romeWallTime("2026-11-22", "11:00"), endsAt: romeWallTime("2026-11-22", "12:00") }))).toBe(true)
    expect(clashes(ev({}), ev({ startsAt: romeWallTime("2026-11-22", "11:30"), endsAt: romeWallTime("2026-11-22", "12:00") }))).toBe(false)
    expect(clashes(ev({}), ev({ court: 2 }))).toBe(false)
  })
  it("an entry for every court clashes with any court", () => {
    expect(clashes(ev({ court: null }), ev({ court: 3 }))).toBe(true)
  })
  it("finds the clash and says it in Italian", () => {
    const other = ev({ id: "x", title: "Allenamento", court: 2 })
    const hit = findClash(ev({ court: 2 }), [ev({ id: "a", court: 1 }), other])
    expect(hit?.id).toBe("x")
    expect(clashMessage(other)).toBe("Il campo 2 è già occupato: Allenamento dalle 10:00 alle 11:30.")
  })
})

describe("eventRange and days", () => {
  it("reads the form's times, end 00:00 is midnight after", () => {
    const r = eventRange("2026-11-22", "20:00", "00:00")
    expect(r.endsAt.toISOString()).toBe("2026-11-22T23:00:00.000Z")
    expect(minutesInto("2026-11-22", r.startsAt)).toBe(1200)
  })
  it("weeks start on Monday", () => {
    expect(weekOf("2026-11-22")).toEqual(["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22"])
    expect(shiftDay("2026-11-30", 1)).toBe("2026-12-01")
  })
  it("clamps the court count", () => {
    expect(courtCount(null)).toBe(1)
    expect(courtCount(40)).toBe(12)
  })
})

describe("layoutDay", () => {
  it("places entries in half-hour rows and court columns, all-courts spans every column", () => {
    const l = layoutDay("2026-11-22", [ev({}), ev({ id: "b", court: null, startsAt: romeWallTime("2026-11-22", "15:00"), endsAt: romeWallTime("2026-11-22", "16:00") })], 3)
    expect(l.startHour).toBe(8)
    expect(l.endHour).toBe(22)
    expect(l.placed[0]).toMatchObject({ rowStart: 5, rowEnd: 8, colStart: 1, colEnd: 2 })
    expect(l.placed[1]).toMatchObject({ rowStart: 15, rowEnd: 17, colStart: 1, colEnd: 4 })
  })
  it("grows for early or late entries and skips other days", () => {
    const l = layoutDay(
      "2026-11-22",
      [ev({ startsAt: romeWallTime("2026-11-22", "07:00"), endsAt: romeWallTime("2026-11-22", "08:00") }), ev({ id: "n", startsAt: romeWallTime("2026-11-22", "22:00"), endsAt: romeWallTime("2026-11-22", "23:30") }), ev({ id: "o", startsAt: romeWallTime("2026-11-23", "10:00"), endsAt: romeWallTime("2026-11-23", "11:00") })],
      2,
    )
    expect([l.startHour, l.endHour]).toEqual([7, 24])
    expect(l.placed.map((p) => p.event.id)).toEqual(["e", "n"])
  })
})
