-- Usernames: clients can sign in with email or username. Set only through the `account` Edge Function, which checks
-- the format and that the name is free; clients can read their own but not write it directly (no column grant).
alter table public.client_profiles add column if not exists username text;
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'client_profiles_username_format') then
    alter table public.client_profiles add constraint client_profiles_username_format
      check (username is null or username ~ '^[a-z0-9]([a-z0-9._]{1,28})[a-z0-9]$');
  end if;
end $$;
create unique index if not exists client_profiles_username_key on public.client_profiles (username);

-- Failed username sign-ins, so the account function can slow down password guessing.
create table if not exists public.login_attempts (
  id bigint generated always as identity primary key,
  username text not null,
  succeeded boolean not null default false,
  at timestamptz not null default now()
);
create index if not exists login_attempts_recent_idx on public.login_attempts (username, at desc);
alter table public.login_attempts enable row level security;
revoke all on public.login_attempts from anon, authenticated;
