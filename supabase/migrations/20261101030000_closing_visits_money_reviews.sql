-- Closing visits, the owner's money book, client debts and cards, gifts to one client, and tokenised review links.
-- Clients can read every column of their own bookings, so what a client paid or owes never goes on `bookings`: it lives
-- in owner-only tables. Only what the client may see stays there: `on_the_house`, `review_token`, `gift_id`.
-- Run by hand in the SQL editor; safe to run more than once.
alter table public.bookings
  add column if not exists review_token uuid not null default gen_random_uuid(),
  add column if not exists on_the_house boolean not null default false,
  add column if not exists gift_id uuid;
create unique index if not exists bookings_review_token_key on public.bookings (review_token);

create table if not exists public.visit_payments (
  booking_id uuid primary key references public.bookings (id) on delete cascade,
  amount_received integer not null default 0 check (amount_received between 0 and 1000000000),
  is_free boolean not null default false,
  note text not null default '' check (char_length(note) <= 500),
  paid_on date not null,
  updated_at timestamptz not null default now()
);
create index if not exists visit_payments_paid_on_idx on public.visit_payments (paid_on);

create table if not exists public.client_debts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid unique references public.bookings (id) on delete cascade,
  client_id uuid references auth.users (id) on delete set null,
  client_name text not null check (char_length(client_name) between 1 and 121),
  client_phone text,
  client_email text,
  amount integer not null check (amount between 1 and 1000000000),
  note text not null default '' check (char_length(note) <= 500),
  created_on date not null,
  forgiven_at timestamptz,
  last_reminded_at timestamptz,
  reminders integer not null default 0 check (reminders >= 0),
  created_at timestamptz not null default now()
);
create index if not exists client_debts_client_idx on public.client_debts (client_id);

create table if not exists public.money_entries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('income', 'expense', 'withdrawal', 'opening')),
  amount integer not null check (amount between 1 and 1000000000),
  entry_date date not null,
  scope text not null default 'business' check (scope in ('business', 'personal')),
  category text not null default '' check (char_length(category) <= 60),
  note text not null default '' check (char_length(note) <= 300),
  debt_id uuid references public.client_debts (id) on delete cascade,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists money_entries_date_idx on public.money_entries (entry_date desc);
create index if not exists money_entries_debt_idx on public.money_entries (debt_id) where debt_id is not null;

create table if not exists public.client_cards (
  client_key text primary key check (char_length(client_key) between 1 and 160),
  notes text not null default '' check (char_length(notes) <= 4000),
  vip boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists public.client_gifts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('free_cut', 'amount_off')),
  amount integer not null default 0 check (amount between 0 and 1000000),
  title text not null check (char_length(title) between 1 and 80),
  message text not null default '' check (char_length(message) <= 500),
  expires_on date,
  status text not null default 'active' check (status in ('active', 'used', 'cancelled')),
  used_booking_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists client_gifts_client_idx on public.client_gifts (client_id);

alter table public.visit_payments enable row level security;
alter table public.client_debts enable row level security;
alter table public.money_entries enable row level security;
alter table public.client_cards enable row level security;
alter table public.client_gifts enable row level security;

revoke all on public.visit_payments, public.client_debts, public.money_entries, public.client_cards, public.client_gifts from anon, authenticated;
grant select on public.visit_payments, public.client_gifts to authenticated;
grant select, insert, update, delete on public.client_debts, public.money_entries, public.client_cards to authenticated;

drop policy if exists "Owners read visit payments" on public.visit_payments;
create policy "Owners read visit payments" on public.visit_payments for select to authenticated
  using ((select public.is_studio_owner()));
drop policy if exists "Owners manage client debts" on public.client_debts;
create policy "Owners manage client debts" on public.client_debts for all to authenticated
  using ((select public.is_studio_owner())) with check ((select public.is_studio_owner()));
drop policy if exists "Owners manage the money book" on public.money_entries;
create policy "Owners manage the money book" on public.money_entries for all to authenticated
  using ((select public.is_studio_owner())) with check ((select public.is_studio_owner()));
drop policy if exists "Owners manage client cards" on public.client_cards;
create policy "Owners manage client cards" on public.client_cards for all to authenticated
  using ((select public.is_studio_owner())) with check ((select public.is_studio_owner()));
drop policy if exists "Clients read their own gifts; owners read all" on public.client_gifts;
create policy "Clients read their own gifts; owners read all" on public.client_gifts for select to authenticated
  using (client_id = (select auth.uid()) or (select public.is_studio_owner()));
