/* Browser side of the error log (lib/errorLog.ts): fire-and-forget, at most a
   few reports per page load, never the same error twice. */

const MAX_PER_PAGE_LOAD = 5
const sent = new Set<string>()

export function reportError(error: unknown, digest?: string) {
  try {
    const e = error instanceof Error ? error : null
    const message = (e?.message ?? String(error)).slice(0, 2000)
    if (!message || sent.has(message) || sent.size >= MAX_PER_PAGE_LOAD) return
    // Noise we can't act on: extensions, aborted loads, cross-origin scripts.
    if (/^Script error\.?$|ResizeObserver loop|chrome-extension:|moz-extension:|AbortError|Load failed|NetworkError/i.test(message)) return
    sent.add(message)
    const body = JSON.stringify({
      message,
      path: (location.pathname + location.search).slice(0, 500),
      stack: e?.stack?.slice(0, 8000),
      digest,
    })
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/errors", new Blob([body], { type: "application/json" }))
    } else {
      void fetch("/api/errors", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true })
    }
  } catch {
    // reporting must never cause an error of its own
  }
}
