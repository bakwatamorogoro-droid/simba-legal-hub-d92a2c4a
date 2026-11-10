<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Simba Legal Academy — Developer Notes

TanStack Start (SSR) + React 19 + Vite + Tailwind v4 + Supabase + Drizzle.

## Commands

- Dev: `npx vite dev --port 12000 --host 0.0.0.0`
- Build: `npm run build` (Vite does NOT typecheck)
- Typecheck: `npx tsc --noEmit` (must stay at 0 errors)
- Lint: `npx eslint .` — the repo has ~900 pre-existing `prettier/prettier`
  formatting errors across every file; do not treat them as regressions.
  `react-hooks/rules-of-hooks` fires on `useSession` from
  `@tanstack/react-start/server` — a false positive, ignore it.

## Dependency pinning (important)

`package.json` pins `@tanstack/react-start`, `react-router`, `react-query`
and `router-plugin` to exact versions. Do NOT loosen these back to `^`:
newer releases remove the `useSession` server API and rename the server-fn
`validator` method, which breaks every route at runtime.

## Server functions & Supabase

- `src/lib/*.functions.ts` are server functions that ship to the client
  bundle. Never import a `*.server.ts` module at top level there — use
  `await import("@/integrations/supabase/client.server")` inside handlers.
- Privileged DB access goes through `supabaseAdmin` from
  `src/integrations/supabase/client.server.ts`. Its fetch wrapper is required
  for new-style Supabase keys (`sb_secret_...`), so always reuse it rather
  than constructing a fresh `createClient`.

## Required secrets

Local `.env` (tracked, public keys only) supplies `SUPABASE_URL` +
`SUPABASE_PUBLISHABLE_KEY`. Lovable Cloud injects `SUPABASE_SERVICE_ROLE_KEY`
and `ADMIN_SESSION_SECRET` at runtime; without them, data-loading routes show
a retryable error state locally.

## Data-loading UI

Data routes use `useQuery` with `retry: 1` and render `ErrorState`
(`src/components/query-state.tsx`) on `isError`, so a failed or hanging
request never leaves an infinite spinner.

## Pending database migration

`supabase/migrations/20260917064917_*.sql` adds the `annotations jsonb`
column to `submissions` and `group_submissions`. It is committed but not yet
applied to the linked Supabase project. Admin grading and the marked-paper
view tolerate its absence (they retry without the column), but apply the
migration to enable per-question annotations.
