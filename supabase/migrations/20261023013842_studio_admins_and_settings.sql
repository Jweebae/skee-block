-- Who may manage the studio. Rows are added only by the project owner (SQL editor / MCP), never by the app.
create table public.studio_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.studio_admins enable row level security;

create policy "Owners can read their own admin row"
  on public.studio_admins for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on public.studio_admins from anon, authenticated;
grant select on public.studio_admins to authenticated;

-- One shared settings document (menu, add-ons, working hours). Public by nature, writable only by owners.
create table public.studio_settings (
  id text primary key default 'main' check (id = 'main'),
  payload jsonb not null check (
    jsonb_typeof(payload) = 'object'
    and payload ->> 'version' = '2'
    and jsonb_typeof(payload -> 'services') = 'array'
    and jsonb_typeof(payload -> 'addons') = 'array'
    and jsonb_typeof(payload -> 'hours') = 'array'
    and octet_length(payload::text) <= 200000
  ),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);
alter table public.studio_settings enable row level security;

create policy "Anyone can read the studio settings"
  on public.studio_settings for select to anon, authenticated
  using (true);

create policy "Owners can create the studio settings"
  on public.studio_settings for insert to authenticated
  with check (exists (select 1 from public.studio_admins a where a.user_id = (select auth.uid())));

create policy "Owners can update the studio settings"
  on public.studio_settings for update to authenticated
  using (exists (select 1 from public.studio_admins a where a.user_id = (select auth.uid())))
  with check (exists (select 1 from public.studio_admins a where a.user_id = (select auth.uid())));

revoke all on public.studio_settings from anon, authenticated;
grant select on public.studio_settings to anon, authenticated;
grant insert, update on public.studio_settings to authenticated;

-- Server-side audit fields: clients cannot spoof who changed the settings or when.
create function public.stamp_studio_settings()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  return new;
end;
$$;

create trigger studio_settings_stamp
  before insert or update on public.studio_settings
  for each row execute function public.stamp_studio_settings();
