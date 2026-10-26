/**
 * When the "Installa l'app" banner may show. A first visit only gets the
 * cookie notice: two banners together covered a quarter of the screen, the
 * sign-in button included. The install prompt waits until the cookie choice
 * is made AND the visitor has signed up or come back in another session.
 */
export function installPromptDue(state: { cookieChoice: string | null; hasProfile: boolean; visits: number }): boolean {
  if (!state.cookieChoice) return false
  return state.hasProfile || state.visits >= 2
}
