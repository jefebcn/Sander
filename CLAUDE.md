@AGENTS.md

# Sander — Project Conventions

## Stack
- **Framework**: Next.js 16 (App Router; leggere AGENTS.md) + TypeScript
- **Styling**: Tailwind CSS v4 + custom CSS variables in `globals.css`
- **Components**: Radix UI primitives + custom components (no shadcn CLI; use raw Radix)
- **DB**: PostgreSQL + Prisma 7 (generated client at `src/generated/prisma`)
- **State**: `@tanstack/react-query` v5 for all async server-fetched data
- **Validation**: Zod on every Server Action input (no exceptions)
- **Icons**: **Lucide React ONLY** — no heroicons, no custom SVGs, no other icon libraries
- **Tests**: Vitest — pure algorithm logic tests in `*.test.ts` alongside source files

## Architecture
```
src/
  actions/          # Server Actions ("use server") — Zod-validated, revalidatePath on mutation
  app/              # Next.js App Router pages & layouts
  components/
    layout/         # AppShell, MobileNav, PageHeader
    player/         # SanderCard, SanderCardMini, CreatePlayerForm
    tournament/     # LiveDashboard, MatchCard, StandingsTable, BracketView, etc.
  generated/prisma/ # Auto-generated Prisma client (never edit manually)
  lib/
    db.ts           # Prisma singleton
    providers.tsx   # QueryClientProvider (client component)
    tournament/     # Pure algorithm functions (no DB imports)
    utils.ts        # cn(), winRate(), formatDate()
    validators/     # Zod schemas
```

## Naming Conventions
- **Files**: `PascalCase.tsx` for components, `camelCase.ts` for utilities/actions
- **Server Actions**: verb-noun camelCase — `createTournament`, `submitScore`, `getPlayer`
- **Hooks**: `useCamelCase` — `useTournament`, `useStandings`
- **React Query keys**: `["entity", id]` pattern — `["dashboard", tournamentId]`
- **Commits**: `feat:`, `fix:`, `chore:`, `test:` prefixes

## Patterns

### Server Action pattern
```typescript
"use server"
import { ZodSchema } from "@/lib/validators/foo.schema"

export async function doSomething(input: unknown) {
  const data = ZodSchema.parse(input)   // always validate first
  // ... db operations ...
  revalidatePath("/relevant-path")
  return result
}
```

### React Query mutation with optimistic update
```typescript
const mutation = useMutation({
  mutationFn: (input) => serverAction(input),
  onSettled: () => qc.invalidateQueries({ queryKey: ["entity", id] }),
})
```

## UI / UX Conventions
- **Dark mode always**: The app is dark-only. Never add light-mode conditionals.
- **Touch targets**: Minimum `min-h-[3.5rem]` (56px) for any interactive element.
- **Font sizes**: Minimum `text-base` for body content; `text-lg`+ for scores/headings.
- **CSS variables**: Use `var(--accent)`, `var(--surface-1)`, etc. from `globals.css` — do NOT hardcode hex colours.
- **Outdoor contrast**: Prefer white text on dark surfaces. Amber `var(--accent)` for primary CTAs.

## Database
- **Prisma version**: 7 — config is in `prisma.config.ts`, not `schema.prisma`
- **Migrations**: `npx prisma migrate dev --name <description>`
- **Generate client**: `npx prisma generate`
- **Never edit** generated files in `src/generated/prisma/`

## Testing
- Run: `npx vitest run`
- All algorithm tests (`kotb.test.ts`, `bracket.test.ts`, `standings.test.ts`) must pass before any merge
- Tests live alongside source: `src/lib/tournament/*.test.ts`

## Social content
- Instagram stories: start from `scripts/content-storie/` (approved style, generator, backgrounds, rules in its README)
- Generated photos: barefoot players, no logos or text on clothes, no alcohol
- Positioning: sport first, with a romantic side as a nuance only ("match in campo e fuori", "il primo appuntamento è un 2v2"); never promise dates or love. Ads stay sport-framed (no dating claims). Scopri is 18+ only.
- Reels from other people's videos: only with the author's permission. Foreign videos get English text and captions. Recipe in `docs/RICETTE.md`.

## Ripartenza: sapere a che punto siamo (pochi token)

All'inizio di ogni sessione (o quando Alex scrive «RIPRENDI <progetto>»), prima di qualsiasi altro file:
1. Questo CLAUDE.md è già caricato: non rileggerlo.
2. Leggi `docs/STATO.md` (corto: dove siamo, cosa è aperto, prossimo passo, decisioni recenti di Alex).
3. Controlla cosa è successo dopo la data di STATO.md, che è la fonte più precisa: `git log --oneline -15` e `git status -s` (altre chat, PR unite, automazioni). Se git e STATO non coincidono, vale git, e lo dici in una riga.
4. Se Alex ha già detto il lavoro di oggi, grep della parola chiave in `docs/RICETTE.md`, poi apri solo i documenti di quell'area. Se non l'ha detto, riassumi in 3 righe dove siamo e chiedi soltanto cosa fare oggi e se è cambiato qualcosa fuori dal repo (pannelli, store, social).
5. Non esplorare il repo e non aprire documenti grandi prima di sapere il lavoro.

## Fine lavoro: salvare il punto e imparare senza appesantire

Quando Alex scrive «SESSIONE FINITA» (o un lavoro si chiude), prima della risposta finale:
1. **Riscrivi `docs/STATO.md`** (al massimo ~40 righe, si sostituisce, non si accoda), con le sezioni: data e tema della sessione; Dove siamo (3-6 righe); Aperto / in corso (con file o PR); Prossimo passo consigliato; Decisioni recenti di Alex ancora valide; Attenzione (trappole attive). Le cose chiuse escono dallo STATO: restano in git.
2. Ripensa alla sessione senza rileggere file: cosa è costato più tentativi o letture, cosa ha funzionato al primo colpo, cosa si ripeterà.
3. Salva solo ciò che fa risparmiare la volta dopo, nel posto giusto:
   - regola valida per tutto il progetto (comando, trappola, scelta di Alex) → una riga in questo CLAUDE.md;
   - dettaglio di un'area (come funziona un modulo, un servizio, un deploy) → il documento di quell'area già indicato sopra;
   - lavoro che si ripete (pubblicare, importare, rigenerare, rilasciare) → una riga in `docs/RICETTE.md` (crealo se manca): `COSA | comando o script | trappole | la prossima volta: …`.
4. Limiti di peso, perché questo file si carica in ogni sessione: CLAUDE.md al massimo ~8 KB; righe corte; se una riga nuova sostituisce una vecchia, togli la vecchia; niente diario («fatto il …»), niente elenchi di commit, niente stato del giorno qui (va in STATO.md).
5. Commit di STATO, RICETTE e CLAUDE.md insieme al lavoro (stesso ramo o stessa PR).
6. Nella risposta finale, una riga: cosa hai salvato e dove.
