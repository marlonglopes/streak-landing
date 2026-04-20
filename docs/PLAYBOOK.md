# Playbook — running & testing Streak

How to stand the app up locally, run the automated suite, and smoke-test every feature end-to-end. Keep this file current as new surfaces ship — every sprint should add its own manual-test section.

> **Time budget:** fresh clone to fully-verified ~15 min. Returning dev → full smoke test ~10 min.

---

## Table of contents

- [1. Prerequisites](#1-prerequisites)
- [2. First-time setup](#2-first-time-setup)
- [3. Running the app](#3-running-the-app)
- [4. Automated tests](#4-automated-tests)
- [5. Type check & production build](#5-type-check--production-build)
- [6. Manual smoke tests](#6-manual-smoke-tests)
  - [6.1 Landing page](#61-landing-page)
  - [6.2 Auth (magic link)](#62-auth-magic-link)
  - [6.3 Habit CRUD](#63-habit-crud)
  - [6.4 Check-ins & streak counter](#64-check-ins--streak-counter)
  - [6.5 Rest days (non-target weekdays)](#65-rest-days-non-target-weekdays)
  - [6.6 Free-tier cap](#66-free-tier-cap)
  - [6.7 Timezone capture](#67-timezone-capture)
  - [6.8 Auth gate & middleware](#68-auth-gate--middleware)
- [7. Streak math — backfilling history via SQL](#7-streak-math--backfilling-history-via-sql)
- [8. Database spot-checks](#8-database-spot-checks)
- [9. Troubleshooting](#9-troubleshooting)
- [10. Cleanup between test runs](#10-cleanup-between-test-runs)

---

## 1. Prerequisites

| Tool                | Version           | Why                                       |
| ------------------- | ----------------- | ----------------------------------------- |
| Node.js             | **20.x** ideally¹ | Supabase SDK warns on 18                  |
| npm                 | 10.x              | Ships with Node                           |
| A Supabase project  | free tier is fine | Auth + Postgres + RLS                     |
| A real email inbox  | any               | Magic links land here                     |
| Modern browser      | Chrome/Firefox    | Dev tools for the timezone test           |

¹ This dev machine currently runs Node 18.19. The app works but you'll see a deprecation warning on every SDK call. Non-fatal; upgrade when convenient.

---

## 2. First-time setup

### 2.1 Install deps

```bash
cd streak-landing
npm install
```

> **Quirk:** this machine's `~/.npmrc` has `package-lock=false`, so no `package-lock.json` is generated. All deps are pinned in `package.json`. Don't worry about it.

### 2.2 Create `.env.local`

At `streak-landing/.env.local`:

```ini
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
```

Where to find each value in the Supabase dashboard:

- **URL**: Project Settings → Data API → Project URL
- **Publishable key** (`sb_publishable_...`): Project Settings → API Keys → "publishable" key
- **Secret key** (`sb_secret_...`): Project Settings → API Keys → "secret" key *(treat like a password; don't paste in chats)*

### 2.3 Apply the schema

Supabase dashboard → SQL Editor → paste `supabase/migrations/0001_init.sql` → Run. Verify three tables exist (`profiles`, `habits`, `check_ins`) with RLS enabled on each. Then run `supabase/migrations/0002_locale.sql` to add `profiles.locale` (required for Sprint 2.2 i18n). Existing profiles are backfilled with `'en'` by the `default` clause.

### 2.4 Configure auth

Supabase dashboard → Authentication → URL Configuration:

- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: add `http://localhost:3000/auth/callback`

Authentication → Providers: **Email** enabled, **Confirm email** on. Password auth can be off; we only use magic links.

---

## 3. Running the app

```bash
cd streak-landing
npm run dev
```

Open http://localhost:3000.

Expected routes:

| Route                       | What it does                                               |
| --------------------------- | ---------------------------------------------------------- |
| `/`                         | Marketing landing page                                     |
| `/login`                    | Magic-link sign-in form                                    |
| `/auth/callback`            | Handles the `?code=...` from the magic link email          |
| `/app`                      | Today view (habits + check-ins) — **auth-gated**           |
| `/app/habits/new`           | New-habit form — auth-gated                                |
| `/app/habits/[id]/edit`     | Edit / archive / delete — auth-gated                       |

---

## 4. Automated tests

```bash
npm test           # run once
npm run test:watch # re-run on save
```

Expected on a clean tree:

```
✓ lib/streaks.test.ts (27 tests)
✓ lib/dates.test.ts   (13 tests)
Test Files  2 passed (2)
     Tests  40 passed (40)
```

What they cover:

- **Date utilities** — `todayInTimezone` for UTC / America/New_York / Asia/Tokyo / Asia/Kolkata (non-whole-hour offset); `parseLocalDate` round-trip; `addDays` across leap years, year rollover, and US DST spring-forward; `dayOfWeek`; `isValidTimezone` accepts real IANA names and rejects garbage.
- **Streak math** — daily habits, weekdays-only, Mon/Wed/Fri; rest days don't count as gaps; today-not-yet-checked-in doesn't break the streak; DST transitions don't drop or double-count days; longest streak finds historical peaks and ignores future check-ins.

Any failure here = **do not ship**. Streak math is the core UX promise.

---

## 5. Type check & production build

```bash
npx tsc --noEmit   # type check only
npx next build     # full production build
```

Expected:

- `tsc`: silent (no output = clean).
- `next build`: `✓ Generating static pages` and a route table. You'll see one noise line `Failed to patch lockfile` — **non-fatal**, it's Next's quirk with lockfile-free environments. Build still succeeds.

---

## 6. Manual smoke tests

Run through these in order after every meaningful change. Each section is standalone; you can jump to the one you're investigating.

### 6.1 Landing page

1. `/` renders — navy/orange design, phone mockup, pricing, footer.
2. Every CTA ("Get Streak", nav sign-in, hero button, pricing Free/Pro buttons, footer link) navigates to `/login`.
3. Resize to ~375px — layout stacks, no horizontal scroll.

### 6.2 Auth (magic link)

1. `/login` → enter your email → **Send magic link**.
2. URL becomes `/login?sent=1&email=...` and the page shows a "Check your email" confirmation.
3. Email arrives within ~30s. Click the link.
4. You land on `/app` signed in. Header shows your email.
5. Click **Sign out** → redirected to `/login`.
6. Click the magic link again after signing out → should still work for its validity window.

### 6.3 Habit CRUD

Signed in. Starting from an empty account.

**Empty state**
- `/app` shows "Start your first streak" with an orange **Create a habit** CTA.

**Create**
- Click **Create a habit** → form at `/app/habits/new`.
- Fill: name `Morning run`, emoji `🏃`, cadence `Daily`, all 7 days checked, no reminder → **Create habit**.
- Back on `/app`, card visible: emoji 🏃, name "Morning run", "0 days · best 0", empty circle button.

**Validation**
- Try creating with an empty name → redirected back to `/app/habits/new?error=...` with a red banner at the top.
- Uncheck all target days → same, different error ("Pick at least one target day").

**Edit**
- Click the habit name → `/app/habits/[id]/edit` with fields pre-filled.
- Change emoji to 🏋️, save → `/app` shows the new emoji.

**Archive**
- Edit form → **Archive** → habit disappears from `/app`. History preserved (check `check_ins` in Supabase).

**Delete**
- Create a disposable habit, check in once, then edit → **Delete**. Habit gone. Verify in Supabase that its `check_ins` rows also vanished (ON DELETE CASCADE).

### 6.4 Check-ins & streak counter

1. Create a daily habit. Initial state: `0 days`, empty circle.
2. Click the circle → orange fill + checkmark, card now shows `1 day`, flame icon turns orange.
3. Click again → unchecks (it's a toggle). Back to `0 days`.
4. Double-click the circle rapidly → only one check-in exists (enforced by the `UNIQUE (habit_id, local_date)` constraint). No duplicate row.

Want to see a real streak without waiting days? See [§7](#7-streak-math--backfilling-history-via-sql).

### 6.5 Rest days (non-target weekdays)

1. Create habit `Read` 📚, cadence `Daily`, **uncheck Sat + Sun**.
2. **If today is Sat/Sun:** card shows `0 days · best 0 · rest day`, circle is a dashed outline with `—`, clicking it does nothing (it's not a button).
3. **If today is a weekday:** card is normal. Check in → `1 day`.
4. Come back on a weekend (or simulate via SQL) — check-ins from weekdays still count, weekend doesn't break the streak.

### 6.6 Free-tier cap

1. Create three active habits. Today view shows all three; **New habit** button in the header is still visible.
2. Create a fourth via the `+ New habit` button → the page loads, but on submit you're redirected back with the error banner: *"Free plan is limited to 3 active habits. Upgrade to Pro for unlimited."*
3. On `/app`, the footer below the habit list now reads *"You're at the free-plan limit (3 habits). Pro is coming soon."* — and the **+ New habit** button is hidden.
4. Archive one habit → count drops to 2, **New habit** button reappears, footer note disappears.

> **Why "active"?** Archived habits don't count against the cap. This is deliberate — history is sacred. Deleting also frees a slot.

### 6.7 Timezone capture

1. Verify your browser's IANA timezone: DevTools console → `Intl.DateTimeFormat().resolvedOptions().timeZone`. Example: `America/Sao_Paulo`.
2. Fresh account: Supabase → Table Editor → `profiles` → your row. `timezone` should currently be `UTC` (the default from the trigger).
3. Load `/app` in your browser. The `<TimezoneCapture>` client component fires a Server Action with the detected zone.
4. Refresh Supabase table view → `timezone` now matches your browser.
5. Reload `/app` a second time → no further writes (the effect is guarded by `fired` + a zone-mismatch check). Check the Network tab to confirm no extra POST to the action endpoint.

Edge case: if a user moves timezones (laptop travels), `todayInTimezone` uses the stored zone for streak math. Changing time zones mid-streak on a rest day is a known rough edge — documented in `docs/MEMORY.md` (risks section).

### 6.8 Auth gate & middleware

1. Sign out. Visit `/app` → redirected to `/login?next=%2Fapp`.
2. Visit `/app/habits/new` directly → redirected to `/login?next=%2Fapp%2Fhabits%2Fnew`.
3. Log in via magic link → after callback, you land at the `next` URL, not `/app`.
4. Signed in, visit `/login` → redirected to `/app` (middleware prevents double login).

### 6.9 Localization (en / pt-BR)

Precedence: signed-in `profiles.locale` → `NEXT_LOCALE` cookie → `Accept-Language` header → `en`.

**Anonymous (cookie path):**

1. Open an incognito window. Load `/`.
2. If your browser's `Accept-Language` starts with `pt`, the page renders in Portuguese on first load. Otherwise it renders in English.
3. Use the language switcher in the nav to flip to **Português (BR)**. Nav, hero, features, pricing, footer, phone mockup — every surface translates in place. URL does not change (we don't use locale-prefixed routes).
4. DevTools → Application → Cookies → confirm `NEXT_LOCALE=pt-BR` was written with a 1-year max-age.
5. Close and reopen the tab → page still loads in pt-BR (cookie wins over header).

**Signed in (profile path):**

1. Log in. The app shell has a language switcher next to the sign-out button.
2. Switch to pt-BR. Supabase → `profiles` → your row → `locale` column now reads `pt-BR`.
3. Log out. Delete the `NEXT_LOCALE` cookie. Log back in → still pt-BR (the profile overrides cookie/header).
4. In a fresh incognito window, log into the same account with a browser set to English. The app still loads in pt-BR because the profile is authoritative.

**Things to eyeball:**

- `Today · {date}` eyebrow on `/app` — date is formatted via `Intl.DateTimeFormat`, so pt-BR shows `segunda-feira, 20 de abril` while en shows `Monday, April 20`.
- Habit form weekday chips (`S M T W T F S` vs. `D S T Q Q S S`).
- Heatmap month labels and weekday initials on the habit detail page.
- Plural forms: `1 day` / `2 days` in en; `1 dia` / `2 dias` in pt-BR. Best-streak and total-check-in counts exercise these.
- Free-tier error: create a 4th habit on the free plan — the error bar should render in the active locale.

---

## 7. Streak math — backfilling history via SQL

Waiting days to test streaks is absurd. Backfill via the SQL editor.

### 7.1 Grab IDs

Supabase → SQL Editor:

```sql
select h.id as habit_id, h.name, h.user_id, p.timezone
from habits h
join profiles p on p.id = h.user_id
where h.archived_at is null
order by h.created_at;
```

Copy a `habit_id` + `user_id`.

### 7.2 Build a 4-day run ending yesterday

```sql
insert into check_ins (habit_id, user_id, local_date) values
  ('<habit_id>', '<user_id>', current_date - 4),
  ('<habit_id>', '<user_id>', current_date - 3),
  ('<habit_id>', '<user_id>', current_date - 2),
  ('<habit_id>', '<user_id>', current_date - 1);
```

Reload `/app`:

- That habit shows **`4 days · best 4`** (today not yet checked in, but yesterday was → streak not broken).
- Click the circle → **`5 days · best 5`**.

> `current_date` in Supabase is UTC-based. If your profile timezone puts you a day ahead/behind UTC, you may see off-by-one — that's correct behavior, not a bug. Use explicit dates (e.g. `'2026-04-18'`) if you want to be precise.

### 7.3 Introduce a gap (verify "longest" ≠ "current")

```sql
delete from check_ins
where habit_id = '<habit_id>'
  and local_date = current_date - 2;
```

Reload:

- `current` walks back from today, hits the gap → count = 2 (yesterday + today, if today is checked in).
- `longest` walks the whole history → still 2 in this scenario because the gap split the 5-run.

Rebuild the gap to make two distinct runs:

```sql
insert into check_ins (habit_id, user_id, local_date) values
  ('<habit_id>', '<user_id>', current_date - 10),
  ('<habit_id>', '<user_id>', current_date - 9),
  ('<habit_id>', '<user_id>', current_date - 8),
  ('<habit_id>', '<user_id>', current_date - 7),
  ('<habit_id>', '<user_id>', current_date - 6),
  ('<habit_id>', '<user_id>', current_date - 5);
```

Reload → `current: 2, longest: 6`. That's the UI surfacing the distinction.

### 7.4 Weekly cadence (Mon/Wed/Fri)

Create a habit with target days `{1, 3, 5}`. Find a recent run of Mon–Wed–Fri:

```sql
-- Verify what day-of-week each date is first.
select d::date, to_char(d, 'Dy') as dow
from generate_series(current_date - 14, current_date, '1 day') d;

-- Then insert check-ins only on target days.
insert into check_ins (habit_id, user_id, local_date) values
  ('<habit_id>', '<user_id>', '<a Monday>'),
  ('<habit_id>', '<user_id>', '<that Wed>'),
  ('<habit_id>', '<user_id>', '<that Fri>'),
  ('<habit_id>', '<user_id>', '<next Mon>');
```

Reload:

- Non-target days (Tue/Thu/Sat/Sun) are skipped — they don't count or break.
- Streak should be 4.
- Card may show "rest day" depending on today's weekday.

---

## 8. Database spot-checks

Quick sanity queries to keep in your back pocket.

```sql
-- How many active habits per user? (Free-tier cap sanity.)
select user_id, count(*)
from habits
where archived_at is null
group by user_id;

-- Recent check-ins for your account.
select h.name, c.local_date, c.checked_in_at
from check_ins c
join habits h on h.id = c.habit_id
where c.user_id = '<your-user-id>'
order by c.local_date desc, c.checked_in_at desc
limit 20;

-- Verify RLS: this should return 0 rows when run as anon (use the "Run as" dropdown).
select count(*) from habits;
```

---

## 9. Troubleshooting

| Symptom                                                            | Likely cause                                                 | Fix                                                                                          |
| ------------------------------------------------------------------ | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| Magic link email never arrives                                     | Email provider blocking, or Supabase email confirm is off     | Check Supabase → Auth → Logs. Confirm "Confirm email" is **on**. Check spam.                 |
| Magic link lands on `/auth/callback?error=...`                     | Redirect URL not in Supabase allow-list                       | Supabase → Auth → URL Configuration → add `http://localhost:3000/auth/callback`.             |
| `/app` redirects to `/login` even after clicking a valid link      | Env var missing or pointing at wrong project                  | Verify `.env.local` is in `streak-landing/` (not repo root) and matches Supabase project.    |
| `npm run dev` fails with "Cannot find module '@/…'"                | Fresh `node_modules` wasn't installed                         | `rm -rf node_modules && npm install`.                                                        |
| TypeScript errors about `never` in Supabase queries                | `@supabase/ssr` version skew with `supabase-js`              | Ensure `ssr@^0.10.2` + `supabase-js@^2.103.3` and Database type has `Views`/`Functions`/`Relationships` keys. |
| `Failed to patch lockfile` during `next build`                     | Next 14 + `package-lock=false` edge case                      | Ignore. Build still succeeds. Documented quirk.                                              |
| `Node.js 18 and below are deprecated` warnings                     | Old Node                                                      | Upgrade to Node 20 when convenient. Non-blocking.                                            |
| Check-in circle fills but streak stays at 0                        | Profile timezone missing → `local_date` stored differs from `todayInTimezone` | See [§6.7](#67-timezone-capture). Force a reload so `TimezoneCapture` writes your real zone. |
| Streak is 1-off from what you expect                               | Almost always a timezone mismatch between your system and `current_date` in SQL | Use explicit dates in backfills instead of `current_date`.                                    |

---

## 10. Cleanup between test runs

Nuke everything for your user and start fresh:

```sql
-- Replace with your user id from auth.users.
delete from check_ins where user_id = '<your-user-id>';
delete from habits    where user_id = '<your-user-id>';
-- Reset timezone back to UTC so you can re-test the capture flow.
update profiles set timezone = 'UTC' where id = '<your-user-id>';
```

To fully reset auth too: Supabase → Authentication → Users → delete your user. The `handle_new_user` trigger will recreate your profile the next time you sign up.

---

## Contributing to this playbook

- Add a subsection to [§6](#6-manual-smoke-tests) for every new surface a sprint introduces.
- If you discover a new troubleshooting recipe, add it to [§9](#9-troubleshooting) with the exact error message users will grep for.
- Don't delete sections — deprecate them with a one-line "removed in Sprint X.Y" note. Future regressions still need the old recipe.
