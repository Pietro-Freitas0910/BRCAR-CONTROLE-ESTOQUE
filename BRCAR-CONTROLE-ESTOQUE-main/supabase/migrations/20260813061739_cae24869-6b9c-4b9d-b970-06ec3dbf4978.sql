create table public.garage_settings (
  id boolean primary key default true,
  name text not null default 'BR Car Seminovos',
  whatsapp text not null default '',
  address text default '',
  city text default '',
  instagram text default '',
  catalog_headline text default 'Seminovos selecionados, revisados e prontos para rodar',
  stale_days int not null default 45,
  updated_at timestamptz not null default now(),
  constraint garage_settings_singleton check (id)
);
grant select on public.garage_settings to anon, authenticated;
grant insert, update on public.garage_settings to authenticated;
grant all on public.garage_settings to service_role;
alter table public.garage_settings enable row level security;
create policy "settings_public_read" on public.garage_settings for select using (true);
create policy "settings_team_write" on public.garage_settings for all to authenticated using (true) with check (true);
create trigger trg_settings_updated before update on public.garage_settings for each row execute function public.set_updated_at();

insert into public.garage_settings (id, whatsapp, address, city, instagram)
values (true, '5543999774439', 'Av. Brasil, 1155 - Vila Salomé, Cambé - PR, 86192-000', 'Cambé - PR', '@br.car.br');