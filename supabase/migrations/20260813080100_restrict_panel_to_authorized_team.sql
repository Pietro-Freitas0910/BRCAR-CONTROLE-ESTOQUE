create table if not exists public.team_access_emails (
  email text primary key,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);
alter table public.team_access_emails enable row level security;
grant select, insert, delete on public.team_access_emails to authenticated;
grant all on public.team_access_emails to service_role;

create or replace function public.is_team_member(_user_id uuid default auth.uid())
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    join public.user_roles r on r.user_id = p.id
    where p.id = _user_id and p.active = true
      and r.role in ('admin'::public.app_role,'vendedor'::public.app_role,'financeiro'::public.app_role)
  );
$$;
revoke execute on function public.is_team_member(uuid) from anon;
grant execute on function public.is_team_member(uuid) to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare first_user boolean; allowed boolean;
begin
  select count(*) = 0 into first_user from public.profiles;
  select exists(select 1 from public.team_access_emails a where lower(a.email)=lower(new.email)) into allowed;
  if first_user or allowed then
    insert into public.profiles (id,name,email) values (new.id,coalesce(new.raw_user_meta_data->>'name',split_part(new.email,'@',1)),new.email) on conflict (id) do nothing;
    insert into public.user_roles (user_id,role) values (new.id,case when first_user then 'admin'::public.app_role else 'vendedor'::public.app_role end) on conflict (user_id,role) do nothing;
  end if;
  return new;
end; $$;
revoke execute on function public.handle_new_user() from anon, authenticated;

drop policy if exists "team_access_emails_team" on public.team_access_emails;
create policy "team_access_emails_team" on public.team_access_emails for all to authenticated using (public.is_team_member(auth.uid())) with check (public.is_team_member(auth.uid()));

drop policy if exists "profiles_read" on public.profiles;
create policy "profiles_read" on public.profiles for select to authenticated using (public.is_team_member(auth.uid()) or id=auth.uid());
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "roles_read_own" on public.user_roles;
create policy "roles_read_team" on public.user_roles for select to authenticated using (public.is_team_member(auth.uid()) or user_id=auth.uid());

drop policy if exists "customers_team" on public.customers; create policy "customers_team" on public.customers for all to authenticated using (public.is_team_member(auth.uid())) with check (public.is_team_member(auth.uid()));
drop policy if exists "suppliers_team" on public.suppliers; create policy "suppliers_team" on public.suppliers for all to authenticated using (public.is_team_member(auth.uid())) with check (public.is_team_member(auth.uid()));
drop policy if exists "vehicles_team" on public.vehicles; create policy "vehicles_team" on public.vehicles for all to authenticated using (public.is_team_member(auth.uid())) with check (public.is_team_member(auth.uid()));
drop policy if exists "photos_team" on public.vehicle_photos; create policy "photos_team" on public.vehicle_photos for all to authenticated using (public.is_team_member(auth.uid())) with check (public.is_team_member(auth.uid()));
drop policy if exists "documents_team" on public.vehicle_documents; create policy "documents_team" on public.vehicle_documents for all to authenticated using (public.is_team_member(auth.uid())) with check (public.is_team_member(auth.uid()));
drop policy if exists "checklist_team" on public.vehicle_checklist; create policy "checklist_team" on public.vehicle_checklist for all to authenticated using (public.is_team_member(auth.uid())) with check (public.is_team_member(auth.uid()));
drop policy if exists "entries_team" on public.vehicle_entries; create policy "entries_team" on public.vehicle_entries for all to authenticated using (public.is_team_member(auth.uid())) with check (public.is_team_member(auth.uid()));
drop policy if exists "expenses_team" on public.vehicle_expenses; create policy "expenses_team" on public.vehicle_expenses for all to authenticated using (public.is_team_member(auth.uid())) with check (public.is_team_member(auth.uid()));
drop policy if exists "prices_team" on public.vehicle_price_history; create policy "prices_team" on public.vehicle_price_history for all to authenticated using (public.is_team_member(auth.uid())) with check (public.is_team_member(auth.uid()));
drop policy if exists "sales_team" on public.vehicle_sales; create policy "sales_team" on public.vehicle_sales for all to authenticated using (public.is_team_member(auth.uid())) with check (public.is_team_member(auth.uid()));
drop policy if exists "history_team" on public.vehicle_history; create policy "history_team" on public.vehicle_history for all to authenticated using (public.is_team_member(auth.uid())) with check (public.is_team_member(auth.uid()));
drop policy if exists "garage_expenses_team" on public.garage_expenses; create policy "garage_expenses_team" on public.garage_expenses for all to authenticated using (public.is_team_member(auth.uid())) with check (public.is_team_member(auth.uid()));
drop policy if exists "leads_team" on public.leads; create policy "leads_team" on public.leads for all to authenticated using (public.is_team_member(auth.uid())) with check (public.is_team_member(auth.uid()));
drop policy if exists "notifications_team" on public.notifications; create policy "notifications_team" on public.notifications for all to authenticated using (public.is_team_member(auth.uid())) with check (public.is_team_member(auth.uid()));
drop policy if exists "settings_team_write" on public.garage_settings; create policy "settings_team_write" on public.garage_settings for all to authenticated using (public.is_team_member(auth.uid())) with check (public.is_team_member(auth.uid()));

drop policy if exists "team_read_vehicle_files" on storage.objects;
drop policy if exists "team_upload_vehicle_files" on storage.objects;
drop policy if exists "team_update_vehicle_files" on storage.objects;
drop policy if exists "team_delete_vehicle_files" on storage.objects;
create policy "team_read_vehicle_files" on storage.objects for select to authenticated using (bucket_id in ('vehicle-photos','vehicle-documents') and public.is_team_member(auth.uid()));
create policy "team_upload_vehicle_files" on storage.objects for insert to authenticated with check (bucket_id in ('vehicle-photos','vehicle-documents') and public.is_team_member(auth.uid()));
create policy "team_update_vehicle_files" on storage.objects for update to authenticated using (bucket_id in ('vehicle-photos','vehicle-documents') and public.is_team_member(auth.uid())) with check (bucket_id in ('vehicle-photos','vehicle-documents') and public.is_team_member(auth.uid()));
create policy "team_delete_vehicle_files" on storage.objects for delete to authenticated using (bucket_id in ('vehicle-photos','vehicle-documents') and public.is_team_member(auth.uid()));
