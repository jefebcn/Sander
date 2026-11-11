"use client"

import { useSyncExternalStore } from "react"
import { ArrowUpRight, Star } from "lucide-react"
import { useIsNativeApp, useNativePlatform } from "@/lib/native"
import { REVIEW_STATE_KEY, shouldAskReview, snoozeUntil, storeName, storeReviewUrl } from "@/lib/storeReview"

const CHANGE = "sander:review"

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE, onChange)
  window.addEventListener("storage", onChange)
  return () => {
    window.removeEventListener(CHANGE, onChange)
    window.removeEventListener("storage", onChange)
  }
}
function readState(): string | null {
  try {
    return localStorage.getItem(REVIEW_STATE_KEY)
  } catch {
    return null
  }
}
function writeState(value: string) {
  try {
    localStorage.setItem(REVIEW_STATE_KEY, value)
  } catch {}
  window.dispatchEvent(new Event(CHANGE))
}

function useStoreUrl(): string {
  const platform = useNativePlatform()
  const ua = useSyncExternalStore(() => () => {}, () => navigator.userAgent, () => "")
  return storeReviewUrl(platform, ua)
}

/** "Valuta l'app": the store page to review on, for the phone in hand. */
export function RateAppLink({ className }: { className?: string }) {
  const url = useStoreUrl()
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" onClick={() => writeState("done")} className={className}>
      Valuta l&apos;app su {storeName(url)}
      <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
    </a>
  )
}

/**
 * Once, in the app installed from a store, after a few games: the same plain
 * ask for everyone. "Non ora" comes back in a month; a review click never.
 */
export function ReviewNudge({ games }: { games: number }) {
  const native = useIsNativeApp()
  const state = useSyncExternalStore(subscribe, readState, () => "done")
  const url = useStoreUrl()
  if (!shouldAskReview({ games, native, state, now: new Date() })) return null

  return (
    <section className="rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-4" aria-labelledby="review-ask">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
          <Star className="h-5 w-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 id="review-ask" className="text-base font-extrabold text-white">Com&apos;è SANDER per te?</h2>
          <p className="mt-0.5 text-sm text-[var(--muted-text)]">
            Hai già giocato {games} partite. Una recensione su {storeName(url)} ci aiuta a far conoscere l&apos;app ad altri giocatori.
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => writeState(snoozeUntil(new Date()))} className="btn btn-secondary min-h-[3.25rem]">
          Non ora
        </button>
        <a href={url} target="_blank" rel="noopener noreferrer" onClick={() => writeState("done")} className="btn btn-primary min-h-[3.25rem]">
          Recensisci
        </a>
      </div>
    </section>
  )
}
