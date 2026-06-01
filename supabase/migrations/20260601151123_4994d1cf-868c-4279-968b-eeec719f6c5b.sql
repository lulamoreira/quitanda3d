create table public.drops (
  id uuid primary key default gen_random_uuid(),
  drop_name text not null,
  description text,
  drop_image_url text,
  drop_link text,
  source text default 'manual',
  created_at timestamptz default now()
);

create table public.pieces (
  id uuid primary key default gen_random_uuid(),
  drop_id uuid references public.drops(id) on delete cascade,
  name text not null,
  image_url text,
  piece_url text,
  active boolean default false,
  price_figura numeric,
  price_chaveiro numeric,
  available_as text default 'ambos',
  status text default 'pendente',
  filament_grams numeric,
  print_hours numeric,
  created_at timestamptz default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  piece_id uuid references public.pieces(id) on delete cascade,
  platform text not null,
  title text,
  description_ml text,
  description_shopee text,
  caption_instagram text,
  caption_tiktok text,
  hashtags text,
  price numeric,
  published_at timestamptz default now(),
  status text default 'ativo'
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id),
  piece_id uuid references public.pieces(id),
  platform text,
  quantity integer default 1,
  unit_price numeric,
  commission_rate numeric,
  production_cost numeric,
  gross_revenue numeric,
  net_profit numeric,
  sale_date date default current_date,
  created_at timestamptz default now()
);

create table public.cost_settings (
  id uuid primary key default gen_random_uuid(),
  filament_price_per_kg numeric default 80,
  energy_cost_per_hour numeric default 0.80,
  packaging_cost numeric default 2,
  ml_commission_rate numeric default 14,
  shopee_commission_rate numeric default 18,
  desired_margin numeric default 40,
  updated_at timestamptz default now()
);

-- Inserir registro padrão
insert into public.cost_settings (filament_price_per_kg, energy_cost_per_hour, packaging_cost, ml_commission_rate, shopee_commission_rate, desired_margin)
values (80, 0.80, 2, 14, 18, 40);

-- Permissões
grant select, insert, update, delete on public.drops to anon, authenticated;
grant select, insert, update, delete on public.pieces to anon, authenticated;
grant select, insert, update, delete on public.listings to anon, authenticated;
grant select, insert, update, delete on public.sales to anon, authenticated;
grant select, insert, update, delete on public.cost_settings to anon, authenticated;
grant all on public.drops to service_role;
grant all on public.pieces to service_role;
grant all on public.listings to service_role;
grant all on public.sales to service_role;
grant all on public.cost_settings to service_role;

-- Desativar RLS nesta fase inicial
alter table public.drops disable row level security;
alter table public.pieces disable row level security;
alter table public.listings disable row level security;
alter table public.sales disable row level security;
alter table public.cost_settings disable row level security;
