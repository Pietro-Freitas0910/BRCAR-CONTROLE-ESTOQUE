-- ENUMS
create type public.app_role as enum ('admin','vendedor','financeiro');
create type public.vehicle_status as enum ('em_preparacao','disponivel','reservado','vendido','entregue','consignado');
create type public.entry_type as enum ('compra_direta','troca','consignacao');
create type public.document_status as enum ('ok','pendente','incompleta','irregular');
create type public.payment_method as enum ('a_vista','financiamento','troca','pix','cartao','boleto','outro');

-- UPDATED_AT
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default 'Usuário',
  email text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_read" on public.profiles for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create trigger trg_profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

-- ROLES
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create policy "roles_read_own" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

-- novo usuário => profile + papel admin para o primeiro, vendedor para os demais
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare first_user boolean;
begin
  select count(*) = 0 into first_user from public.profiles;
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.email);
  insert into public.user_roles (user_id, role)
  values (new.id, case when first_user then 'admin'::public.app_role else 'vendedor'::public.app_role end);
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- CUSTOMERS
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text, document text, city text, email text, notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.customers to authenticated;
grant all on public.customers to service_role;
alter table public.customers enable row level security;
create policy "customers_team" on public.customers for all to authenticated using (true) with check (true);
create trigger trg_customers_updated before update on public.customers for each row execute function public.set_updated_at();

-- SUPPLIERS
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null, category text, phone text, city text, notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.suppliers to authenticated;
grant all on public.suppliers to service_role;
alter table public.suppliers enable row level security;
create policy "suppliers_team" on public.suppliers for all to authenticated using (true) with check (true);
create trigger trg_suppliers_updated before update on public.suppliers for each row execute function public.set_updated_at();

-- VEHICLES
create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  brand text not null, model text not null, version text,
  manufacture_year int, model_year int,
  plate text, renavam text, chassi text, color text, fuel text, transmission text,
  mileage int default 0, doors int, engine text, category text,
  optionals text[] not null default '{}',
  notes text,
  status public.vehicle_status not null default 'em_preparacao',
  cover_photo_url text,
  minimum_price numeric(12,2), target_price numeric(12,2), listed_price numeric(12,2),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index vehicles_status_idx on public.vehicles(status);
create index vehicles_brand_model_idx on public.vehicles(brand, model);
grant select, insert, update, delete on public.vehicles to authenticated;
grant select on public.vehicles to anon;
grant all on public.vehicles to service_role;
alter table public.vehicles enable row level security;
create policy "vehicles_team" on public.vehicles for all to authenticated using (true) with check (true);
create policy "vehicles_public_available" on public.vehicles for select to anon using (status in ('disponivel','reservado') and deleted_at is null);
create trigger trg_vehicles_updated before update on public.vehicles for each row execute function public.set_updated_at();

-- PHOTOS
create table public.vehicle_photos (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  url text not null, is_cover boolean not null default false, position int not null default 0,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.vehicle_photos to authenticated;
grant select on public.vehicle_photos to anon;
grant all on public.vehicle_photos to service_role;
alter table public.vehicle_photos enable row level security;
create policy "photos_team" on public.vehicle_photos for all to authenticated using (true) with check (true);
create policy "photos_public" on public.vehicle_photos for select to anon using (
  exists (select 1 from public.vehicles v where v.id = vehicle_id and v.status in ('disponivel','reservado') and v.deleted_at is null)
);

-- DOCUMENTS
create table public.vehicle_documents (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  doc_type text not null,
  status public.document_status not null default 'pendente',
  file_url text, due_date date, notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.vehicle_documents to authenticated;
grant all on public.vehicle_documents to service_role;
alter table public.vehicle_documents enable row level security;
create policy "documents_team" on public.vehicle_documents for all to authenticated using (true) with check (true);
create trigger trg_documents_updated before update on public.vehicle_documents for each row execute function public.set_updated_at();

-- CHECKLIST DE PREPARAÇÃO
create table public.vehicle_checklist (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  item text not null,
  done boolean not null default false,
  position int not null default 0,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.vehicle_checklist to authenticated;
grant all on public.vehicle_checklist to service_role;
alter table public.vehicle_checklist enable row level security;
create policy "checklist_team" on public.vehicle_checklist for all to authenticated using (true) with check (true);

-- ENTRIES
create table public.vehicle_entries (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null unique references public.vehicles(id) on delete cascade,
  entry_date date not null default current_date,
  origin text, seller_name text, seller_phone text,
  entry_type public.entry_type not null default 'compra_direta',
  purchase_value numeric(12,2) not null default 0,
  trade_value numeric(12,2) default 0,
  payment_method public.payment_method,
  amount_paid numeric(12,2) default 0,
  amount_pending numeric(12,2) default 0,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.vehicle_entries to authenticated;
grant all on public.vehicle_entries to service_role;
alter table public.vehicle_entries enable row level security;
create policy "entries_team" on public.vehicle_entries for all to authenticated using (true) with check (true);

-- EXPENSES
create table public.vehicle_expenses (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  category text not null, description text,
  value numeric(12,2) not null default 0,
  expense_date date not null default current_date,
  supplier_id uuid references public.suppliers(id),
  receipt_url text, notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.vehicle_expenses to authenticated;
grant all on public.vehicle_expenses to service_role;
alter table public.vehicle_expenses enable row level security;
create policy "expenses_team" on public.vehicle_expenses for all to authenticated using (true) with check (true);

-- PRICE HISTORY
create table public.vehicle_price_history (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  old_value numeric(12,2), new_value numeric(12,2) not null,
  changed_by uuid references auth.users(id),
  changed_at timestamptz not null default now()
);
grant select, insert on public.vehicle_price_history to authenticated;
grant all on public.vehicle_price_history to service_role;
alter table public.vehicle_price_history enable row level security;
create policy "prices_team" on public.vehicle_price_history for all to authenticated using (true) with check (true);

-- SALES
create table public.vehicle_sales (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null unique references public.vehicles(id) on delete cascade,
  sale_date date not null default current_date,
  sold_value numeric(12,2) not null,
  customer_id uuid references public.customers(id),
  buyer_name text, buyer_phone text, buyer_document text,
  payment_method public.payment_method,
  is_financed boolean not null default false,
  bank text, financed_value numeric(12,2) default 0, down_payment numeric(12,2) default 0,
  trade_in_vehicle text,
  salesperson_id uuid references auth.users(id),
  commission_value numeric(12,2) default 0,
  sale_expenses numeric(12,2) default 0,
  notes text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.vehicle_sales to authenticated;
grant all on public.vehicle_sales to service_role;
alter table public.vehicle_sales enable row level security;
create policy "sales_team" on public.vehicle_sales for all to authenticated using (true) with check (true);

-- HISTORY
create table public.vehicle_history (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  event_type text not null, description text not null,
  performed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create index vehicle_history_idx on public.vehicle_history(vehicle_id, created_at desc);
grant select, insert on public.vehicle_history to authenticated;
grant all on public.vehicle_history to service_role;
alter table public.vehicle_history enable row level security;
create policy "history_team" on public.vehicle_history for all to authenticated using (true) with check (true);

-- GARAGE EXPENSES
create table public.garage_expenses (
  id uuid primary key default gen_random_uuid(),
  category text not null, description text,
  value numeric(12,2) not null default 0,
  expense_date date not null default current_date,
  receipt_url text, notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.garage_expenses to authenticated;
grant all on public.garage_expenses to service_role;
alter table public.garage_expenses enable row level security;
create policy "garage_expenses_team" on public.garage_expenses for all to authenticated using (true) with check (true);

-- LEADS (catálogo público)
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid references public.vehicles(id) on delete set null,
  name text not null, phone text not null, message text,
  source text not null default 'catalogo',
  status text not null default 'novo',
  created_at timestamptz not null default now()
);
grant select, update, delete on public.leads to authenticated;
grant insert on public.leads to anon, authenticated;
grant all on public.leads to service_role;
alter table public.leads enable row level security;
create policy "leads_team" on public.leads for all to authenticated using (true) with check (true);
create policy "leads_public_insert" on public.leads for insert to anon with check (true);

-- NOTIFICATIONS
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  vehicle_id uuid references public.vehicles(id) on delete cascade,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;
create policy "notifications_team" on public.notifications for all to authenticated using (true) with check (true);

-- VIEW FINANCEIRA
create or replace view public.vehicle_financials with (security_invoker = true) as
select
  v.id as vehicle_id,
  coalesce(e.purchase_value,0) as entry_value,
  coalesce(exp.total_expenses,0) as total_expenses,
  coalesce(e.purchase_value,0) + coalesce(exp.total_expenses,0) as total_cost,
  v.listed_price,
  v.listed_price - (coalesce(e.purchase_value,0) + coalesce(exp.total_expenses,0)) as expected_profit,
  case when v.listed_price > 0 then
    (v.listed_price - (coalesce(e.purchase_value,0) + coalesce(exp.total_expenses,0))) / v.listed_price * 100
  end as expected_margin_pct,
  s.sold_value,
  case when s.sold_value is not null then
    s.sold_value - (coalesce(e.purchase_value,0) + coalesce(exp.total_expenses,0)) - coalesce(s.sale_expenses,0) - coalesce(s.commission_value,0)
  end as real_profit,
  e.entry_date, s.sale_date,
  case when s.sale_date is not null then (s.sale_date - e.entry_date)
       when e.entry_date is not null then (current_date - e.entry_date) end as days_in_stock
from public.vehicles v
left join public.vehicle_entries e on e.vehicle_id = v.id
left join (select vehicle_id, sum(value) as total_expenses from public.vehicle_expenses group by vehicle_id) exp on exp.vehicle_id = v.id
left join public.vehicle_sales s on s.vehicle_id = v.id;
grant select on public.vehicle_financials to authenticated, service_role;

-- TRIGGERS DE HISTÓRICO
create or replace function public.log_vehicle_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.vehicle_history (vehicle_id, event_type, description, performed_by)
  values (new.id, 'cadastrado', 'Veículo cadastrado no sistema', new.created_by);
  return new;
end; $$;
create trigger trg_log_vehicle_created after insert on public.vehicles for each row execute function public.log_vehicle_created();

create or replace function public.log_vehicle_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.vehicle_history (vehicle_id, event_type, description)
    values (new.id, 'status', 'Status alterado de ' || old.status || ' para ' || new.status);
  end if;
  if new.listed_price is distinct from old.listed_price then
    insert into public.vehicle_price_history (vehicle_id, old_value, new_value)
    values (new.id, old.listed_price, coalesce(new.listed_price,0));
  end if;
  return new;
end; $$;
create trigger trg_log_vehicle_status after update on public.vehicles for each row execute function public.log_vehicle_status_change();

create or replace function public.log_vehicle_expense()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.vehicle_history (vehicle_id, event_type, description, performed_by)
  values (new.vehicle_id, 'despesa', 'Despesa lançada: ' || new.category || ' - R$ ' || new.value, new.created_by);
  return new;
end; $$;
create trigger trg_log_vehicle_expense after insert on public.vehicle_expenses for each row execute function public.log_vehicle_expense();

create or replace function public.log_price_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.vehicle_history (vehicle_id, event_type, description, performed_by)
  values (new.vehicle_id, 'preco_alterado',
    'Preço alterado de R$ ' || coalesce(new.old_value::text,'-') || ' para R$ ' || new.new_value, new.changed_by);
  return new;
end; $$;
create trigger trg_log_price_change after insert on public.vehicle_price_history for each row execute function public.log_price_change();

create or replace function public.log_vehicle_sold()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.vehicle_history (vehicle_id, event_type, description)
  values (new.vehicle_id, 'vendido', 'Veículo vendido por R$ ' || new.sold_value);
  update public.vehicles set status = 'vendido' where id = new.vehicle_id;
  return new;
end; $$;
create trigger trg_log_vehicle_sold after insert on public.vehicle_sales for each row execute function public.log_vehicle_sold();

-- ============ DADOS DE EXEMPLO ============
insert into public.suppliers (id, name, category, phone, city) values
  ('11111111-1111-4111-8111-111111111101','Mecânica do Zé','mecanico','5544999990001','Maringá'),
  ('11111111-1111-4111-8111-111111111102','Funilaria Prime','funilaria','5544999990002','Maringá'),
  ('11111111-1111-4111-8111-111111111103','Despachante Rápido','despachante','5544999990003','Maringá'),
  ('11111111-1111-4111-8111-111111111104','Lava Jato Cristal','lavador','5544999990004','Maringá');

insert into public.customers (id, name, phone, document, city) values
  ('22222222-2222-4222-8222-222222222201','Carlos Ferreira','5544998880001','123.456.789-00','Maringá'),
  ('22222222-2222-4222-8222-222222222202','Juliana Prado','5544998880002','987.654.321-00','Sarandi'),
  ('22222222-2222-4222-8222-222222222203','Marcos Antunes','5544998880003','456.789.123-00','Paiçandu');

insert into public.vehicles (id, brand, model, version, manufacture_year, model_year, plate, color, fuel, transmission, mileage, doors, engine, category, status, minimum_price, target_price, listed_price, optionals, notes) values
  ('33333333-3333-4333-8333-333333333301','Toyota','Corolla','XEI 2.0',2021,2022,'ABC1D23','Prata','Flex','Automático',48000,4,'2.0','Sedan','disponivel',118000,128000,124900,'{"Ar digital","Multimídia","Câmera de ré","Bancos em couro"}','Único dono, revisões em dia.'),
  ('33333333-3333-4333-8333-333333333302','Honda','HR-V','EXL 1.8',2020,2020,'DEF4G56','Branco','Flex','Automático',62000,4,'1.8','SUV','disponivel',104000,115000,112900,'{"Teto solar","Multimídia","Sensor de estacionamento"}','Segundo dono, pneus novos.'),
  ('33333333-3333-4333-8333-333333333303','Jeep','Compass','Longitude Diesel',2022,2022,'GHI7J89','Cinza','Diesel','Automático',39000,4,'2.0 TD','SUV','disponivel',158000,172000,169900,'{"4x4","Teto solar","Bancos em couro","Piloto automático"}','Diesel 4x4, impecável.'),
  ('33333333-3333-4333-8333-333333333304','Volkswagen','Nivus','Highline 200 TSI',2021,2021,'JKL1M23','Azul','Flex','Automático',35000,4,'1.0 TSI','SUV','em_preparacao',95000,105000,103900,'{"Multimídia VW Play","Painel digital"}','Entrando em preparação.'),
  ('33333333-3333-4333-8333-333333333305','Fiat','Toro','Freedom 1.3 T',2022,2023,'NOP4Q56','Vermelho','Flex','Automático',28000,4,'1.3 Turbo','Picape','reservado',132000,142000,139900,'{"Multimídia","Capota marítima"}','Reservada com sinal.'),
  ('33333333-3333-4333-8333-333333333306','Chevrolet','Onix','LTZ 1.0 Turbo',2020,2021,'RST7U89','Preto','Flex','Automático',71000,4,'1.0 Turbo','Hatch','vendido',68000,76000,74900,'{"Multimídia MyLink","Ar digital"}','Vendido em julho.');

insert into public.vehicle_entries (vehicle_id, entry_date, origin, seller_name, entry_type, purchase_value, payment_method, amount_paid) values
  ('33333333-3333-4333-8333-333333333301', current_date - 42, 'Particular','Rogério Lima','compra_direta',106000,'pix',106000),
  ('33333333-3333-4333-8333-333333333302', current_date - 96, 'Leilão','Leilão Master','compra_direta',94000,'a_vista',94000),
  ('33333333-3333-4333-8333-333333333303', current_date - 18, 'Troca','Cliente Ana','troca',148000,'troca',148000),
  ('33333333-3333-4333-8333-333333333304', current_date - 7,  'Particular','Fernando Reis','compra_direta',88000,'pix',88000),
  ('33333333-3333-4333-8333-333333333305', current_date - 61, 'Particular','Tiago Nunes','compra_direta',121000,'financiamento',121000),
  ('33333333-3333-4333-8333-333333333306', current_date - 120,'Particular','Sandra Melo','compra_direta',61000,'pix',61000);

insert into public.vehicle_expenses (vehicle_id, category, description, value, expense_date, supplier_id) values
  ('33333333-3333-4333-8333-333333333301','mecanica','Revisão completa + correia',2800, current_date - 38,'11111111-1111-4111-8111-111111111101'),
  ('33333333-3333-4333-8333-333333333301','estetica','Polimento e higienização',700, current_date - 35,'11111111-1111-4111-8111-111111111104'),
  ('33333333-3333-4333-8333-333333333302','pneus','4 pneus novos',3200, current_date - 90,'11111111-1111-4111-8111-111111111101'),
  ('33333333-3333-4333-8333-333333333302','funilaria','Reparo para-choque',1500, current_date - 88,'11111111-1111-4111-8111-111111111102'),
  ('33333333-3333-4333-8333-333333333303','documentacao','Transferência e emplacamento',1900, current_date - 15,'11111111-1111-4111-8111-111111111103'),
  ('33333333-3333-4333-8333-333333333304','mecanica','Troca de óleo e filtros',900, current_date - 5,'11111111-1111-4111-8111-111111111101'),
  ('33333333-3333-4333-8333-333333333305','estetica','Detalhamento completo',850, current_date - 55,'11111111-1111-4111-8111-111111111104'),
  ('33333333-3333-4333-8333-333333333306','mecanica','Kit embreagem',2400, current_date - 110,'11111111-1111-4111-8111-111111111101');

insert into public.vehicle_documents (vehicle_id, doc_type, status, due_date) values
  ('33333333-3333-4333-8333-333333333301','CRLV','ok', current_date + 120),
  ('33333333-3333-4333-8333-333333333302','IPVA','pendente', current_date + 12),
  ('33333333-3333-4333-8333-333333333303','ATPV-e','pendente', current_date + 5),
  ('33333333-3333-4333-8333-333333333304','Licenciamento','incompleta', current_date + 30);

insert into public.vehicle_checklist (vehicle_id, item, done, position) values
  ('33333333-3333-4333-8333-333333333304','Revisão mecânica', true, 0),
  ('33333333-3333-4333-8333-333333333304','Funilaria e pintura', false, 1),
  ('33333333-3333-4333-8333-333333333304','Higienização interna', false, 2),
  ('33333333-3333-4333-8333-333333333304','Sessão de fotos', false, 3),
  ('33333333-3333-4333-8333-333333333304','Documentação em dia', false, 4);

insert into public.vehicle_sales (vehicle_id, sale_date, sold_value, customer_id, buyer_name, buyer_phone, payment_method, is_financed, bank, financed_value, down_payment, commission_value, sale_expenses) values
  ('33333333-3333-4333-8333-333333333306', current_date - 20, 74000, '22222222-2222-4222-8222-222222222201','Carlos Ferreira','5544998880001','financiamento', true,'Banco Votorantim',54000,20000,1200,600);

insert into public.garage_expenses (category, description, value, expense_date) values
  ('aluguel','Aluguel do pátio', 6500, date_trunc('month', current_date)::date),
  ('marketing','Impulsionamento redes sociais', 1200, date_trunc('month', current_date)::date + 3),
  ('funcionarios','Folha de pagamento', 9800, date_trunc('month', current_date)::date + 4),
  ('energia','Conta de energia', 780, date_trunc('month', current_date)::date + 6);

insert into public.leads (vehicle_id, name, phone, message, status) values
  ('33333333-3333-4333-8333-333333333301','Patrícia Souza','5544997770001','Tenho interesse no Corolla, aceita troca?','novo'),
  ('33333333-3333-4333-8333-333333333303','Renato Dias','5544997770002','Qual o valor à vista no Compass?','em_contato');