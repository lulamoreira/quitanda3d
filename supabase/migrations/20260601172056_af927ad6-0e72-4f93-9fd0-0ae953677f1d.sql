alter table public.pieces
add column if not exists drive_url text,
add column if not exists material text,
add column if not exists print_notes text,
add column if not exists print_time_estimated text;
