import { describe, it, expect } from "vitest"
import {
  DIVISIONS,
  getDivision,
  getNextDivision,
  pointsToNext,
  divisionProgress,
} from "./divisions"

describe("divisions", () => {
  it("places a starter rating in Sabbia", () => {
    expect(getDivision(1200).key).toBe("sabbia")
    expect(getDivision(0).key).toBe("sabbia")
  })

  it("places boundary ratings in the correct division (inclusive floor)", () => {
    expect(getDivision(1449).key).toBe("sabbia")
    expect(getDivision(1450).key).toBe("onda")
    expect(getDivision(1599).key).toBe("onda")
    expect(getDivision(1600).key).toBe("corrente")
    expect(getDivision(1750).key).toBe("tempesta")
    expect(getDivision(1900).key).toBe("leggenda")
    expect(getDivision(2400).key).toBe("leggenda")
  })

  it("returns the next division up, null at the top", () => {
    expect(getNextDivision(1500)?.key).toBe("corrente")
    expect(getNextDivision(1950)).toBeNull()
  })

  it("computes points to next division", () => {
    expect(pointsToNext(1400)).toBe(50) // 1450 - 1400
    expect(pointsToNext(1600)).toBe(150) // 1750 - 1600
    expect(pointsToNext(2000)).toBeNull()
  })

  it("computes progress within the current band (0–100)", () => {
    // Onda band 1450–1600 (span 150); at 1525 → 50%
    expect(divisionProgress(1525)).toBe(50)
    expect(divisionProgress(1450)).toBe(0)
    expect(divisionProgress(2500)).toBe(100) // top division
  })

  it("keeps divisions ordered by ascending floor", () => {
    for (let i = 1; i < DIVISIONS.length; i++) {
      expect(DIVISIONS[i].min).toBeGreaterThan(DIVISIONS[i - 1].min)
      expect(DIVISIONS[i].order).toBe(DIVISIONS[i - 1].order + 1)
    }
  })
})
