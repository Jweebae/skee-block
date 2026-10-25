-- WhatsApp Cloud API connection (set up by the owner from the admin page) and cut photos.
-- Safe to run more than once (run by hand in the SQL editor, then again by the GitHub integration).

-- Connection details owners may read. The access token and app secret live in whatsapp_secrets, which no browser
-- role can read or write; only the whatsapp Edge Function (service role) touches it.
create table if not exists public.whatsapp_config (
  id text primary key default 'main' check (id = 'main'),
  display_number text check (display_number is null or display_number ~ '^\+[0-9]{8,15}$'),
  phone_number_id text check (phone_number_id is null or phone_number_id ~ '^[0-9]{5,30}$'),
  waba_id text check (waba_id is null or waba_id ~ '^[0-9]{5,30}$'),
  owner_alert_number text check (owner_alert_number is null or owner_alert_number ~ '^\+[0-9]{8,15}$'),
  verify_token text not null default encode(extensions.gen_random_bytes(18), 'hex'),
  last_check jsonb not null default '{}',
  updated_at timestamptz not null default now()
);
insert into public.whatsapp_config (id) values ('main') on conflict (id) do nothing;

create table if not exists public.whatsapp_secrets (
  id text primary key default 'main' check (id = 'main'),
  access_token text,
  app_secret text,
  updated_at timestamptz not null default now()
);

create table if not exists public.whatsapp_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  phone text not null,
  code text not null check (code ~ '^[0-9]{6}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 minutes',
  verified_at timestamptz
);
create index if not exists whatsapp_verifications_code_idx on public.whatsapp_verifications (code) where verified_at is null;

alter table public.whatsapp_config enable row level security;
alter table public.whatsapp_secrets enable row level security;
alter table public.whatsapp_verifications enable row level security;
revoke all on public.whatsapp_config, public.whatsapp_secrets, public.whatsapp_verifications from anon, authenticated;
grant select on public.whatsapp_config to authenticated;
drop policy if exists "Owners read the WhatsApp connection" on public.whatsapp_config;
create policy "Owners read the WhatsApp connection" on public.whatsapp_config for select to authenticated
  using ((select public.is_studio_owner()));

-- Paid automatic WhatsApp messages have their own switch, off by default.
alter table public.studio_private add column if not exists whatsapp_messages boolean not null default false;

-- A verified number stays verified only while it is unchanged; clients cannot mark themselves verified.
alter table public.client_profiles add column if not exists phone_verified_at timestamptz;
revoke insert, update on public.client_profiles from authenticated;
grant insert (user_id, phone, reminder_channel, email_notifications, rebook_nudges, updated_at) on public.client_profiles to authenticated;
grant update (user_id, phone, reminder_channel, email_notifications, rebook_nudges, updated_at) on public.client_profiles to authenticated;

create or replace function public.reset_phone_verification()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.phone is distinct from old.phone then
    new.phone_verified_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists client_profiles_phone_changed on public.client_profiles;
create trigger client_profiles_phone_changed before update on public.client_profiles
  for each row execute function public.reset_phone_verification();

-- Cut photos: public to view, only owners can add, replace or remove them.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cut-photos', 'cut-photos', true, 1048576, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

drop policy if exists "Owners add cut photos" on storage.objects;
create policy "Owners add cut photos" on storage.objects for insert to authenticated
  with check (bucket_id = 'cut-photos' and (select public.is_studio_owner()));
drop policy if exists "Owners replace cut photos" on storage.objects;
create policy "Owners replace cut photos" on storage.objects for update to authenticated
  using (bucket_id = 'cut-photos' and (select public.is_studio_owner()));
drop policy if exists "Owners remove cut photos" on storage.objects;
create policy "Owners remove cut photos" on storage.objects for delete to authenticated
  using (bucket_id = 'cut-photos' and (select public.is_studio_owner()));
drop policy if exists "Owners list cut photos" on storage.objects;
create policy "Owners list cut photos" on storage.objects for select to authenticated
  using (bucket_id = 'cut-photos' and (select public.is_studio_owner()));
