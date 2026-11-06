import { describe, expect, it } from "vitest"
import { nextToPromote } from "./waitlist"

const solo = (id: string) => ({ id, partnerId: null })
const pair = (id: string) => ({ id, partnerId: `${id}-b` })

describe("nextToPromote", () => {
  it("first in line gets the seat", () => {
    expect(nextToPromote([solo("a"), solo("b")], 1)?.id).toBe("a")
  })
  it("a pair needs two seats: with one free, the next single player gets it", () => {
    expect(nextToPromote([pair("p"), solo("a")], 1)?.id).toBe("a")
    expect(nextToPromote([pair("p"), solo("a")], 2)?.id).toBe("p")
  })
  it("nothing fits", () => {
    expect(nextToPromote([pair("p")], 1)).toBeNull()
    expect(nextToPromote([], 3)).toBeNull()
    expect(nextToPromote([solo("a")], 0)).toBeNull()
  })
})
