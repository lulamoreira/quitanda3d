alter table public.pieces 
add column if not exists stlflix_slug text,
add column if not exists stlflix_code text,
add column if not exists stlflix_url text,
add column if not exists print_time_mono text,
add column if not exists print_time_multi text,
add column if not exists height_cm text,
add column if not exists full_description text;

-- Add a column to track the source of the drop/piece for clarity
alter table public.pieces
add column if not exists source text;
