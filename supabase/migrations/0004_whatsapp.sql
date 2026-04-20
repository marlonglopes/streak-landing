-- Sprint 2.4 scaffolding: add WhatsApp as a reminder channel behind the same
-- dispatch interface as email. No BSP is wired yet — the adapter runs in
-- dry-run by default until Meta Business verification + template approval
-- clears. See docs/SPRINTS.md §Sprint 2.4.

-- ============================================================================
-- profiles: phone number + WhatsApp opt-in
-- phone_e164 stays nullable because only WhatsApp users need it.
-- ============================================================================
alter table public.profiles
  add column phone_e164      text
    check (phone_e164 is null or phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  add column whatsapp_opt_in boolean not null default false;

comment on column public.profiles.phone_e164 is
  'E.164 phone number (e.g. +5511998765432). NULL until the user verifies via OTP.';
comment on column public.profiles.whatsapp_opt_in is
  'True only after OTP verification succeeds. Cleared on STOP keyword.';

-- ============================================================================
-- Widen preferred_reminder_channel to include whatsapp.
-- 0003 created the CHECK inline with the default Postgres name
-- (<table>_<column>_check), so we drop it by that name and re-add.
-- ============================================================================
alter table public.profiles
  drop constraint profiles_preferred_reminder_channel_check;

alter table public.profiles
  add constraint profiles_preferred_reminder_channel_check
    check (preferred_reminder_channel in ('email', 'whatsapp', 'none'));

comment on column public.profiles.preferred_reminder_channel is
  'email | whatsapp | none. Per-user, not per-habit.';

-- ============================================================================
-- Widen reminder_sends.channel so the idempotency row can record a WhatsApp
-- attempt. The UNIQUE (habit_id, local_date, channel) constraint still holds.
-- ============================================================================
alter table public.reminder_sends
  drop constraint reminder_sends_channel_check;

alter table public.reminder_sends
  add constraint reminder_sends_channel_check
    check (channel in ('email', 'whatsapp'));
