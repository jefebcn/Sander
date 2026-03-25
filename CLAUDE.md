@AGENTS.md

# Sander — Project Conventions

## Stack
- **Framework**: Next.js 15 (App Router) + TypeScript
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
