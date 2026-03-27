/**
 * Increment BUILD_NUMBER on every push.
 * Version format: 1.MINOR.PATCH where MINOR = floor(BUILD/100), PATCH = BUILD % 100
 * e.g. 51 → 1.0.51 | 99 → 1.0.99 | 100 → 1.1.0 | 200 → 1.2.0
 */
export const BUILD_NUMBER = 55

const MAJOR = 1
const MINOR = Math.floor(BUILD_NUMBER / 100)
const PATCH = BUILD_NUMBER % 100

export const APP_VERSION_DISPLAY = `${MAJOR}.${MINOR}.${PATCH}`
