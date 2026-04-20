# Project Memory

The stuff that isn't in the code: decisions, non-goals, risks, open questions, and a shared glossary. Keeps humans and Claude sessions oriented across weeks.

This file is **additive**. Don't rewrite history — append.

---

## Decisions

Append-only log. Date · short title · context · decision · (optional) consequences.

### 2026-04-18 · Web-first, PWA only for MVP
**Context:** solo dev, fastest path to paying users. Native wrappers add App Store friction early.
**Decision:** web-first Next.js app. Add Capacitor wrappers only after traction (Phase 5, optional).
**Consequence:** skip FCM/APNs for now; push notifications arrive via web push in Phase 2.

### 2026-04-18 · Supabase for backend
**Context:** evaluated Firebase, custom Node+Postgres, Supabase. Need auth + DB + RLS without writing an auth service.
**Decision:** Supabase. Keeps us on SQL (easy to grow out of) and gives first-class RLS.
**Consequence:** all data access goes through the anon key as the authenticated user. Service role is reserved for server-side admin ops (webhooks, triggers).

### 2026-04-18 · Stripe for payments (web Checkout + Portal)
**Context:** need subscriptions + billing UI.
**Decision:** Stripe Checkout for the flow, Billing Portal for plan/card management.
**Consequence:** defer RevenueCat until we ship native (Phase 5+).

### 2026-04-18 · Store `check_ins.local_date`, not UTC timestamp
**Context:** habit trackers are notorious for timezone bugs. A user who checks in at 11pm NYC and then flies to Tokyo shouldn't see their streak break.
**Decision:** store a `DATE` in the user's local timezone. The server trusts the client for "today," validated against `profiles.timezone`.
**Consequence:** streak math is a pure function of `(habit_id, local_date)` tuples. No UTC off-by-one surprises. Requires aggressive tests in Phase 1.2.

### 2026-04-18 · Compute streaks on-demand, don't materialize
**Context:** cached streak columns are a bug magnet (invalidation on backdated check-ins, habit edits, timezone changes).
**Decision:** compute streaks at read time from the `check_ins` table.
**Consequence:** revisit only if profiling shows it matters at scale. A materialized view is the escape hatch — not a trigger-maintained column.

### 2026-04-18 · Yolo'd: no CI, no Sentry, no PostHog for MVP
**Context:** solo dev, MVP speed > ceremony.
**Decision:** defer CI (Phase 6), Sentry (Phase 2), PostHog (Phase 2).
**Consequence:** Vercel preview deploys are our only regression check early. Ship small.

### 2026-04-18 · Tests only for streak math in Phase 1
**Context:** UI tests have a high cost-to-value ratio for a landing-heavy solo project.
**Decision:** aggressive tests on `lib/streaks.ts` only. Add broader suites when something breaks twice.
**Consequence:** streak module must be isolated enough to unit-test without a DB.

### 2026-04-18 · Conventional Commits mandatory
**Context:** user asked for it as a standing rule.
**Decision:** every commit uses Conventional Commits. Type + optional scope + imperative subject ≤72 chars.

### 2026-04-19 · Reminders are single-channel per user, not per habit
**Context:** Sprint 2.3 ships email reminders; Sprint 2.4 adds WhatsApp. The alternative (per-habit channel picker) was rejected.
**Decision:** `profiles.preferred_reminder_channel` holds one of `email | none` today, widened to include `whatsapp` in 2.4. Every active habit for that user flows through the same channel.
**Consequence:** simpler settings UI (one picker, not N), simpler quota accounting, simpler migration when a user switches channels. Per-habit overrides are an escape hatch we can add later without schema changes (store an override column on `habits`); we don't owe that complexity to users who haven't asked for it. WhatsApp is blocked on Meta Business verification + template approval, so shipping email first de-risks the sprint.

### 2026-04-19 · Mandrill dry-run is the default in dev
**Context:** Real email sends in a local dev loop burn quota, spam your inbox, and surprise you on the first accidental production-ish push.
**Decision:** `MANDRILL_DRY_RUN` defaults to `1` when unset. The client logs the payload and returns a synthetic success. Flip to `0` only after the domain's SPF + DKIM are verified in Mandrill.
**Consequence:** `reminder_sends` rows land with `provider_id='dry_run'` in dev — handy smoke signal that the pipeline is wired up, even without hitting the API.

### 2026-04-19 · i18n lands in Sprint 2.2, not Phase 6
**Context:** real Brazilian users already signed up. Deferring localization until reminder emails ship would mean bilingual email templates on top of a bilingual string rewrite.
**Decision:** pull i18n forward to Sprint 2.2 with `next-intl` + en/pt-BR dictionaries. Locale resolves at the request boundary (`profiles.locale` → `NEXT_LOCALE` cookie → `Accept-Language` → `en`); no URL-based locale routing.
**Consequence:** `profiles.locale` is authoritative for signed-in users. Every new user-facing string goes through the message catalog from day one. Reminder emails in Sprint 2.3 read `profiles.locale` directly. Non-goal: auto-translation at build — native speaker reviews every pt-BR string.

---

## Non-goals (explicitly deferred)

If you catch yourself building one of these before the phase in parentheses, stop.

- **Native iOS/Android apps.** (Phase 5, only if traction justifies.)
- **CI pipeline.** (Phase 6.)
- **Password auth.** Magic link only for MVP. OAuth is cheap to add later.
- **Team / multi-user habits.** Single-user only.
- **Habit categories, tags, folders.** Keep the data model flat.
- **Custom cadences beyond daily/weekly.** (Skip "every 3 days," "Mon/Wed/Fri except holidays," etc.)
- **Offline sync.** (Phase 5.)
- **Friend challenges.** (Phase 4.)
- **Per-habit reminder channels.** Channel is picked per user, not per habit. Escape hatch: add an override column on `habits` without schema churn. (Revisit only if users ask.)
- **WhatsApp reminders.** (Sprint 2.4, behind the same interface as email.)
- **Push notifications.** (Phase 2 after native wrappers land in Phase 5, if ever.)
- **URL-based locale routing** (`/en/app` vs `/pt-BR/app`). Locale is stored on the profile or in a cookie; URLs stay clean. Revisit only if SEO demands it.
- **Locales beyond en + pt-BR.** Adding a third locale means adding the dictionary, the CHECK constraint value, and the switcher option — all cheap, but not MVP work.
- **GDPR data-export UI.** Mailto at launch; wire up properly in Phase 6.

---

## Known risks

Sorted by severity.

### Timezone bugs in streak math — HIGH
The one thing users will notice and Twitter about. Mitigation: treat `lib/streaks.ts` as load-bearing. Test every DST transition, timezone change, and international date line case. Use a fixed clock in tests.

### Stripe webhook idempotency — MEDIUM
Webhooks retry. Every subscription event handler must be idempotent against `stripe_event.id`. Store processed event IDs.

### RLS policy holes — MEDIUM
Easy to add a table and forget RLS. Mitigation: CI check in Phase 6 (`supabase db diff` + a linter rule that every `public` table has RLS enabled). Until then: review each migration by hand.

### Node 18 EOL — LOW (but growing)
Dev env is on Node 18.19. Supabase SDK warns about it. Upgrade to Node 20 LTS before Phase 1 ships.

### npmrc `package-lock=false` in this environment — LOW
`~/.npmrc` disables lockfiles in this dev environment. Reproducible builds in CI (when we add it) will need to either override this or switch to `pnpm` / `bun`. For now we pin exact-ish versions in `package.json`.

### Solo bus factor — LOW (self-aware)
Document as you go. These docs are half for future you, half for a hypothetical second dev.

---

## Open questions

Unresolved product/design decisions. Resolve them by converting into a **Decision** entry above.

- **Free tier cap:** 3 habits (current) or 5? 3 drives more conversions; 5 probably gives better retention.
- **Pro pricing:** $4/mo feels right for the landing page. Annual plan? ($36/yr = 25% off). Student pricing?
- **Streak freeze earn rate:** 1 per 7 days, cap 3 is a first guess. Tune from analytics once they exist.
- **Reminder delivery default:** email on, or off? Email-on boosts retention but can feel spammy.
- **OAuth providers:** Google alone, or also Apple (required for iOS App Store if we wrap)? Apple adds dev-account cost.
- **Domain name:** `streak.app` taken? Fallback: `getstreak.app` / `streakhq.com`?
- **Legal entity:** personal LLC or wait? Matters for Stripe payouts and ToS wording.

---

## Environment quirks (dev machine notes)

Facts about this specific dev environment — useful when debugging "it works locally but…":

- **Node version:** 18.19.0 (EOL). Supabase SDK emits EBADENGINE warnings. Plan to bump to Node 20 before Phase 1.
- **npm config:** `~/.npmrc` has `package-lock=false`. Expect no `package-lock.json`; deps are pinned in `package.json` instead.
- **Installing a new dep:** `npm install <pkg>` may not update `package.json` in this env — manually add it to `dependencies` and run `npm install` to sync.

---

## Glossary

Terms with a specific meaning in this project. If you're ever tempted to redefine one, add a new term instead.

| Term                 | Meaning                                                                                                             |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **habit**            | A recurring action a user wants to establish. Has a name, cadence (daily/weekly), and target days of the week.      |
| **check-in**         | A single instance of completing a habit on a specific calendar date. Unique per `(habit_id, local_date)`.           |
| **local_date**       | The user's local calendar date (`YYYY-MM-DD`) at the time of check-in. Derived client-side, validated server-side.  |
| **streak**           | The count of consecutive target days, ending at the most recent check-in, with no gaps. Computed on demand.         |
| **freeze**           | A saved "life happens" credit that lets a missed day pass without breaking the streak. Earned by consistency.       |
| **profile**          | The `public.profiles` row tied 1:1 to a `auth.users` row. Holds timezone, display name, subscription tier, Stripe IDs. |
| **tier**             | `free` or `pro`. Governed by Stripe subscription status.                                                             |
| **marketing route**  | Any route under `app/(marketing)/`. Public, no auth needed.                                                          |
| **app route**        | Any route under `app/(app)/` (to be added in Phase 1). Gated by the session middleware.                             |

---

## How to update this file

- New **decisions** → append to the **Decisions** log with date + rationale.
- New **non-goals** → add to the list with the phase where we'd reconsider.
- New **risks** → add to **Known risks**, sorted by severity.
- An **open question** became a **decision** → move it, don't delete it.
- Never rewrite history. If a prior decision was wrong, add a new "superseded by" entry above it.
