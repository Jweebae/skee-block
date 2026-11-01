-- The in-site inbox: conversations between clients, found by username, and each client's conversation with the studio.
-- Browsers have no access to these tables at all: everything goes through the `inbox` Edge Function, which checks that
-- the caller belongs to the conversation. Owners see a client-to-client conversation only after one of the two reports it.
-- Run by hand in the SQL editor; safe to run more than once.
alter table public.client_profiles add column if not exists allow_messages boolean not null default true;

create table if not exists public.inbox_threads (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('direct', 'studio')),
  client_a uuid not null references auth.users (id) on delete cascade,
  client_b uuid references auth.users (id) on delete cascade,
  created_by uuid references auth.users (id) on delete set null,
  last_at timestamptz not null default now(),
  last_preview text not null default '' check (char_length(last_preview) <= 120),
  last_sender uuid references auth.users (id) on delete set null,
  last_from_studio boolean not null default false,
  a_read_at timestamptz,
  b_read_at timestamptz,
  studio_read_at timestamptz,
  a_hidden boolean not null default false,
  b_hidden boolean not null default false,
  reported_by uuid references auth.users (id) on delete set null,
  report_reason text check (report_reason is null or char_length(report_reason) <= 300),
  reported_at timestamptz,
  report_closed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint inbox_threads_shape check ((kind = 'studio' and client_b is null) or (kind = 'direct' and client_b is not null and client_a < client_b))
);
create unique index if not exists inbox_threads_studio_key on public.inbox_threads (client_a) where kind = 'studio';
create unique index if not exists inbox_threads_direct_key on public.inbox_threads (client_a, client_b) where kind = 'direct';
create index if not exists inbox_threads_b_idx on public.inbox_threads (client_b) where client_b is not null;
create index if not exists inbox_threads_recent_idx on public.inbox_threads (kind, last_at desc);

create table if not exists public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.inbox_threads (id) on delete cascade,
  sender_id uuid references auth.users (id) on delete set null,
  from_studio boolean not null default false,
  body text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists inbox_messages_thread_idx on public.inbox_messages (thread_id, created_at desc);
create index if not exists inbox_messages_sender_idx on public.inbox_messages (sender_id, created_at desc);

create table if not exists public.inbox_blocks (
  blocker uuid not null references auth.users (id) on delete cascade,
  blocked uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked)
);
create index if not exists inbox_blocks_blocked_idx on public.inbox_blocks (blocked);

alter table public.inbox_threads enable row level security;
alter table public.inbox_messages enable row level security;
alter table public.inbox_blocks enable row level security;
revoke all on public.inbox_threads, public.inbox_messages, public.inbox_blocks from anon, authenticated;
