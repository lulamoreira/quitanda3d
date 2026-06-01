alter table public.pieces
add column if not exists makerworld_url text,
add column if not exists makerworld_model_id text;
