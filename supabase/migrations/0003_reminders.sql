-- Reminder infrastructure: channel prefs, quiet hours, unsubscribe, and a
-- per-day idempotency table so duplicate cron ticks never double-send.
-- Sprint 2.3 ships only the email adapter; the schema is extensible for
-- WhatsApp in Sprint 2.4 (the check constraint is widened in that migration).

-- ============================================================================
-- profiles: reminder preferences
-- ============================================================================
alter table public.profiles
  add column preferred_reminder_channel text not null default 'email'
    check (preferred_reminder_channel in ('email', 'none')),
  add column quiet_hours_start time,
  add column quiet_hours_end   time,
  add column unsubscribed_at   timestamptz;

comment on column public.profiles.preferred_reminder_channel is
  'email | none. Widened to include whatsapp in Sprint 2.4.';
comment on column public.profiles.quiet_hours_start is
  'Inclusive start of a silenced window in the users timezone. NULL means no quiet hours.';
comment on column public.profiles.quiet_hours_end is
  'Exclusive end of the silenced window. When end < start, the window wraps past midnight.';
comment on column public.profiles.unsubscribed_at is
  'One-click unsubscribe from the email footer. NULL means subscribed.';

-- ============================================================================
-- reminder_sends — idempotency + audit log
-- A row is written *before* the provider call so concurrent cron ticks collide
-- on the UNIQUE constraint and only one actually sends. Status is updated after
-- the provider response.
-- ============================================================================
create table public.reminder_sends (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  habit_id       uuid not null references public.habits(id)   on delete cascade,
  local_date     date not null,
  channel        text not null check (channel in ('email')), -- widened in 2.4
  status         text not null default 'pending'
    check (status in ('pending', 'sent', 'failed', 'rejected')),
  provider_id    text,         -- Mandrill _id / message id
  error_message  text,
  sent_at        timestamptz not null default now(),
  unique (habit_id, local_date, channel)
);

create index reminder_sends_user_date_idx
  on public.reminder_sends(user_id, local_date desc);

alter table public.reminder_sends enable row level security;

-- Users can read their own send history (useful for the settings page).
create policy "reminder_sends: owner read"
  on public.reminder_sends for select
  using (auth.uid() = user_id);

-- Writes happen from the cron job under the service role, which bypasses RLS.
-- No public write policy by design — users never insert/update these directly.
