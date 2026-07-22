export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { MessageCircle, Users, Search } from "lucide-react"
import { getThreads, getChatCompanions } from "@/actions/messages"
import { getCurrentPlayer } from "@/lib/getCurrentPlayer"
import { PageHeader } from "@/components/layout/PageHeader"
import { CompanionsStrip } from "@/components/chat/CompanionsStrip"
import { NewGroupButton } from "@/components/chat/NewGroupButton"
import { ChatNotifyPrompt } from "@/components/chat/ChatNotifyPrompt"

function relTime(iso: string | null): string {
  if (!iso) return ""
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return "ora"
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const days = Math.floor(h / 24)
  if (days < 7) return `${days}g`
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit" })
}

export default async function MessagesPage() {
  const me = await getCurrentPlayer()
  if (!me) redirect("/auth/signin?callbackUrl=/messaggi")

  const [threads, companions] = await Promise.all([getThreads(), getChatCompanions()])

  return (
    <div className="pb-24">
      <PageHeader title="Messaggi" action={<NewGroupButton meId={me.id} />} />

      <ChatNotifyPrompt />

      <CompanionsStrip companions={companions} />

      {threads.length === 0 ? (
        <div className="flex flex-col items-center gap-4 px-6 pt-16 text-center">
          <MessageCircle className="h-12 w-12 opacity-20" />
          <div>
            <p className="font-bold text-white">Ancora nessuna conversazione</p>
            <p className="mt-1 text-sm text-[var(--muted-text)]">
              Trova un compagno al tuo livello e scrivigli per organizzare una partita 🏐
            </p>
          </div>
          <Link
            href="/trova"
            className="flex min-h-[3.25rem] items-center justify-center gap-2 rounded-2xl px-6 font-black text-black"
            style={{ background: "var(--accent)" }}
          >
            <Search className="h-5 w-5" />
            Trova compagni
          </Link>
        </div>
      ) : (
        <div className="space-y-2 px-4">
          {threads.map((t) => (
            <Link
              key={t.id}
              href={`/messaggi/${t.id}`}
              className="flex items-center gap-3 rounded-2xl bg-[var(--surface-2)] p-3 active:opacity-80"
            >
              {/* Avatar / group icon */}
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--surface-3)]">
                {t.kind !== "DM" ? (
                  <Users className="h-6 w-6 text-[var(--accent)]" />
                ) : t.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={t.avatarUrl} alt={t.title} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-sm font-black text-[var(--muted-text)]">
                    {t.title.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Title + preview */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-bold text-white">{t.title}</p>
                  <span className="shrink-0 text-xs text-[var(--muted-text)]">{relTime(t.lastMessageAt)}</span>
                </div>
                <p className="truncate text-sm text-[var(--muted-text)]">
                  {t.lastMessage ?? "Nessun messaggio"}
                </p>
              </div>

              {/* Unread badge */}
              {t.unread > 0 && (
                <span
                  className="flex h-6 min-w-[1.5rem] shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-black text-black"
                  style={{ background: "var(--accent)" }}
                >
                  {t.unread > 9 ? "9+" : t.unread}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
