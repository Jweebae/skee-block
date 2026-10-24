-- Real bookings, client profiles, owner notes on clients, reviews and the private studio location.
-- Browsers only read (clients their own rows, owners everything). All booking and review changes go through the
-- `bookings` Edge Function, which runs with the service role and checks every rule; the only browser writes are a
-- client's own profile and owners' private notes and studio details.

create table if not exists public.client_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  phone text check (phone is null or phone ~ '^\+?[0-9 ]{8,20}$'),
  reminder_channel text not null default 'email' check (reminder_channel in ('email', 'whatsapp')),
  email_notifications boolean not null default true,
  rebook_nudges boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^SKB-[0-9]{4,6}$'),
  client_id uuid references auth.users (id) on delete set null,
  client_name text not null check (char_length(client_name) between 1 and 121),
  client_email text,
  client_phone text,
  service_id text not null,
  service_name text not null,
  addons jsonb not null default '[]' check (jsonb_typeof(addons) = 'array'),
  preferences text[] not null default '{}',
  notes text not null default '' check (char_length(notes) <= 1000),
  reminder_channel text not null default 'email' check (reminder_channel in ('email', 'whatsapp')),
  total_price integer not null check (total_price >= 0),
  duration_minutes integer not null check (duration_minutes between 5 and 600),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'requested' check (status in ('requested', 'confirmed', 'declined', 'cancelled', 'completed', 'no_show', 'expired')),
  source text not null default 'website' check (source in ('website', 'walk_in')),
  cancelled_by text check (cancelled_by in ('client', 'studio')),
  client_hidden boolean not null default false,
  emails jsonb not null default '{}' check (jsonb_typeof(emails) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_time_order check (ends_at > starts_at),
  -- Two live bookings can never share a minute of the chair.
  constraint bookings_no_overlap exclude using gist (tstzrange(starts_at, ends_at, '[)') with &&) where (status in ('requested', 'confirmed'))
);
create index if not exists bookings_client_idx on public.bookings (client_id);
create index if not exists bookings_starts_idx on public.bookings (starts_at);

create table if not exists public.client_owner_notes (
  user_id uuid primary key references auth.users (id) on delete cascade,
  notes text not null default '' check (char_length(notes) <= 4000),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  client_id uuid references auth.users (id) on delete set null,
  display_name text not null,
  service_name text not null,
  rating integer not null check (rating between 1 and 5),
  body text not null check (char_length(body) between 1 and 1000),
  flags text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reply text check (reply is null or char_length(reply) <= 600),
  created_at timestamptz not null default now(),
  published_at timestamptz
);
create index if not exists reviews_status_idx on public.reviews (status, published_at desc);

create table if not exists public.studio_private (
  id text primary key default 'main' check (id = 'main'),
  location_url text check (location_url is null or location_url ~ '^https://'),
  location_note text check (location_note is null or char_length(location_note) <= 500),
  updated_at timestamptz not null default now()
);

alter table public.client_profiles enable row level security;
alter table public.bookings enable row level security;
alter table public.client_owner_notes enable row level security;
alter table public.reviews enable row level security;
alter table public.studio_private enable row level security;

revoke all on public.client_profiles, public.bookings, public.client_owner_notes, public.reviews, public.studio_private from anon, authenticated;
grant select, insert, update on public.client_profiles to authenticated;
grant select on public.bookings, public.reviews to authenticated;
grant select, insert, update on public.client_owner_notes, public.studio_private to authenticated;

create policy "Clients manage their own profile; owners read all" on public.client_profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_studio_owner()));
create policy "Clients create their own profile" on public.client_profiles for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Clients update their own profile" on public.client_profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "Clients read their own bookings; owners read all" on public.bookings for select to authenticated
  using (client_id = (select auth.uid()) or (select public.is_studio_owner()));

create policy "Clients read their own reviews; owners read all" on public.reviews for select to authenticated
  using (client_id = (select auth.uid()) or (select public.is_studio_owner()));

create policy "Owners manage private client notes" on public.client_owner_notes for all to authenticated
  using ((select public.is_studio_owner())) with check ((select public.is_studio_owner()));

create policy "Owners manage the private studio details" on public.studio_private for all to authenticated
  using ((select public.is_studio_owner())) with check ((select public.is_studio_owner()));
