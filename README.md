# Streak

A web-first habit-tracking app. Build habits that actually stick.

Currently shipping: landing page + Phase 0 scaffolding (Supabase client wiring, auth middleware, initial SQL schema). MVP target: ~14–18 weeks solo (see [docs/SPRINTS.md](docs/SPRINTS.md)).

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Supabase** — Postgres, Auth, RLS
- **Stripe** — subscriptions (Phase 3)
- **next/font** — Inter (body) + Fraunces (display)
- **lucide-react** — icons

## Quick start

Requires Node **20+** (Supabase SDK requirement; Node 18 works at runtime with a warning, but is EOL).

```bash
cd streak-landing
npm install
cp .env.example .env.local
# Fill in Supabase values — see docs/ARCHITECTURE.md#environment-variables
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command         | What it does                     |
| --------------- | -------------------------------- |
| `npm run dev`   | Dev server on port 3000          |
| `npm run build` | Production build + typecheck     |
| `npm run start` | Serve the production build       |
| `npm run lint`  | Next.js lint                     |

## Repository layout

```
streak-landing/
├── app/
│   ├── (marketing)/           # Public marketing pages (landing lives here)
│   │   └── page.tsx
│   ├── globals.css
│   └── layout.tsx             # Root layout: fonts, metadata
├── components/                # Landing page UI (Nav, Hero, Features, …)
├── lib/supabase/              # Client helpers (server, browser, middleware)
├── middleware.ts              # Session refresh + /app/* auth gate
├── supabase/migrations/       # Versioned SQL migrations
├── docs/                      # ARCHITECTURE, SPRINTS, MEMORY
├── .env.example
└── CLAUDE.md                  # Orientation file for Claude Code sessions
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full structure and why each piece is there.

## Documentation

- [**docs/ARCHITECTURE.md**](docs/ARCHITECTURE.md) — stack choices, data model, auth flow, conventions, env vars.
- [**docs/SPRINTS.md**](docs/SPRINTS.md) — full roadmap by phase and sprint, with current status.
- [**docs/MEMORY.md**](docs/MEMORY.md) — decision log, non-goals, known risks, open questions, glossary.
- [**CLAUDE.md**](CLAUDE.md) — orientation for Claude Code sessions (what to read first, house rules).

## Status

- ✅ **Phase 0** — Foundations (landing, Supabase wiring, schema, middleware) — live and verified
- 🚧 **Phase 1** — Auth + Habit CRUD (in progress)
- ⏳ **Phase 2** — Retention (stats, reminders)
- ⏳ **Phase 3** — Monetization (Stripe, streak freezes)
- ⏳ **Phase 4** — Social (friend challenges)
- ⏳ **Phase 5** — Mobile polish (PWA, offline)
- ⏳ **Phase 6** — Launch readiness
- ⏳ **Phase 7** — Growth

See [docs/SPRINTS.md](docs/SPRINTS.md) for sprint-level breakdown.

## Commit style

All commits follow the [Conventional Commits](https://www.conventionalcommits.org/) spec. Subject ≤72 chars, imperative mood, no trailing period.
