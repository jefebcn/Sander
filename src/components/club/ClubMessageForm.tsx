"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Send } from "lucide-react"
import { toast } from "sonner"
import { sendClubMessage } from "@/actions/clubs"

interface Audience { tournamentId: string | null; label: string }

/** Staff: one notification to the followers or to a tournament's players. */
export function ClubMessageForm({ clubId, audiences }: { clubId: string; audiences: Audience[] }) {
  const [to, setTo] = useState(audiences[0]?.tournamentId ?? "")
  const [body, setBody] = useState("")
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        startTransition(async () => {
          const res = await sendClubMessage({ clubId, tournamentId: to || null, body })
          if (!res.ok) return void toast.error(res.error)
          toast.success(res.sentTo === 1 ? "Mandato a 1 giocatore" : `Mandato a ${res.sentTo} giocatori`)
          setBody("")
          router.refresh()
        })
      }}
    >
      <label htmlFor="club-msg-to" className="text-sm font-bold text-[var(--muted-text)]">A chi</label>
      <select
        id="club-msg-to"
        value={to}
        onChange={(e) => setTo(e.target.value)}
        className="min-h-[3.5rem] w-full rounded-2xl bg-[var(--surface-2)] px-4 text-base text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      >
        {audiences.map((a) => (
          <option key={a.tournamentId ?? "followers"} value={a.tournamentId ?? ""}>{a.label}</option>
        ))}
      </select>
      <label htmlFor="club-msg-body" className="text-sm font-bold text-[var(--muted-text)]">Messaggio</label>
      <textarea
        id="club-msg-body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={300}
        placeholder="Es. Si inizia alle 10, portate i palloni"
        className="w-full resize-none rounded-2xl bg-[var(--surface-2)] px-4 py-3 text-base text-white placeholder:text-[var(--muted-text)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      />
      <button type="submit" disabled={pending || body.trim().length < 5} className="btn btn-primary w-full gap-2 disabled:opacity-50">
        {pending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
        Manda la notifica
      </button>
    </form>
  )
}
