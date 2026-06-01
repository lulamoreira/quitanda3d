alter table public.drops enable row level security;
alter table public.pieces enable row level security;
alter table public.listings enable row level security;
alter table public.sales enable row level security;
alter table public.cost_settings enable row level security;

create policy "Allow all access" on public.drops for all using (true) with check (true);
create policy "Allow all access" on public.pieces for all using (true) with check (true);
create policy "Allow all access" on public.listings for all using (true) with check (true);
create policy "Allow all access" on public.sales for all using (true) with check (true);
create policy "Allow all access" on public.cost_settings for all using (true) with check (true);
