-- Owners manage owners from the admin page. Each function checks that the caller is already an owner.
-- Owners can only be added by the email of an existing account, never by creating one, and nobody can remove
-- themselves, so at least one owner always remains.
-- Written with "create or replace" so it can be run safely by hand in the SQL editor and again by the GitHub integration.
create or replace function public.is_studio_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.studio_admins a where a.user_id = (select auth.uid()));
$$;

create or replace function public.list_studio_owners()
returns table (user_id uuid, email text, added_at timestamptz, is_you boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_studio_owner() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  return query
    select a.user_id, u.email::text, a.created_at, a.user_id = (select auth.uid())
    from public.studio_admins a
    join auth.users u on u.id = a.user_id
    order by a.created_at;
end;
$$;

create or replace function public.add_studio_owner(owner_email text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  if not public.is_studio_owner() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  select u.id into target from auth.users u where lower(u.email) = lower(trim(owner_email)) limit 1;
  if target is null then
    raise exception 'no_account' using errcode = 'P0002';
  end if;
  insert into public.studio_admins (user_id) values (target) on conflict (user_id) do nothing;
  return target;
end;
$$;

create or replace function public.remove_studio_owner(owner_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_studio_owner() then
    raise exception 'not_allowed' using errcode = '42501';
  end if;
  if owner_id = (select auth.uid()) then
    raise exception 'cannot_remove_self' using errcode = '42501';
  end if;
  delete from public.studio_admins where user_id = owner_id;
end;
$$;

revoke all on function public.is_studio_owner() from public, anon;
revoke all on function public.list_studio_owners() from public, anon;
revoke all on function public.add_studio_owner(text) from public, anon;
revoke all on function public.remove_studio_owner(uuid) from public, anon;
grant execute on function public.is_studio_owner() to authenticated;
grant execute on function public.list_studio_owners() to authenticated;
grant execute on function public.add_studio_owner(text) to authenticated;
grant execute on function public.remove_studio_owner(uuid) to authenticated;
