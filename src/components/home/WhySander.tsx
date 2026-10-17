import { CrestBadge, CrestHeading } from "./Crest"

/**
 * The four questions a newcomer has, answered in their words: why use it, why
 * come back, why reopen it after every match, and how to be quick about it.
 * The real competitor is the beach's WhatsApp group, so say what it can't do.
 */
function answers(variant: "guest" | "player", hasOpenMatches: boolean) {
  return [
    {
      q: "Perché usarla?",
      a: "Trovi la partita senza 40 messaggi nel gruppo.",
      more: "Vedi chi c'è e quanti posti mancano. Se qualcuno dà buca, il primo in lista d'attesa riceve subito la notifica.",
    },
    {
      q: "Perché tornarci?",
      a: "Ogni settimana nuove partite e un Re da battere.",
      more: "Le partite del tuo comune, la classifica del comune e del bagno, una divisione da scalare.",
    },
    {
      q: "Perché riaprirla dopo ogni partita?",
      a: "Perché è lì che la partita conta.",
      more: "Appena il risultato è segnato vedi quanto è salito il tuo rating, dove sei nel tuo comune e la carta aggiornata. Poi la condividi, o ne organizzi subito un'altra.",
    },
    variant === "guest"
      ? {
          q: "C'è un modo rapido?",
          a: "Tre passi e sei in campo.",
          more: "Crei la carta in 30 secondi, scegli una partita con un posto libero, tocchi Entra.",
        }
      : {
          q: "C'è un modo rapido?",
          a: "Un tocco su Entra e sei in campo.",
          more: hasOpenMatches
            ? "Lo trovi sui posti liberi qui sopra. Crea, trova, sono libero e segna sono sempre nel + in basso."
            : "Apri Trova e scegli un posto libero. Crea, trova, sono libero e segna sono sempre nel + in basso.",
        },
  ]
}

export function WhySander({ variant, hasOpenMatches = false }: { variant: "guest" | "player"; hasOpenMatches?: boolean }) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby="why-title">
      <CrestHeading id="why-title" eyebrow="Le domande di tutti" title="Perché SANDER" />
      <ol className="flex flex-col gap-2">
        {answers(variant, hasOpenMatches).map((x, i) => (
          <li
            key={x.q}
            className="rise-in flex items-start gap-4 rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-4 ring-1 ring-[var(--crest-hair)]"
            style={{ "--i": i } as React.CSSProperties}
          >
            <CrestBadge tone="white" className="mt-0.5 h-11 w-10 text-lg">{i + 1}</CrestBadge>
            <span className="min-w-0">
              <span className="eyebrow block text-[var(--accent)]">{x.q}</span>
              <span className="mt-0.5 block text-lg font-extrabold leading-snug text-white">{x.a}</span>
              <span className="mt-1 block text-base leading-snug text-[var(--muted-text)]">{x.more}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  )
}
