# Sprints

Roadmap from landing page to launched product. Each sprint is scoped for a solo dev pairing with Claude; estimate ~1 week per sprint.

**Status:** ✅ done · 🚧 in progress · ⏳ pending · ⏭ deferred

---

## Phase 0 — Foundations ✅

Goal: make it possible to build the product.

### Sprint 0.1 — Landing + scaffolding ✅
- [x] Next.js 14 app scaffolded
- [x] Tailwind + design tokens (navy / orange / cream)
- [x] Inter + Fraunces via `next/font`
- [x] Landing components: Nav, Hero, PhoneMockup, Features, Pricing, Footer
- [x] Responsive down to ~375px; hero stacks under 768px
- [x] Git repo initialized, first commit
- [x] Full project docs (README, ARCHITECTURE, SPRINTS, MEMORY, CLAUDE)

### Sprint 0.2 — Backend wiring ✅
- [x] Route group restructure (`app/(marketing)`)
- [x] Supabase SDK installed (`@supabase/supabase-js`, `@supabase/ssr`)
- [x] Client helpers: `lib/supabase/{server,client,middleware}.ts`
- [x] Root `middleware.ts` with auth gate for `/app/*`
- [x] v1 SQL migration: `profiles`, `habits`, `check_ins` + RLS + triggers
- [x] `.env.example` with Supabase + Stripe placeholders

### Sprint 0.3 — Account setup ✅
- [x] Supabase project created; URL + publishable + secret keys in `.env.local`
- [x] `0001_init.sql` run in Supabase (verified: `profiles`, `habits`, `check_ins` + RLS all live)
- [x] Dev server smoke-tested: `/` serves, `/app` redirects to `/login?next=/app` via middleware
- [ ] Email magic-link auth enabled in Supabase dashboard *(configure in Phase 1.1)*
- [ ] Vercel project created *(deferred until Phase 1 ships)*

### Deferred from Phase 0 ⏭
- GitHub Actions CI — revisit at beta.
- Sentry — revisit at Phase 2.
- PostHog — revisit at Phase 2.

---

## Phase 1 — Auth & Habit CRUD 🚧

Goal: a real user can log in and track habits.

### Sprint 1.1 — Auth 🚧
- [x] `/login` page (email magic link input)
- [x] `/auth/callback` route (exchanges code for session)
- [x] `/app` layout with user-aware header (email, sign out)
- [x] Sign-out Server Action
- [x] TypeScript types for Database *(hand-written in `lib/database.types.ts`; swap to `supabase gen types` output when CLI is adopted)*
- [x] Marketing CTAs (`Nav`, `Hero`, `Pricing`, `Footer`) point to `/login`
- [x] Build + route-level smoke test: `/`, `/login`, `/app` (redirects), `/auth/callback` (error path) all behave
- [ ] **Live smoke test** — send a real magic link, click it, confirm session lands on `/app` *(user action — see Phase 1.1 follow-up below)*

### Phase 1.1 follow-up — Supabase dashboard config *(user action)*
- [ ] **Authentication → URL Configuration → Redirect URLs:** add `http://localhost:3000/auth/callback` (and production URL once deployed)
- [ ] **Authentication → Providers → Email:** confirm magic-link is enabled (default)
- [ ] *(Optional)* **Authentication → Email Templates → Magic Link:** customize copy to sound like Streak

### Sprint 1.2 — Habits & check-ins
- [ ] `/app/today` view: list of active habits with one-tap check-in
- [ ] `/app/habits/new` form (name, emoji, cadence, target days, reminder time)
- [ ] `/app/habits/[id]/edit` form
- [ ] Archive / delete actions
- [ ] Free-tier enforcement: max 3 habits (soft paywall — see Phase 3)
- [ ] Streak calculation utility in `lib/streaks.ts`
- [ ] **Tests for streak math** — DST transitions, timezone changes, gaps, partial weeks (target: 100% coverage on this module)

---

## Phase 2 — Retention loop ⏳

Goal: users come back tomorrow.

### Sprint 2.1 — Stats & history
- [ ] `/app/habits/[id]` detail view
- [ ] Calendar heatmap (GitHub-style) per habit
- [ ] Current streak + longest streak surfaces
- [ ] Weekly and monthly completion rates
- [ ] Empty states for brand-new habits

### Sprint 2.2 — Reminders (email MVP)
- [ ] Resend account + domain verification
- [ ] `reminder_time` wired to a daily cron (Vercel Cron or Supabase Edge Function)
- [ ] Email template: "Don't break your streak"
- [ ] Unsubscribe link + quiet-hours setting on profile
- [ ] Per-user timezone respected

### Added observability *(entering user territory)*
- [ ] Sentry wired (error boundaries + source maps)
- [ ] PostHog wired (`$pageview`, `habit_created`, `checkin`, `streak_extended`)

---

## Phase 3 — Monetization ⏳

Goal: turn on revenue.

### Sprint 3.1 — Stripe integration
- [ ] Stripe products: Streak Free ($0), Streak Pro ($4/mo)
- [ ] `/api/stripe/checkout` endpoint → redirect to Stripe Checkout
- [ ] `/api/stripe/webhook` endpoint (signature verification + idempotency)
- [ ] `subscription_tier`, `stripe_customer_id`, `stripe_subscription_id` kept in sync
- [ ] Billing portal link from `/app/settings`
- [ ] Paywall UX on 4th habit, on stats export, on streak freezes

### Sprint 3.2 — Streak freezes
- [ ] `freezes_available` and `freezes_earned_at` columns on `habits` (or a new `freezes` table)
- [ ] Earn rule: +1 freeze per 7 consecutive check-ins, capped at 3
- [ ] Spend rule: auto-spend on missed day within a 24h grace window; user can also manually bank
- [ ] Freeze indicator on heatmap (distinct from check-in)
- [ ] Header badge: "1 freeze available"

---

## Phase 4 — Social ⏳

Goal: accountability and sharing.

### Sprint 4.1 — Friend graph
- [ ] `friendships` table (requester_id, addressee_id, status)
- [ ] Invite by link or email
- [ ] Accept / decline / block
- [ ] Privacy setting: `public_streaks` boolean on `profiles`

### Sprint 4.2 — Challenges
- [ ] `challenges` table (owner, habit template, duration, participants)
- [ ] Invite a friend to a shared habit
- [ ] Side-by-side progress view
- [ ] Nudges on milestones ("Alex just hit day 7")
- [ ] Leaderboard (opt-in)

---

## Phase 5 — Mobile polish ⏳

Goal: feel native on a phone.

- [ ] PWA manifest (icons, theme color, display mode)
- [ ] `serviceworker` for asset caching
- [ ] iOS add-to-home-screen prompt + meta tags
- [ ] Offline-first check-ins (IndexedDB queue → sync on reconnect)
- [ ] Capacitor wrapper for iOS/Android (optional — only if traction justifies App Store review friction)
- [ ] FCM / APNs push notifications (once wrapped)

---

## Phase 6 — Launch readiness ⏳

Goal: stop hiding from the world.

- [ ] Privacy Policy + Terms of Service pages
- [ ] GDPR: data export endpoint, account deletion flow
- [ ] Accessibility audit (axe clean + manual keyboard + screen reader pass)
- [ ] Load test the check-in endpoint (peak at ~9am local for every user)
- [ ] Help docs (simple `/help` page; no helpdesk tool yet)
- [ ] In-app feedback widget (mailto: is fine)
- [ ] Replace marketing `#get-streak` anchors with real `/signup` links
- [ ] Pricing page uses real Stripe price IDs

---

## Phase 7 — Growth ⏳ *(ongoing)*

- [ ] Referral: free month per referred Pro signup
- [ ] SEO content: "how to build a [X] habit" articles
- [ ] A/B paywall copy via PostHog feature flags
- [ ] Weekly digest email (cold retention lever)
- [ ] Lifecycle emails: day 3 "you're building it", day 14 "your first milestone"

---

## Timeline (solo pace)

| Phase | Weeks | Cumulative |
| ----- | ----- | ---------- |
| 0     | 1     | 1          |
| 1     | 3     | 4          |
| 2     | 3     | 7          |
| 3     | 3     | 10         |
| 4     | 3     | 13         |
| 5     | 2     | 15         |
| 6     | 2     | 17         |

**Public beta:** end of Phase 4 (~13 weeks)
**Paid launch:** end of Phase 6 (~17 weeks)

These slip. Assume ×1.3.

---

## How to update this file

- Check boxes as you complete tasks.
- Never edit a past sprint's scope — add a new sprint for new work.
- If a task changes phase, move it and note the reason in [docs/MEMORY.md](MEMORY.md#decisions).
