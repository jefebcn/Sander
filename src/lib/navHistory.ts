/**
 * Counts client-side navigations in this tab (PageWrapper bumps it on every
 * route change). It lives in module scope, so it resets on a full page load —
 * exactly when there is no in-app page behind the current one.
 */
let inAppNavigations = 0

export function markInAppNavigation() {
  inAppNavigations++
}

/**
 * True when "back" would land on a page of this app: either we navigated here
 * client-side, or the browser history has an entry and it came from our origin.
 * document.referrer alone isn't enough: client-side navigations don't set it.
 */
export function canGoBackInApp() {
  if (typeof window === "undefined") return false
  if (window.history.length <= 1) return false
  if (inAppNavigations > 0) return true
  try {
    return Boolean(document.referrer) && new URL(document.referrer).origin === window.location.origin
  } catch {
    return false
  }
}
