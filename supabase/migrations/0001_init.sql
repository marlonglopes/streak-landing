-- Streak v1 schema: profiles, habits, check_ins.
-- Timezone-aware design: check_ins store the user's LOCAL calendar date,
-- computed client-side from the profile's timezone. Streak math is a pure
-- function of (habit_id, local_date) rows — no UTC off-by-one surprises.

-- ============================================================================
-- profiles (extends auth.users)
-- ============================================================================
create table public.profiles (
  id                    uuid primary key references auth.users on delete cascade,
  display_name          text,
  timezone              text not null default 'UTC',
  subscription_tier     text not null default 'free' check (subscription_tier in ('free', 'pro')),
  stripe_customer_id    text unique,
  stripe_subscription_id text unique,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

-- ============================================================================
-- habits
-- ============================================================================
create table public.habits (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.profiles(id) on delete cascade,
  name                 text not null check (char_length(name) between 1 and 100),
  emoji                text check (char_length(emoji) <= 8),
  cadence              text not null default 'daily' check (cadence in ('daily', 'weekly')),
  target_days_of_week  smallint[] not null default '{0,1,2,3,4,5,6}', -- 0=Sun, 6=Sat
  reminder_time        time,
  archived_at          timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

create index habits_user_active_idx
  on public.habits(user_id)
  where archived_at is null;

-- ============================================================================
-- check_ins
-- Unique on (habit_id, local_date) so a user can't double-log the same day.
-- ============================================================================
create table public.check_ins (
  id             uuid primary key default gen_random_uuid(),
  habit_id       uuid not null references public.habits(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  local_date     date not null,
  checked_in_at  timestamptz not null default now(),
  unique (habit_id, local_date)
);

create index check_ins_habit_date_idx on public.check_ins(habit_id, local_date desc);
create index check_ins_user_date_idx  on public.check_ins(user_id, local_date desc);

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles  enable row level security;
alter table public.habits    enable row level security;
alter table public.check_ins enable row level security;

create policy "profiles: owner full access"
  on public.profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "habits: owner full access"
  on public.habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "check_ins: owner full access"
  on public.check_ins for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- Auto-create a profile row on every new auth.users signup.
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================================
-- updated_at touch trigger
-- ============================================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create trigger habits_touch_updated_at
  before update on public.habits
  for each row execute function public.touch_updated_at();
