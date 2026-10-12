/**
 * The atmosphere behind every page: a dark sea-at-dusk base, the last light of
 * the sunset at the top, and a whisper of sand grain so surfaces don't feel
 * like flat plastic. Fixed and non-interactive; content sits above it.
 *
 * Variants exist so the look can be compared and switched in one place.
 */
export type BackgroundVariant = "night" | "sunset"

export function AppBackground({ variant = "sunset" }: { variant?: BackgroundVariant }) {
  return (
    <div aria-hidden="true" className={`app-bg app-bg--${variant} pointer-events-none fixed inset-0 z-0`}>
      <div className="app-bg__glow" />
      <div className="app-bg__grain" />
    </div>
  )
}
