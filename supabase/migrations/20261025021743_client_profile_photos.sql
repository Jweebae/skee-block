-- Optional client profile photos, in a private bucket: each client manages files in their own folder (named after their
-- user id); owners can view all of them. Links are short-lived signed URLs. Reviews only show a photo when the client
-- chooses so (reviews.show_photo). Safe to run more than once.
alter table public.client_profiles add column if not exists avatar_path text
  check (avatar_path is null or avatar_path ~ '^[0-9a-f-]{36}/[A-Za-z0-9._-]+\.(webp|jpe?g)$');
grant insert (avatar_path) on public.client_profiles to authenticated;
grant update (avatar_path) on public.client_profiles to authenticated;

drop policy if exists "Clients create their own profile" on public.client_profiles;
create policy "Clients create their own profile" on public.client_profiles for insert to authenticated
  with check (user_id = (select auth.uid()) and (avatar_path is null or split_part(avatar_path, '/', 1) = (select auth.uid())::text));
drop policy if exists "Clients update their own profile" on public.client_profiles;
create policy "Clients update their own profile" on public.client_profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and (avatar_path is null or split_part(avatar_path, '/', 1) = (select auth.uid())::text));

alter table public.reviews add column if not exists show_photo boolean not null default false;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('client-photos', 'client-photos', false, 1048576, array['image/webp', 'image/jpeg'])
on conflict (id) do nothing;

drop policy if exists "Clients add their own photo" on storage.objects;
create policy "Clients add their own photo" on storage.objects for insert to authenticated
  with check (bucket_id = 'client-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "Clients replace their own photo" on storage.objects;
create policy "Clients replace their own photo" on storage.objects for update to authenticated
  using (bucket_id = 'client-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "Clients remove their own photo" on storage.objects;
create policy "Clients remove their own photo" on storage.objects for delete to authenticated
  using (bucket_id = 'client-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "Clients and owners view client photos" on storage.objects;
create policy "Clients and owners view client photos" on storage.objects for select to authenticated
  using (bucket_id = 'client-photos' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_studio_owner())));
