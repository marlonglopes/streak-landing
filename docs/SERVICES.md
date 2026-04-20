# External services

The full third-party surface area of Streak, organized by capability. Every
entry below lists:

- **What it does** — the one thing we use it for.
- **Why chosen** — over the nearest alternative.
- **Free tier** — the ceiling before it costs money.
- **User setup** — what *you* (Marlon) have to do in the vendor's UI.
- **App setup** — what Claude wires into the codebase (env vars, files, code).
- **Verify** — how to know it's working end-to-end.

**Environment policy:** every secret belongs in `.env.local` (gitignored) and a
redacted entry in [`.env.example`](../.env.example). Nothing with real values
should land in the repo. Server-only secrets never get the `NEXT_PUBLIC_`
prefix.

**Free-tier-first mandate (2026-04-20):** this stack is deliberately chosen so
the MVP ships at $0/month recurring. Every paid tier is called out below with
the threshold where we'd hit it.

---

## Table of contents

1. [Supabase](#1-supabase--db--auth--storage) — DB, auth, storage
2. [Vercel](#2-vercel--hosting--edge-cron) — hosting, edge, cron
3. [Resend](#3-resend--transactional-email) — transactional email *(replaces Mandrill)*
4. [Sentry](#4-sentry--error-tracking) — error tracking
5. [PostHog](#5-posthog--product-analytics) — product analytics
6. [Stripe](#6-stripe--payments) — payments *(Phase 3)*
7. [Mailchimp Marketing](#7-mailchimp-marketing--lifecycle-drips) — lifecycle drips *(Phase 7)*
8. [Meta + Twilio WhatsApp](#8-meta--twilio--whatsapp-reminders) — WhatsApp *(Sprint 2.4)*
9. [GitHub Actions](#9-github-actions--free-cron) — free cron workaround
10. [BetterStack](#10-betterstack--uptime-monitor) — uptime *(optional)*

---

## 1. Supabase — DB + auth + storage

**What it does:** managed Postgres + row-level security + auth (magic link) +
file storage. Our one-stop backend.

**Why chosen:** lets a solo dev skip building an auth service. Postgres +
SQL migrations keep the schema as a first-class artifact we own.

**Free tier:**
- 500 MB DB, 50,000 monthly active users.
- 1 GB file storage, 2 GB egress bandwidth/month.
- Project auto-pauses after 7 days of no activity (wake on next request).

**Will we outgrow it?** DB at ~50k habit-tracking users. MAU at ~first real
traction. Paid tier is $25/mo.

### User setup

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard).
2. Settings → API → copy the **URL**, **anon/publishable key**, and
   **service-role key**. The service-role key must stay server-side only.
3. Authentication → Providers → enable **Email** with **Magic link** on.
4. Authentication → URL configuration → add `http://localhost:3000/auth/callback`
   and your prod URL (once Vercel is live).
5. SQL editor → run each `supabase/migrations/*.sql` in numeric order.

### App setup

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # server-only
```

Clients live in [`lib/supabase/`](../lib/supabase/):
- `server.ts` — Server Components, Server Actions, route handlers.
- `client.ts` — browser, in `"use client"` components.
- `middleware.ts` — session refresh + auth gate on every request.
- `service-role.ts` — admin ops (cron, webhooks). Bypasses RLS.

### Verify

- `npm run dev` → `/app` should redirect to `/login?next=/app`.
- Sign in via magic link → the email arrives from Supabase's default sender.
- SQL: `select * from public.profiles;` should show your row after first sign-in.

---

## 2. Vercel — hosting + edge + cron

**What it does:** deploys Next.js with zero config, runs cron jobs declared in
`vercel.json`, gives every PR a preview URL.

**Why chosen:** first-party Next.js host; nothing else comes close for DX.

**Free tier (Hobby):**
- Unlimited personal sites, 100 GB bandwidth/month.
- 1 cron job, **once-per-day granularity**. ⚠️ This is the big gotcha — see
  [GitHub Actions](#9-github-actions--free-cron).
- **Commercial use is prohibited on Hobby.** The day Streak takes payment you
  must upgrade to Pro ($20/mo). Until then, Hobby is fine.

### User setup

1. Create a project at [vercel.com](https://vercel.com/new) linked to this
   GitHub repo.
2. Settings → Environment Variables → paste everything from `.env.local`.
3. Settings → Domains → point `streak.app` (or whatever domain you own) at
   Vercel. Add the DNS records Vercel shows you.
4. Leave cron disabled on Hobby — we run it from GitHub Actions instead
   (§9 below).

### App setup

[`vercel.json`](../vercel.json) already declares the cron schedule. When we
move cron to GitHub Actions, we'll either remove the block or keep it
commented as documentation.

### Verify

- `vercel --prod` or a `git push` to `main` ships a new build.
- Preview URL per PR for visual diffs.

---

## 3. Resend — transactional email

**What it does:** sends individual emails triggered by the app
(reminders, magic links if we ever leave Supabase Auth's sender, etc.).

**Why chosen over Mandrill:** Mandrill has no free tier ($20/mo minimum).
Resend gives us 3,000/month free with a clean API, which is plenty for the
MVP reminder loop.

**Why chosen over SendGrid / Brevo / Mailjet:** Resend's API is the smallest
surface (send a JSON body, done), the DX is the best of the bunch, and BR
deliverability is solid.

**Free tier:** 3,000 emails/month, 100/day, one verified domain. No credit
card required.

**Will we outgrow it?** At ~100 DAU with daily reminders. Paid starts at
$20/mo for 50k/month.

### User setup

1. Sign up at [resend.com](https://resend.com).
2. Domains → add your sending domain (e.g. `streak.app`). Resend shows the
   SPF, DKIM, and DMARC DNS records to add at your registrar. Wait for green
   checkmarks (usually <1 hour).
3. API Keys → create a key named `streak-prod` (full access). Save it — you
   only see it once.
4. Optional: add `reminders@streak.app` as a verified sender identity.

### App setup

```
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=reminders@streak.app
RESEND_FROM_NAME=Streak

# Set to 1 to log the payload and skip the actual API call. Default: 1 in dev.
RESEND_DRY_RUN=1
```

Adapter lives in `lib/email/resend.ts` (replaces `lib/email/mandrill.ts` —
same `SendEmailInput` / `SendEmailResult` shape so the cron and templates
don't change). The dry-run guard means local development never bills real
sends.

### Verify

1. Set `RESEND_DRY_RUN=1` → trigger the cron → check console for
   `[resend:dry-run]` logs + a `reminder_sends` row with `provider_id =
   'dry_run'`.
2. Flip `RESEND_DRY_RUN=0` and send yourself a test → email arrives from the
   verified domain, `sent` status in `reminder_sends`.
3. Click the unsub link → `/r/unsub` flips `unsubscribed_at`; next cron tick
   skips with `reason: "unsubscribed"`.

---

## 4. Sentry — error tracking

**What it does:** captures uncaught exceptions + source-mapped stack traces
from both the Node server and the browser.

**Why chosen:** the Next.js SDK is first-party, source maps Just Work, and
the free tier is generous.

**Free tier (Developer):** 5,000 errors/month, 10,000 performance units,
1 user, 30-day retention. Plenty pre-launch.

### User setup

1. Sign up at [sentry.io](https://sentry.io) → create a project of type
   **Next.js**.
2. Copy the **DSN** from Settings → Client Keys (DSN).
3. Settings → Auth Tokens → create a token with `project:releases` scope for
   source-map upload during build.

### App setup

```
NEXT_PUBLIC_SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project>
SENTRY_AUTH_TOKEN=sntrys_...     # build-time only, never shipped to client
SENTRY_ORG=<your-org-slug>
SENTRY_PROJECT=streak
```

Wiring lands in:
- `sentry.client.config.ts` — browser init.
- `sentry.server.config.ts` — Node init.
- `sentry.edge.config.ts` — edge runtime init.
- `next.config.js` — wrap with `withSentryConfig` to upload source maps on
  prod builds.

The init modules are safe to ship without the DSN — Sentry degrades to a
no-op when the env var is missing.

### Verify

- Throw `new Error("sentry test")` in a server component → event shows up in
  the Sentry issues feed within seconds.
- Check that the stack trace points at the TypeScript source file, not the
  minified JS (proof source maps uploaded).

---

## 5. PostHog — product analytics

**What it does:** page views, custom events (`habit_created`, `checkin`,
`streak_extended`), funnels, session replay, feature flags.

**Why chosen:** one tool covers analytics + flags + replay. The alternative
(GA4 + LaunchDarkly + a replay tool) is three bills and three SDKs.

**Free tier (Cloud):** 1M events/month, 5k session recordings, 1M feature-flag
requests, unlimited team members. We won't come close for months.

### User setup

1. Sign up at [posthog.com](https://posthog.com) (EU region is closer for BR;
   US region is the default).
2. Project Settings → copy the **Project API Key**.
3. Data Management → set `Person Profiles` to **Identified only** (keeps the
   quota honest).

### App setup

```
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com   # or https://us.posthog.com
```

Wiring lands in:
- `lib/analytics/posthog.ts` — init + typed `track()` helper.
- `app/layout.tsx` — `<PostHogProvider>` wraps the tree.
- `components/analytics/PageView.tsx` — fires `$pageview` on route changes.
- Server-side `capture()` calls in Server Actions for `habit_created`,
  `checkin`, `streak_extended` so events are trustworthy even if the browser
  drops them.

### Verify

- Open the dashboard → Live events feed shows `$pageview` as you navigate.
- Create a habit → `habit_created` event lands with `user_id`, `habit_id`,
  `cadence` properties.

---

## 6. Stripe — payments

**What it does:** Checkout for upgrading to Pro, Billing Portal for self-serve
subscription management, webhooks for subscription state.

**Why chosen:** industry standard. The Billing Portal offloads the entire
subscription-management UI.

**Free tier:** no monthly fee. Fees are per successful charge only:
- US/international cards: 2.9% + $0.30.
- Brazilian domestic cards: ~3.99% + R$0.39.
- Test mode is free forever.

### User setup *(Sprint 3.1)*

1. Sign up at [stripe.com](https://stripe.com). Activate the account with
   your business details (or personal for a solo dev) once you want live
   charges.
2. Products → create **Streak Free** ($0, for completeness) and **Streak Pro**
   ($4/month, recurring).
3. Copy the **price ID** for Pro (starts with `price_`).
4. Developers → API keys → copy **Publishable** + **Secret** (test mode
   first).
5. Developers → Webhooks → add endpoint `https://<prod-url>/api/stripe/webhook`
   listening for:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   Copy the **signing secret**.

### App setup

```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_...
```

Wiring (Sprint 3.1):
- `app/api/stripe/checkout/route.ts` — create a Checkout session, redirect.
- `app/api/stripe/webhook/route.ts` — verify signature, update
  `profiles.subscription_tier`, idempotent on `event.id`.
- `lib/stripe/client.ts` — shared SDK instance.
- Billing-portal link from `/app/settings`.
- Paywall gates at habit #4, stats export, streak freezes.

### Verify

- Test mode: use card `4242 4242 4242 4242`, any future expiry, any CVC.
- `stripe listen --forward-to localhost:3000/api/stripe/webhook` during dev.
- `profiles.subscription_tier` flips to `'pro'` after the webhook fires.

---

## 7. Mailchimp Marketing — lifecycle drips

**What it does:** welcome emails, day-3 "you're building it", day-14 first
milestone, monthly digest. Marketing sends, not transactional.

**Why chosen:** you already have a Mailchimp account. Different tool from the
transactional sender (Resend) on purpose — marketing and transactional want
different reputations, different opt-outs, and different compliance surfaces.

**Free tier:** 500 contacts, 1,000 sends/month, 1 audience. Ample for
early-adopter drips; we'll outgrow at ~500 signups.

### User setup *(Phase 7 — not needed yet)*

1. Log in at [mailchimp.com](https://mailchimp.com).
2. Audience → create `Streak users` audience.
3. Automations → build welcome + day-3 + day-14 journeys using audience tags
   we'll send from the app (`signed_up`, `first_checkin`, `streak_7`).
4. Settings → API keys → create a read/write key (used only if we sync
   contacts from the app).

### App setup

```
MAILCHIMP_API_KEY=<dc-prefixed-key>
MAILCHIMP_AUDIENCE_ID=...
MAILCHIMP_SERVER_PREFIX=us21     # the -us21 suffix on your API key
```

Wiring (Phase 7) — add contact + tag via `lib/marketing/mailchimp.ts` from
Server Actions on signup / key milestones.

### Verify

- Tag a test contact via the app → confirm they appear in the Mailchimp
  audience → confirm the journey fires.

---

## 8. Meta + Twilio — WhatsApp reminders

**What it does:** sends reminder messages over WhatsApp as a second channel
beside email.

**Why two vendors:** Meta owns WhatsApp but requires going through a
Business Solution Provider (BSP). Twilio is the most solo-dev-friendly BSP.
Zenvia is cheaper for BR volume but heavier paperwork.

**Free tier:**
- Meta: 1,000 free service conversations/month (user-initiated). Marketing
  and utility template conversations always cost.
- Twilio: no monthly fee; ~$0.005/message + per-conversation template fee
  (en-BR utility ≈ R$0.08).

**Status: scaffolded, not live.** [`lib/whatsapp/send.ts`](../lib/whatsapp/send.ts)
is a dry-run stub; real sends are blocked on Meta Business verification +
template approval.

### User setup *(Sprint 2.4 — blocked)*

1. [business.facebook.com](https://business.facebook.com) → create a
   Business Manager. Verify the business (trade license or equivalent — for
   a solo dev, a CNPJ in BR or sole-prop registration works).
2. WhatsApp → add a phone number that isn't in the WhatsApp consumer app
   already.
3. Sign up at [twilio.com](https://twilio.com) and connect the Meta number.
4. Submit reminder templates (en + pt-BR) via Twilio console or Meta
   Business Manager. Approval takes 24–72 hours.

### App setup

```
WHATSAPP_PROVIDER=twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_FROM=whatsapp:+1415...     # the approved sender
WHATSAPP_DRY_RUN=1
```

Once BSP lands:
- Replace the stub in [`lib/whatsapp/send.ts`](../lib/whatsapp/send.ts) with
  the Twilio REST call.
- `app/app/settings` adds a phone-number field + OTP verification flow.
- A `POST /api/whatsapp/inbound` route handles STOP keywords → clears
  `whatsapp_opt_in`.
- Cron query widens to `.in("preferred_reminder_channel", ["email", "whatsapp"])`.

### Verify

- Dry-run: `WHATSAPP_DRY_RUN=1`, trigger cron with a whatsapp-preferred test
  profile → `[whatsapp:dry-run]` log + `reminder_sends` row with
  `channel='whatsapp'`, `provider_id='dry_run'`.
- Live: send a template to yourself → message lands on WhatsApp →
  replying "STOP" clears opt-in for the next tick.

---

## 9. GitHub Actions — free cron

**What it does:** hits `/api/cron/reminders` on a schedule we control,
bypassing Vercel Hobby's one-per-day cron limit.

**Why this exists:** Vercel Hobby caps cron at daily granularity. Reminders
want 15-minute granularity to respect user-chosen `reminder_time`. GitHub
Actions offers 2,000 free workflow-minutes/month and cron down to
5-minute granularity, which is plenty.

**Free tier:** 2,000 minutes/month for private repos (unlimited for public).
Our job runs ~5s per tick × 96 ticks/day = 8 minutes/day = ~240 min/month.
Well under quota.

### User setup

1. Repo → Settings → Secrets and variables → Actions → add:
   - `CRON_SECRET` — same value as in `.env.local` on the server.
   - `CRON_TARGET_URL` — e.g. `https://streak.app/api/cron/reminders`.

### App setup

Workflow lives at `.github/workflows/reminders-cron.yml`:

```yaml
name: reminders-cron
on:
  schedule:
    - cron: "*/15 * * * *"
  workflow_dispatch:
jobs:
  tick:
    runs-on: ubuntu-latest
    steps:
      - name: Call reminder endpoint
        run: |
          curl -fsSL -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            "${{ secrets.CRON_TARGET_URL }}"
```

Workflow-dispatch is the manual-trigger button in the Actions tab — handy for
"send now" during QA.

### Verify

- Actions tab → **reminders-cron** workflow → run manually →
  `reminder_sends` rows appear.
- Scheduled run at the next `:00 / :15 / :30 / :45` → same rows, no
  `unauthorized` 401s.

---

## 10. BetterStack — uptime monitor

**What it does:** HTTP check against `/` and `/api/health` every 3 minutes;
pings you (email + Slack if wired) when it fails.

**Why chosen:** free tier beats UptimeRobot's feature set, and the status
page is a throwaway freebie.

**Free tier:** 10 monitors, 3-minute checks, 90-day log retention. Generous
for a single app.

### User setup

1. Sign up at [betterstack.com](https://betterstack.com).
2. Uptime → add a monitor: `GET https://streak.app/`, expect 200.
3. Alert channels → email to you; Slack later if you add a workspace.

### App setup *(optional)*

Add a cheap health endpoint if we want real depth:

```ts
// app/api/health/route.ts
export async function GET() {
  const supabase = createServiceRoleClient();
  const { error } = await supabase.from("profiles").select("id").limit(1);
  return Response.json(
    { ok: !error, db: error ? "down" : "up" },
    { status: error ? 503 : 200 },
  );
}
```

### Verify

- Monitor turns green within 3 minutes of creation.
- Kill the Vercel deployment (or break the env vars temporarily) → monitor
  fires an alert.

---

## Cost ceiling snapshot

| Service | Free-tier ceiling | First paid tier |
|---|---|---|
| Supabase | 500 MB DB · 50k MAU | $25/mo (Pro) |
| Vercel | 100 GB bw · 1× daily cron · no commercial use | $20/mo (Pro) — **required the day you take payment** |
| Resend | 3,000/mo · 100/day | $20/mo (50k) |
| Sentry | 5k errors/mo | $26/mo (50k) |
| PostHog | 1M events/mo | $0.00005/event over |
| Stripe | $0 fixed | per-transaction only |
| Mailchimp Marketing | 500 contacts · 1k sends | $13/mo (Essentials) |
| Meta + Twilio | 1k service conversations/mo | per-conversation rate |
| GitHub Actions | 2,000 min/mo private | $0.008/min over |
| BetterStack | 10 monitors · 3-min | $29/mo (Team) |

**Recurring cost at MVP launch: $0.**
**First bill: Vercel Pro $20/mo the day Stripe live mode switches on.**

---

## Maintenance protocol

When swapping or adding a service:
1. Update this doc (add a new numbered section; don't delete retired ones —
   leave them with a `*(retired YYYY-MM-DD)*` header for archaeology).
2. Update [`.env.example`](../.env.example) with placeholder vars.
3. Update [`docs/ARCHITECTURE.md`](ARCHITECTURE.md#stack) if the service shows
   up in the stack table.
4. If a free-tier threshold changes, update the ceiling snapshot above.
