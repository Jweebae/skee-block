-- Owner switches for every message the website sends. Account emails (codes, password resets) are sent by Supabase
-- Auth and cannot be switched off here, because clients need them to sign in.
alter table public.studio_private
  add column if not exists client_emails boolean not null default true,
  add column if not exists owner_alerts boolean not null default true,
  add column if not exists whatsapp_verification boolean not null default false;

insert into public.studio_private (id) values ('main') on conflict (id) do nothing;
