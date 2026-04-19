# Claude orientation

Read this first. This file is loaded automatically into every Claude Code session in this repo.

## What this project is

Streak — a web-first habit-tracking app. Next.js 14 App Router, TypeScript, Tailwind, Supabase, Stripe. Solo dev pairing with Claude; MVP target ~14–18 weeks.

## Before you start a task

- [**docs/SPRINTS.md**](docs/SPRINTS.md) — current phase, what's done, what's next.
- [**docs/ARCHITECTURE.md**](docs/ARCHITECTURE.md) — stack choices, data model, conventions, where things live.
- [**docs/MEMORY.md**](docs/MEMORY.md) — decisions log, non-goals, known risks, glossary. **Check non-goals before adding scope.**

## House rules

1. **Conventional Commits are mandatory.** `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`. Scope optional: `feat(auth): ...`. Subject ≤72 chars, imperative, no trailing period.
2. **Don't edit past migrations.** Add a new one in `supabase/migrations/NNNN_name.sql`.
3. **RLS on every new table.** Non-negotiable.
4. **Server components by default.** `"use client"` only when the component needs browser APIs, state, or event handlers.
5. **Timezones are load-bearing.** Store `local_date` (a `DATE`), never UTC timestamps for check-ins. See ARCHITECTURE → Timezone strategy.
6. **Don't materialize streaks.** Compute on demand. See ARCHITECTURE → Streak calculation.
7. **Respect the non-goals list** in [docs/MEMORY.md](docs/MEMORY.md#non-goals-explicitly-deferred). If unsure whether something belongs, ask.

## When you finish a task

1. Update [docs/SPRINTS.md](docs/SPRINTS.md) — check the boxes you completed.
2. If you made a decision worth remembering, append it to [docs/MEMORY.md](docs/MEMORY.md#decisions).
3. Commit with a Conventional Commit message.

## Env quirks in this dev machine

- Node 18.19 (EOL — plan to upgrade to 20). Supabase SDK will warn.
- `~/.npmrc` has `package-lock=false`; no `package-lock.json` will be generated. Deps are pinned in `package.json`.
- `npm install <pkg>` may not update `package.json` in this env. Manually add to `dependencies` then run `npm install`.

## Who's in charge of what

- **Claude:** code, schema migrations, docs, commits.
- **User:** creates external accounts (Supabase, Stripe, Vercel, Resend, Sentry, PostHog), pastes API keys into `.env.local`.
