-- Adiciona coluna discord_message_id à tabela drops
ALTER TABLE public.drops 
ADD COLUMN discord_message_id TEXT;

-- Cria um índice único parcial para discord_message_id (apenas quando não for nulo)
CREATE UNIQUE INDEX idx_drops_discord_message_id_unique 
ON public.drops (discord_message_id) 
WHERE discord_message_id IS NOT NULL;