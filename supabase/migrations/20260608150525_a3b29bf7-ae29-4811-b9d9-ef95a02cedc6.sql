-- Permitir leitura pública para arquivos no bucket drop-assets
CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING (bucket_id = 'drop-assets');

-- Permitir que usuários autenticados façam upload
CREATE POLICY "Authenticated Upload Access" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'drop-assets');

-- Permitir que usuários autenticados atualizem seus arquivos
CREATE POLICY "Authenticated Update Access" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'drop-assets');
