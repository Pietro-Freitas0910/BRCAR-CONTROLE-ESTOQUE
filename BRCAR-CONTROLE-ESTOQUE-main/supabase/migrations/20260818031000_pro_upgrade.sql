-- =========================================================
-- BR CAR — Upgrade profissional de controle de estoque
-- Rode este arquivo no SQL Editor do seu Supabase (ou via CLI).
-- Ele é idempotente: pode rodar mais de uma vez sem quebrar.
-- =========================================================

-- 1) Configurações da loja muito mais completas
alter table public.garage_settings
  add column if not exists logo_url text,
  add column if not exists catalog_banner_url text,
  add column if not exists email text,
  add column if not exists cnpj text,
  add column if not exists opening_hours text,
  add column if not exists catalog_subheadline text,
  add column if not exists show_prices boolean not null default true,
  add column if not exists default_commission_pct numeric not null default 0,
  add column if not exists monthly_goal_sales integer not null default 0,
  add column if not exists monthly_goal_profit numeric not null default 0,
  add column if not exists monthly_goal_revenue numeric not null default 0,
  add column if not exists min_margin_pct numeric not null default 8,
  add column if not exists doc_alert_days integer not null default 15,
  add column if not exists expense_categories text[] not null default array[
    'Mecânica','Funilaria','Pintura','Pneus','Higienização','Documentação','Comissão','Marketing','Outros'
  ],
  add column if not exists garage_expense_categories text[] not null default array[
    'Aluguel','Energia','Água','Internet','Salários','Marketing','Impostos','Software','Manutenção','Outros'
  ],
  add column if not exists checklist_template text[] not null default array[
    'Revisão mecânica','Troca de óleo','Polimento','Higienização interna','Documentação conferida','Fotos publicadas'
  ];

-- 2) Fotos/anexos em mais lugares
alter table public.profiles   add column if not exists avatar_url text;
alter table public.customers  add column if not exists photo_url text;
alter table public.suppliers  add column if not exists photo_url text;
alter table public.vehicle_expenses add column if not exists receipt_url text;
alter table public.garage_expenses  add column if not exists receipt_url text;

-- 3) Follow-up de leads
alter table public.leads
  add column if not exists notes text,
  add column if not exists next_followup date,
  add column if not exists assigned_to uuid references auth.users(id) on delete set null;

-- 4) Bucket público de imagens do sistema (logo, avatares, comprovantes, banners)
insert into storage.buckets (id, name, public)
values ('app-assets','app-assets', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "app_assets_public_read" on storage.objects;
create policy "app_assets_public_read" on storage.objects
  for select to public using (bucket_id = 'app-assets');

drop policy if exists "app_assets_team_write" on storage.objects;
create policy "app_assets_team_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'app-assets');

drop policy if exists "app_assets_team_update" on storage.objects;
create policy "app_assets_team_update" on storage.objects
  for update to authenticated using (bucket_id = 'app-assets');

drop policy if exists "app_assets_team_delete" on storage.objects;
create policy "app_assets_team_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'app-assets');

-- Garantir que a equipe consegue gravar/apagar fotos de veículos e documentos
drop policy if exists "vehicle_photos_team_write" on storage.objects;
create policy "vehicle_photos_team_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'vehicle-photos');

drop policy if exists "vehicle_photos_team_delete" on storage.objects;
create policy "vehicle_photos_team_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'vehicle-photos');

drop policy if exists "vehicle_docs_team_all" on storage.objects;
create policy "vehicle_docs_team_all" on storage.objects
  for all to authenticated using (bucket_id = 'vehicle-documents') with check (bucket_id = 'vehicle-documents');

-- 5) Visão mensal de vendas (usada nos relatórios/exportação)
create or replace view public.monthly_sales_report with (security_invoker = true) as
select
  to_char(s.sale_date, 'YYYY-MM')                                 as month,
  count(*)                                                        as sales_count,
  sum(s.sold_value)                                               as revenue,
  sum(coalesce(f.total_cost, 0))                                  as total_cost,
  sum(coalesce(s.commission_value, 0))                            as commissions,
  sum(coalesce(s.sale_expenses, 0))                               as sale_expenses,
  sum(coalesce(f.real_profit, 0))                                 as profit,
  case when sum(s.sold_value) > 0
    then sum(coalesce(f.real_profit,0)) / sum(s.sold_value) * 100 end as margin_pct,
  avg(coalesce(f.days_in_stock, 0))                               as avg_days_in_stock
from public.vehicle_sales s
left join public.vehicle_financials f on f.vehicle_id = s.vehicle_id
group by 1;

grant select on public.monthly_sales_report to authenticated, service_role;
