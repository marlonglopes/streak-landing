# Architecture

Single source of truth for how Streak is put together and why.

## Stack

| Layer             | Choice                          | Why                                                                                             |
| ----------------- | ------------------------------- | ----------------------------------------------------------------------------------------------- |
| UI framework      | Next.js 14 (App Router)         | Server components, route groups, streaming, edge middleware, one-click Vercel deploy.           |
| Language          | TypeScript (strict)             | Catches 80% of bugs before runtime. Non-negotiable.                                             |
| Styling           | Tailwind CSS                    | Design tokens live in `tailwind.config.ts`; no CSS-in-JS runtime; cheap to refactor.            |
| Fonts             | Inter + Fraunces via next/font  | Self-hosted at build, zero CLS, offline-friendly.                                               |
| Icons             | lucide-react                    | Tree-shakable SVG; consistent stroke weight.                                                    |
| Backend           | Supabase (Postgres + Auth)      | Solo-dev speed. Postgres + RLS gives us a real DB without building an auth service.             |
| Auth              | Supabase Auth (magic link)      | No passwords to manage. OAuth can be added later without schema changes.                        |
| Payments          | Stripe (Checkout + Portal)      | Industry standard. Portal offloads billing UI to Stripe.                                        |
| Deployment        | Vercel                          | First-party Next.js host; previews on every PR.                                                 |
| Error tracking    | Sentry *(Phase 2+)*             | Deferred. Console logs are fine for <100 users.                                                 |
| Product analytics | PostHog *(Phase 2+)*            | Deferred. Combines analytics + feature flags + session replay; single tool.                     |

## Repository layout

```
streak-landing/
├── app/
│   ├── (marketing)/          # Public pages. The route group is invisible in URLs.
│   │   └── page.tsx          # Landing page at /
│   ├── globals.css           # Tailwind directives + body defaults
│   └── layout.tsx            # Root <html>/<body>, font variables, metadata
├── components/               # Marketing UI. Phase 1 will add components/app/ for product UI.
├── lib/supabase/
│   ├── client.ts             # Browser client (use in 'use client' components)
│   ├── server.ts             # Server client (use in Server Components & Server Actions)
│   └── middleware.ts         # updateSession() — session refresh + auth gate
├── middleware.ts             # Runs on every request; delegates to lib/supabase/middleware
├── supabase/migrations/      # Versioned SQL. Run in order; never edit a merged migration.
├── docs/                     # ARCHITECTURE, SPRINTS, MEMORY
├── .env.example              # Template for .env.local (never commit real secrets)
└── CLAUDE.md                 # Orientation for Claude Code sessions
```

**Conventions:**
- Route groups (`(name)`) separate concerns without affecting URLs.
- Server components by default; `"use client"` only when the component needs browser APIs or state.
- `lib/` holds framework-agnostic helpers; UI goes in `components/` or `app/*/components/`.

## Data model

All tables live in the `public` schema and have Row Level Security enabled. The canonical sources are [supabase/migrations/0001_init.sql](../supabase/migrations/0001_init.sql), [supabase/migrations/0002_locale.sql](../supabase/migrations/0002_locale.sql), and [supabase/migrations/0003_reminders.sql](../supabase/migrations/0003_reminders.sql).

```
auth.users  (Supabase-managed)
    │ 1:1
    ▼
profiles ─── 1:N ───► habits ─── 1:N ───► check_ins
  id                     id                  habit_id
  timezone               name                 user_id
  locale                 cadence              local_date  ← UNIQUE per (habit, date)
  subscription_tier      target_days          checked_in_at
  stripe_customer_id
  preferred_reminder_channel     └── 1:N ───► reminder_sends
  quiet_hours_start/end                        habit_id
  unsubscribed_at                              local_date
                                               channel
                                               status       ← UNIQUE (habit, date, channel)
```

### Key invariants

- **Every `auth.users` row has exactly one `profiles` row.** The `handle_new_user` trigger creates it. If you manually insert into `auth.users`, the trigger fires.
- **`check_ins.local_date` is a `DATE` in the user's local timezone.** Not UTC. This is load-bearing — see [Timezone strategy](#timezone-strategy).
- **`UNIQUE (habit_id, local_date)`** prevents double-logging the same day for the same habit. The app should treat double-checkin as idempotent (upsert).
- **RLS: `auth.uid() = user_id`** on every owned row. Never rely on service role for reads — always go through the anon key as the user.

### Streak calculation

**On-demand, not materialized.** Query:

```sql
select local_date
from check_ins
where habit_id = $1
order by local_date desc;
```

Then in application code: walk backward from today in the user's timezone, counting consecutive days that meet the habit's `target_days_of_week` pattern. Stop at the first gap.

**Why not materialize:** streaks are cheap to recompute, and cached streak columns are a bug magnet (invalidation on backdated check-ins, timezone changes, habit edits). If this becomes slow at scale, revisit with a materialized view — not a trigger-maintained column.

## Timezone strategy

This is the single biggest correctness risk in a habit tracker.

**Rule:** the database stores `local_date` as a `DATE` in the user's current timezone. The server never computes "today" — it asks the client, or reads `profiles.timezone`.

**Flow on check-in:**
1. Client computes `local_date` using `Intl.DateTimeFormat` with the user's timezone.
2. Server Action receives `local_date` (validated against `profiles.timezone` ± one-day slack for DST / travel).
3. `insert into check_ins (habit_id, user_id, local_date) on conflict (habit_id, local_date) do nothing`.

**DST and travel:** because we store local dates, a user flying from NYC to Tokyo will never see their streak "skip" or "double". If they change their `profiles.timezone`, prior check-ins are still correct (they're calendar dates, not instants).

**Tests required before Phase 3 ships** — see [docs/MEMORY.md → Risks](MEMORY.md#known-risks).

## Localization

Two locales today: **`en`** and **`pt-BR`**. Framework: `next-intl@3` in App Router mode. No URL-based locale routing — every route serves whichever locale resolves for the current request.

**Resolution order** (see [lib/i18n/request.ts](../lib/i18n/request.ts)):
1. Signed-in user's `profiles.locale` (authoritative — follows them across devices).
2. `NEXT_LOCALE` cookie (anonymous visitor who used the switcher).
3. `Accept-Language` header (first visit, language-aware fallback).
4. `DEFAULT_LOCALE` (`en`).

**Where strings live:**
- Dictionaries: `locales/en.json`, `locales/pt-BR.json`. ICU format — use `{count, plural, one {...} other {...}}` for counted strings and `{x, select, yes {...} other {...}}` for branching.
- Server components: `await getTranslations("namespace")`.
- Client components: `useTranslations("namespace")` (the root layout wraps everything in `NextIntlClientProvider`).
- Server Action error messages: translate at the action before encoding into the redirect URL.

**Dates and weekday labels:** always go through `Intl.DateTimeFormat(locale, ...)`. Never hardcode month or weekday arrays. See `HabitForm`, `HabitHeatmap`, and the Today eyebrow for the pattern.

**Switching locale:** `LocaleSwitcher` calls the `setLocale` Server Action, which writes `profiles.locale` for signed-in users and always sets the `NEXT_LOCALE` cookie (1 year). `revalidatePath("/", "layout")` re-renders everything in the new language.

**Adding a new locale:**
1. Add the tag to `LOCALES` in `lib/i18n/config.ts`.
2. Update the CHECK constraint in a new migration (don't edit `0002_locale.sql`).
3. Create `locales/<tag>.json` matching every key in `en.json`.
4. Extend `matchAcceptLanguage` if the header detection needs to grow.
5. Add the option to `localeSwitcher.*` in every dictionary.

## Reminders

Daily reminders are opt-in (default on) and single-channel per user — we pick one channel for the whole user, not per habit. Rationale in [docs/MEMORY.md](MEMORY.md#decisions).

**Schema** ([supabase/migrations/0003_reminders.sql](../supabase/migrations/0003_reminders.sql)):
- `profiles.preferred_reminder_channel` — `'email'` or `'none'`. Widened to include `'whatsapp'` in Sprint 2.4.
- `profiles.quiet_hours_start / _end` — inclusive/exclusive window in the user's timezone. `end < start` wraps past midnight.
- `profiles.unsubscribed_at` — one-click unsubscribe timestamp. Non-null means skip the user.
- `reminder_sends` — idempotency + audit log. UNIQUE `(habit_id, local_date, channel)` ensures a duplicate cron tick can't double-send.

**Dispatch flow** (every 15 minutes via Vercel Cron):
1. `GET /api/cron/reminders` — auth'd via `Authorization: Bearer $CRON_SECRET`.
2. Service-role client loads candidate users (`preferred_reminder_channel='email'`, `unsubscribed_at IS NULL`), their active habits, and the last few days of check-ins.
3. For each `(habit × user)` pair, `decideDispatch()` in [lib/reminders/dispatch.ts](../lib/reminders/dispatch.ts) answers yes/no with a reason (`unsubscribed`, `channel_none`, `already_checked_in`, `not_target_day`, `quiet_hours`, `before_reminder_time`). Pure function — heavily unit tested.
4. Insert a `reminder_sends` row with `status='pending'` *before* calling the provider. Unique-key conflict = another tick already claimed it; skip.
5. Send via Resend (`lib/email/resend.ts`). `RESEND_DRY_RUN=1` logs the payload and returns synthetic success — the default in development.
6. Update the row with `status='sent' | 'failed' | 'rejected'` and the provider id.

**Unsubscribe:** email footer links to `/r/unsub?t=<token>`. Token is HMAC-SHA256 over the user id signed with `UNSUB_TOKEN_SECRET`. No DB lookup needed to validate — rotating the secret invalidates every outstanding link (acceptable; we'd only rotate after a leak).

**Dev loop:** leave `RESEND_DRY_RUN=1` in `.env.local`. Hit `/api/cron/reminders` locally with `curl -H "Authorization: Bearer $CRON_SECRET"` and the handler runs end-to-end without sending. Flip to `0` only after domain verification (SPF + DKIM + DMARC) in Resend.

## Auth flow

```
┌─────────────┐   magic link   ┌──────────────┐   trigger   ┌──────────┐
│ /login      │───────────────►│ auth.users   │────────────►│ profiles │
│ form        │                │ (row inserted│             │ (auto-   │
│             │                │  by Supabase)│             │  created)│
└─────────────┘                └──────────────┘             └──────────┘
       │                               │
       ▼                               ▼
┌─────────────┐   session cookie ┌──────────────────┐
│ /auth/      │◄─────────────────│ Supabase session │
│ callback    │                  └──────────────────┘
└─────────────┘
       │
       ▼
┌─────────────┐       middleware on every request
│ /app/today  │◄──── updateSession() refreshes the token,
└─────────────┘      redirects unauthenticated users to /login
```

- **Public routes:** `/`, `/pricing`, `/login`, `/signup`.
- **Gated routes:** anything under `/app/*`. Middleware redirects to `/login?next=<path>` when no session.
- **Server Components:** call `createClient()` from `lib/supabase/server.ts` and use the authenticated session automatically via cookies.
- **Client Components:** call `createClient()` from `lib/supabase/client.ts`; session cookies are read directly by the browser SDK.

## Environment variables

Copy [.env.example](../.env.example) to `.env.local`. Never commit `.env.local`.

| Variable                           | Scope       | Purpose                                                               |
| ---------------------------------- | ----------- | --------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`         | Client+Srv  | Supabase project URL. Safe to expose.                                 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`    | Client+Srv  | Anon key. Safe to expose — RLS enforces isolation.                    |
| `SUPABASE_SERVICE_ROLE_KEY`        | **Server**  | Bypasses RLS. **Never** prefix with `NEXT_PUBLIC_`. Used for webhooks and admin ops only. |
| `STRIPE_SECRET_KEY`                | Server      | Stripe API. Phase 3.                                                  |
| `STRIPE_WEBHOOK_SECRET`            | Server      | Verifies Stripe webhook signatures. Phase 3.                          |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`| Client     | Stripe.js initialization. Phase 3.                                    |
| `RESEND_API_KEY`                   | Server      | Resend API key for reminder emails (Sprint 2.3). Free tier: 3k/mo.    |
| `RESEND_FROM_EMAIL` / `_FROM_NAME` | Server      | Verified sender identity. Domain needs SPF + DKIM + DMARC before live.|
| `RESEND_DRY_RUN`                   | Server      | `1` skips the API call and logs the payload. Default in dev.          |
| `CRON_SECRET`                      | Server      | Shared secret the cron caller (GitHub Actions) sends as `Authorization: Bearer …`. |
| `UNSUB_TOKEN_SECRET`               | Server      | HMAC key for one-click unsubscribe tokens. Long-lived; rotate rarely. |
| `NEXT_PUBLIC_SITE_URL`             | Client+Srv  | Base URL for links inside emails (unsub, check-in).                   |

**Safety rails:**
- `middleware.ts` no-ops gracefully if Supabase env vars are missing, so the marketing site still builds/runs without a backend.
- Anything prefixed `NEXT_PUBLIC_` is bundled into client JS. Double-check before adding.

## Deployment

- **Vercel** for the Next.js app. Preview deploys on every PR.
- **Supabase** is managed — migrations applied via the SQL editor or `supabase` CLI (we'll adopt the CLI once there's a 2nd migration).
- **No CI yet.** Yolo'd for MVP. Typecheck + lint run via `npm run build`. Add GitHub Actions at beta.

## Security

- **RLS on every table.** Never disable RLS on a new table.
- **Service role key lives only on the server.** It's the nuke button.
- **Stripe webhook endpoint verifies signatures.** Phase 3.
- **No PII beyond email.** Don't add `address`, `phone`, etc. without thinking about GDPR/CCPA implications.

## Commits and branches

- **Conventional Commits** for every commit — see the [spec](https://www.conventionalcommits.org/). Scopes are optional (`feat(pricing): ...`).
- **Trunk-based** for now: direct pushes to `main` while solo. Switch to PR-only when a second contributor joins.

## Where to add stuff

| What                  | Where                                  |
| --------------------- | -------------------------------------- |
| New marketing page    | `app/(marketing)/new-page/page.tsx`    |
| New product page      | `app/(app)/new-page/page.tsx`          |
| Shared utility        | `lib/`                                 |
| DB schema change      | `supabase/migrations/NNNN_name.sql` (next number) |
| Design token          | `tailwind.config.ts` under `theme.extend` |
| Reusable UI component | `components/ui/` (create when needed)  |
