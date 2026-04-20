-- Adds user locale preference. Two supported for now (en, pt-BR); more can be
-- added by widening the check constraint and shipping the dictionary file.
-- The app first-visit captures this from Accept-Language (mirrors the
-- timezone-capture pattern) and persists it, so the server can render in the
-- user's language on every subsequent request without a round-trip.

alter table public.profiles
  add column locale text not null default 'en'
  check (locale in ('en', 'pt-BR'));
