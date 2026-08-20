-- Adds a role to the invite allow-list and restricts managing it to admins only.
alter table public.team_access_emails
  add column if not exists role public.app_role not null default 'vendedor';

create or replace function public.is_admin(_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    join public.user_roles r on r.user_id = p.id
    where p.id = _user_id and p.active = true and r.role = 'admin'::public.app_role
  );
$$;
revoke execute on function public.is_admin(uuid) from anon;
grant execute on function public.is_admin(uuid) to authenticated;

drop policy if exists "team_access_emails_team" on public.team_access_emails;
create policy "team_access_emails_admin" on public.team_access_emails
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- admins can update any profile (needed to activate/deactivate access)
drop policy if exists "profiles_admin_update" on public.profiles;
create policy "profiles_admin_update" on public.profiles
  for update to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- admins can manage roles directly
drop policy if exists "roles_admin_write" on public.user_roles;
create policy "roles_admin_write" on public.user_roles
  for all to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare first_user boolean; wanted_role public.app_role;
begin
  select count(*) = 0 into first_user from public.profiles;
  select role into wanted_role from public.team_access_emails where lower(email) = lower(new.email);
  if first_user or wanted_role is not null then
    insert into public.profiles (id,name,email) values (new.id,coalesce(new.raw_user_meta_data->>'name',split_part(new.email,'@',1)),new.email) on conflict (id) do nothing;
    insert into public.user_roles (user_id,role) values (new.id, case when first_user then 'admin'::public.app_role else wanted_role end) on conflict (user_id,role) do nothing;
  end if;
  return new;
end; $$;
