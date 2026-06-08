DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Upload' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Allow Public Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'drop-assets');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow Public Update' AND tablename = 'objects' AND schemaname = 'storage') THEN
        CREATE POLICY "Allow Public Update" ON storage.objects FOR UPDATE USING (bucket_id = 'drop-assets');
    END IF;
END $$;
GRANT ALL ON storage.objects TO anon;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO anon;
GRANT ALL ON storage.buckets TO authenticated;