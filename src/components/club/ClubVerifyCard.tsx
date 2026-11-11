import { Send } from "lucide-react"
import { clubVerifyCode, SANDER_INSTAGRAM, SANDER_INSTAGRAM_DM } from "@/lib/clubVerify"
import { CopyTextButton } from "./CopyTextButton"

/** Shown to a club's people while the request waits: the code to send from the club's Instagram. */
export function ClubVerifyCard({ clubId, instagram }: { clubId: string; instagram: string | null }) {
  const code = clubVerifyCode(clubId)
  return (
    <section className="flex flex-col gap-3 rounded-2xl bg-[var(--surface-2)] p-4 ring-1 ring-[var(--accent-line)]">
      <h2 className="eyebrow text-[var(--accent)]">Conferma che il club è vostro</h2>
      <p className="text-base text-white">
        Manda questo codice in un messaggio diretto a <b>@{SANDER_INSTAGRAM}</b>{" "}
        {instagram ? (
          <>
            dal profilo Instagram del club, <b>@{instagram}</b>.
          </>
        ) : (
          <>dal profilo Instagram del club.</>
        )}
      </p>
      <p className="select-all rounded-xl bg-[var(--surface-3)] py-3 text-center font-display text-2xl font-extrabold tracking-wider text-[var(--accent)]">{code}</p>
      <div className="grid grid-cols-2 gap-2">
        <CopyTextButton text={code} label="Copia codice" className="min-h-[3.5rem] px-2" />
        <a href={SANDER_INSTAGRAM_DM} target="_blank" rel="noopener noreferrer" className="btn btn-primary min-h-[3.5rem] gap-2 px-2">
          <Send className="h-5 w-5" aria-hidden="true" /> Apri Instagram
        </a>
      </div>
      <p className="text-sm text-[var(--muted-text)]">
        Il messaggio deve partire dall&apos;account del club, non da un profilo personale. Appena lo riceviamo approviamo il club e ti arriva una notifica.
        {!instagram && " Se il club non ha Instagram, scrivici dall'email ufficiale della società."}
      </p>
    </section>
  )
}
